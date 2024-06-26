import nodemailer, { Transporter } from 'nodemailer';
import { IMessageSender, TMessageType } from './BaseClass.service';
import { findFirstAvailable, selectProviderConfig } from './providerUtils.service';
import { stripHTML } from '@neoncoder/validator-utils';
import Mail from 'nodemailer/lib/mailer';

/**
 * Class representing an email message sender.
 * @extends IMessageSender
 */
export class EmailMessageSender extends IMessageSender {
  /**
   * The type of message.
   * @type {TMessageType}
   */
  messageType: TMessageType = 'EMAIL';

  /**
   * Application settings.
   * @type {any}
   */
  appSettings?: any;

  /**
   * The selected provider for sending the message.
   * @type {string | null}
   */
  selectedProvider: string | null;

  /**
   * The transporter used to send emails.
   * @type {Transporter | undefined}
   */
  transporter?: Transporter;

  /**
   * The formatted message.
   * @type {string}
   */
  message: string = '';

  /**
   * Error encountered during the message sending process.
   * @type {Error | null}
   */
  error: Error | null;

  /**
   * Handlebars compiler for the message template.
   * @type {Handlebars.TemplateDelegate<any> | undefined}
   */
  compiler?: Handlebars.TemplateDelegate<any>;

  storedMessage?: Record<string, any>;

  /**
   * Creates an instance of EmailMessageSender.
   * @param {any} [settings] - The application settings.
   */
  constructor(settings?: any) {
    super();
    this.appSettings = settings ?? null;
    this.selectedProvider = null;
    this.error = null;
    this.compiler = undefined;
  }

  async sendAttempt(): Promise<any> {
    const { options } = this.storedMessage!;
    console.log({ options });

    const result = await this.transporter?.sendMail(options);
    console.log({ result });
    return result;
  }

  /**
   * Sends the email message.
   * @async @method {@link sendMessage}
   * @param {any} message - The message to be sent.
   * @returns {Promise<this>} The current instance of {@link EmailMessageSender}.
   * @example
   * const sender = new EmailMessageSender(appSettings);
   * await sender.prepareTransport();
   * await sender.sendMessage({ to: 'example@example.com', subject: 'Hello', body: 'Hi there!' });
   */
  async sendMessage(message: any): Promise<this> {
    console.log({ message });
    await this.transporter?.sendMail({});
    return this;
  }

  /**
   * Stores the sent message in the database.
   * @async @method {@link storeSentMessage}
   * @returns {Promise<this>} The current instance of {@link EmailMessageSender}.
   * @example
   * const sender = new EmailMessageSender(appSettings);
   * await sender.storeSentMessage();
   */
  async storeSentMessage(options: Mail.Options, messageId: string): Promise<this> {
    const { to, cc, bcc, subject, priority, icalEvent } = options;
    const mailOptions: Mail.Options = {
      from: `${this.appSettings.APP_NAME} ${this.appSettings.EMAIL_SENDER_ADDRESS}`, // something like noreply@APP_NAME.com
      to, // list of recipient emails
      cc, // list of cc emails
      bcc, // list of bcc emails
      subject,
      html: this.message,
      text: stripHTML(this.message),
      priority,
      icalEvent,

      // icalEvent: {
      //   filename: '', // path to file
      //   method: 'REQUEST', // allow user to request or decline
      //   content: '1234', // use ical-generator package to generate
      //   // see example https://stackoverflow.com/questions/67293225/nodemailer-and-ical-generator-to-send-calendar-invite
      //   // package homepage https://www.npmjs.com/package/@neoncoder/geolocation-data
      // },
    };
    console.log({ mailOptions });
    this.storedMessage = await this.templateDB.prisma.email.create({
      data: {
        id: messageId,
        content: this.message,
        provider: this.selectedProvider!,
        attempts: 1,
        options: JSON.parse(JSON.stringify(mailOptions)),
      },
    });
    return this;
  }

  /**
   * Prepares the transport for sending the email.
   * @async @method {@link prepareTransport}
   * @returns {Promise<this>} The current instance of {@link EmailMessageSender}.
   * @throws {Error} If no active provider is found.
   * @example
   * const sender = new EmailMessageSender(appSettings);
   * await sender.prepareTransport();
   */
  async prepareTransport(): Promise<this> {
    const settingKey = `SERVICE_PROVIDERS_${this.messageType}`;
    this.selectedProvider = findFirstAvailable(this.appSettings[settingKey]);
    if (!this.selectedProvider) throw new Error(`No Active Provider ${settingKey}`);
    const providerConfig = await selectProviderConfig(this.messageType, this.selectedProvider);
    console.log({ providerConfig });
    this.transporter = nodemailer.createTransport({
      ...providerConfig,
    });
    return this;
  }
}
