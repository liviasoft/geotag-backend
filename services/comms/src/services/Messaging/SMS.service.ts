import { getAppSettings } from '../../modules/postgres/settings/utils';
import { IMessageSender, SMSOptions, TMessageType } from './BaseClass.service';
import { findFirstAvailable, selectProviderConfig } from './providerUtils.service';

/**
 * Class representing an SMS message sender.
 * @extends IMessageSender
 */
export class SMSMessageSender extends IMessageSender {
  /**
   * The type of message.
   * @type {TMessageType}
   */
  messageType: TMessageType = 'SMS';

  /**
   * Application settings.
   * @type {Awaited<ReturnType<typeof getAppSettings>> | undefined}
   */
  appSettings?: Awaited<ReturnType<typeof getAppSettings>>;

  /**
   * The selected provider for sending the message.
   * @type {string | null}
   */
  selectedProvider: string | null;

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

  /**
   * Creates an instance of SMSMessageSender.
   * @param {any} [settings] - The application settings.
   */
  constructor(settings?: any) {
    super();
    this.appSettings = settings ?? null;
    this.selectedProvider = null;
    this.error = null;
    this.compiler = undefined;
  }

  async sendAttempt(): Promise<this> {
    // const mailOptions = {
    //   from: 'your-email@example.com',
    //   to: message.to,
    //   subject: message.subject,
    //   text: message.body,
    // };
    // const result = await this.transporter?.sendMail(mailOptions);
    // console.log({ options });
    return this;
  }

  /**
   * Sends the SMS message.
   * @async @method {@link sendMessage}
   * @param {any} message - The message to be sent.
   * @returns {Promise<this>} The current instance of {@link SMSMessageSender}.
   * @example
   * const sender = new SMSMessageSender(appSettings);
   * await sender.prepareTransport();
   * await sender.sendMessage({ to: '+1234567890', body: 'Hi there!' });
   */
  async sendMessage(message: any): Promise<this> {
    console.log({ message });
    return this;
  }

  /**
   * Stores the sent message in the database.
   * @async @method {@link storeSentMessage}
   * @returns {Promise<this>} The current instance of {@link SMSMessageSender}.
   * @example
   * const sender = new SMSMessageSender(appSettings);
   * await sender.storeSentMessage();
   */
  async storeSentMessage(message: SMSOptions): Promise<this> {
    // const storedMessage = await this.templateDB.prisma.message.create({
    //   data: {
    //     type: this.messageType,
    //     recipient: message.to,
    //     content: JSON.stringify(message),
    //     status: 'PENDING',
    //   },
    // });
    console.log({ message });
    return this;
  }

  /**
   * Prepares the transport for sending the SMS.
   * @async @method {@link prepareTransport}
   * @returns {Promise<this>} The current instance of {@link SMSMessageSender}.
   * @throws {Error} If no active provider is found.
   * @example
   * const sender = new SMSMessageSender(appSettings);
   * await sender.prepareTransport();
   */
  async prepareTransport(): Promise<this> {
    const settingKey = `SERVICE_PROVIDERS_${this.messageType}`;
    this.selectedProvider = findFirstAvailable(this.appSettings[settingKey]);
    if (!this.selectedProvider) throw new Error(`No Active Provider ${settingKey}`);
    const providerConfig = await selectProviderConfig(this.messageType, this.selectedProvider);
    console.log({ providerConfig });
    return this;
  }
}
