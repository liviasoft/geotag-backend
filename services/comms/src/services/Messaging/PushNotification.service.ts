import { IMessageSender, PUSHNotificationOptions, TMessageType } from './BaseClass.service';
import { findFirstAvailable, selectProviderConfig } from './providerUtils.service';

/**
 * Class representing a push notification message sender.
 * @extends IMessageSender
 */
export class PushNotificationMessageSender extends IMessageSender {
  /**
   * The type of message.
   * @type {TMessageType}
   */
  messageType: TMessageType = 'PUSH_NOTIFICATION';

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
   * Creates an instance of PushNotificationMessageSender.
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
    // console.log({mailOptions});
    return this;
  }

  /**
   * Sends the push notification message.
   * @async @method {@link sendMessage}
   * @param {any} message - The message to be sent.
   * @returns {Promise<this>} The current instance of {@link PushNotificationMessageSender}.
   * @example
   * const sender = new PushNotificationMessageSender(appSettings);
   * await sender.prepareTransport();
   * await sender.sendMessage({ title: 'Hello', body: 'Hi there!' });
   */
  async sendMessage(message: any): Promise<this> {
    console.log({ message });
    return this;
  }

  /**
   * Stores the sent message in the database.
   * @async @method {@link storeSentMessage}
   * @returns {Promise<this>} The current instance of {@link PushNotificationMessageSender}.
   * @example
   * const sender = new PushNotificationMessageSender(appSettings);
   * await sender.storeSentMessage();
   */
  async storeSentMessage(options: PUSHNotificationOptions): Promise<this> {
    console.log({ options });
    // const storedMessage = await this.templateDB.prisma.message.create({
    //   data: {
    //     type: this.messageType,
    //     recipient: message.to,
    //     content: JSON.stringify(message),
    //     status: 'PENDING',
    //   },
    // });
    return this;
  }

  /**
   * Prepares the transport for sending the push notification.
   * @async @method {@link prepareTransport}
   * @returns {Promise<this>} The current instance of {@link PushNotificationMessageSender}.
   * @throws {Error} If no active provider is found.
   * @example
   * const sender = new PushNotificationMessageSender(appSettings);
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
