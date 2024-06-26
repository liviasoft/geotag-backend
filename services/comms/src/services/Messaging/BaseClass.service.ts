import { CustomErrorByType, TStatus } from '@neoncoder/typed-service-response';
import { sanitizeData } from '@neoncoder/validator-utils';
import { MessageTemplate } from '@prisma/client';
import { MessageTemplatePostgresService } from '../../modules/postgres/messageTemplates.pg';
import Handlebars from 'handlebars';
import { fakerMessageDefaults as fakerDefaults } from '../../utils/helpers/fakerDefaults';
import { KeysToUppercase } from './providerUtils.service';
import Mail from 'nodemailer/lib/mailer';

const messageTypes = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH_NOTIFICATION: 'PUSH_NOTIFICATION',
};

export type SMSOptions = {
  body: string;
  from: string;
  to: string;
};

export type PUSHNotificationOptions = {
  title: string;
  body: string;
};

export type MessageOptions = {
  EMAIL?: Mail.Options;
  SMS?: SMSOptions;
  PUSH_NOTIFICATION?: PUSHNotificationOptions;
};

export type TMessageType = keyof typeof messageTypes;

/**
 * Abstract class representing a message sender.
 * @abstract
 */
export abstract class IMessageSender {
  /**
   * The type of message (EMAIL, SMS, or PUSH_NOTIFICATION).
   * @type {TMessageType}
   */
  abstract messageType: TMessageType;

  /**
   * Application settings.
   * @type {any}
   */
  abstract appSettings?: any;

  /**
   * Service to interact with the message template database.
   * @type {MessageTemplatePostgresService}
   */
  templateDB: MessageTemplatePostgresService = new MessageTemplatePostgresService({});

  /**
   * The message template used to format the message.
   * @type {MessageTemplate}
   */
  messageTemplate?: MessageTemplate;

  /**
   * Indicates if the message sender is ready.
   * @type {boolean}
   */
  isReady: boolean = false;

  /**
   * The formatted message.
   * @type {string}
   */
  message: string = '';

  /**
   * Error encountered during the message sending process.
   * @type {Error | null}
   */
  abstract error: Error | null;

  /**
   * Handlebars compiler for the message template.
   * @type {Handlebars.TemplateDelegate<any> | undefined}
   */
  abstract compiler?: Handlebars.TemplateDelegate<any>;

  /**
   * The selected provider for sending the message.
   * @type {string | null}
   */
  abstract selectedProvider: string | null;

  /**
   * Sends the message using the selected provider.
   * @async @method {@link sendMessage}
   * @param {any} message - The message to be sent.
   * @returns {Promise<this>} The current instance of {@link IMessageSender}.
   * @example
   * const sender = new EmailSender();
   * await sender.sendMessage({ to: 'example@example.com', subject: 'Hello', body: 'Hi there!' });
   */
  abstract sendMessage(message: any): Promise<this>;

  abstract sendAttempt(): Promise<this>;
  /**
   * Prepares the transport for sending the message.
   * @async @method {@link prepareTransport}
   * @returns {Promise<this>} The current instance of {@link IMessageSender}.
   * @example
   * const sender = new EmailSender();
   * await sender.prepareTransport();
   */
  abstract prepareTransport(): Promise<this>;

  /**
   * Formats the message using the provided data and message template.
   * @method {@link formatMessage}
   * @param {any} [messageData] - The data to be used in the message template.
   * @param {MessageTemplate} [messageTemplate=this.messageTemplate] - The message template to be used.
   * @returns {this} The current instance of {@link IMessageSender}.
   * @example
   * const sender = new EmailSender();
   * sender.formatMessage({ name: 'John Doe' });
   */
  formatMessage = (messageData?: any, messageTemplate: MessageTemplate = this.messageTemplate!): this => {
    this.assertCompilerReady();
    const { requiredFields } = messageTemplate;
    const data = KeysToUppercase(messageData);
    const resolvedData = sanitizeData(requiredFields, data ?? fakerDefaults);
    if (Object.keys(resolvedData).length !== requiredFields.length) {
      this.error = new CustomErrorByType({ type: 'BadRequest', message: 'Missing Required fields' });
      console.log(Object.keys(resolvedData), requiredFields);
      throw this.error;
    }
    this.message = this.compiler(resolvedData);
    return this;
  };

  /**
   * Sets up the Handlebars compiler using the provided message template.
   * @method {@link setupCompiler}
   * @param {MessageTemplate} [messageTemplate=this.messageTemplate] - The message template to be used.
   * @returns {this} The current instance of {@link IMessageSender}.
   * @throws {CustomErrorByType} If the message template is missing.
   * @example
   * const sender = new EmailSender();
   * await sender.getMessageTemplate('WelcomeEmail');
   * sender.setupCompiler();
   */
  setupCompiler(messageTemplate: MessageTemplate = this.messageTemplate!): this {
    this.assertMessageTemplateReady(messageTemplate);
    const { emailTemplate, smsTemplate, pushNotificationTemplate, name: templateName } = messageTemplate;
    const templateContent =
      this.messageType === 'EMAIL'
        ? emailTemplate
        : this.messageType === 'SMS'
          ? smsTemplate
          : pushNotificationTemplate;
    if (templateContent) {
      this.compiler = Handlebars.compile(templateContent);
    } else {
      this.error = new CustomErrorByType({
        type: 'NotFound',
        message: `${this.messageType} Template missing from ${templateName} message`,
      });
      throw this.error;
    }
    return this;
  }

  /**
   * Retrieves a message template by name and sets up the compiler.
   * @async @method {@link getMessageTemplate}
   * @param {string} name - The name of the message template.
   * @returns {Promise<this>} The current instance of {@link IMessageSender}.
   * @throws {CustomErrorByType} If the message template is not found.
   * @example
   * const sender = new EmailSender();
   * await sender.getMessageTemplate('WelcomeEmail');
   */
  async getMessageTemplate(name: string): Promise<this> {
    const result = (await this.templateDB.findFirst({ filters: { name } })).result! as TStatus<
      'messageTemplate',
      MessageTemplate
    >;
    this.messageTemplate = result.data?.messageTemplate as MessageTemplate;
    if (!this.messageTemplate) {
      this.error = new CustomErrorByType({ type: 'NotFound', message: `Selected message template ${name} NOT FOUND` });
      console.log(this.error.stack);
      throw this.error;
    }
    this.setupCompiler();
    return this;
  }

  /**
   * Stores the sent message in the database.
   * @async @method {@link storeSentMessage}
   * @returns {Promise<this>} The current instance of {@link IMessageSender}.
   * @example
   * const sender = new EmailSender();
   * await sender.storeSentMessage();
   */
  abstract storeSentMessage(options: any, messageId: string): Promise<this>;

  /**
   * Asserts that the compiler is ready.
   * @private
   * @throws {CustomErrorByType} If the compiler is not ready.
   */
  private assertCompilerReady(): asserts this is this & { compiler: Handlebars.TemplateDelegate<any> } {
    if (!this.compiler) {
      this.error = new CustomErrorByType({
        type: 'UnprocessableEntity',
        message: 'Message Template compiler not ready',
      });
      throw this.error;
    }
  }

  /**
   * Asserts that the message template is ready.
   * @private
   * @param {MessageTemplate} [messageTemplate] - The message template to be checked.
   * @throws {CustomErrorByType} If the message template is not ready.
   */
  private assertMessageTemplateReady(
    messageTemplate?: MessageTemplate,
  ): asserts this is this & { messageTemplate: MessageTemplate } {
    if (!messageTemplate && !this.messageTemplate) {
      this.error = new CustomErrorByType({ type: 'BadRequest', message: 'Invalid message template selected' });
      throw this.error;
    }
  }
}
