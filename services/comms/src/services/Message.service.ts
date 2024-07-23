import { getObjectKeys } from '@neoncoder/validator-utils';
import { TMessageType, IMessageSender, MessageOptions } from './Messaging/BaseClass.service';
import { MessageSenderFactory } from './Messaging/factory.service';
import { MESSAGE_TEMPLATES } from './Messaging/messageTemplatesTypes';
import { PrismaClient, User } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { CustomErrorByType } from '@neoncoder/typed-service-response';

/**
 * Service for managing and sending messages.
 */
export class MessagingService {
  /**
   * The senders for each message type.
   * @type {{ [key in TMessageType]: IMessageSender | null }}
   */
  senders: { [key in TMessageType]: IMessageSender | null } = {
    EMAIL: null,
    SMS: null,
    PUSH_NOTIFICATION: null,
  };

  /**
   * The types of messages to send.
   * @type {TMessageType[]}
   */
  messageTypes: TMessageType[];

  messageTemplateId?: string;

  prisma: PrismaClient;
  /**
   * Creates an instance of MessagingService.
   * @param {TMessageType[]} messageTypes - The types of messages to send.
   * @param {any} [appSettings] - The application settings.
   * @constructor
   */
  constructor(messageTypes: TMessageType[], appSettings?: any) {
    this.messageTypes = messageTypes;
    messageTypes.forEach((type) => {
      const check = `SEND_${type}_ENABLED`;
      this.senders[type] = appSettings[check] ? MessageSenderFactory.getSender(type, appSettings) : null;
    });
    this.prisma = getPrismaClient(false);
  }

  /**
   * Prepares the message template for each enabled sender.
   * @async @method {@link prepareTemplate}
   * @param {keyof typeof MESSAGE_TEMPLATES} templateName - The name of the message template to prepare.
   * @returns {Promise<void>}
   * @example
   * const messagingService = new MessagingService(['EMAIL', 'SMS'], appSettings);
   * await messagingService.prepareTemplate('WelcomeMessage');
   */
  async prepareTemplate(templateName: keyof typeof MESSAGE_TEMPLATES): Promise<void> {
    const template = await this.prisma.messageTemplate.findFirst({ where: { name: templateName } });
    if (!template) {
      throw new CustomErrorByType({ type: 'BadRequest', message: `Message template - ${templateName} - not found` });
    }
    this.messageTemplateId = template.id;
    for (const type in this.senders) {
      if (this.senders[type as TMessageType]) {
        await this.senders[type as TMessageType]!.prepareTransport();
        await this.senders[type as TMessageType]!.getMessageTemplate(templateName);
      }
    }
  }

  /**
   * Sends messages using the appropriate senders.
   * @async @method {@link sendMessage}
   * @param {any} message - The message to be sent.
   * @returns {Promise<void>}
   * @example
   * const messagingService = new MessagingService(['EMAIL', 'SMS'], appSettings);
   * await messagingService.sendMessage({ to: 'example@example.com', body: 'Hello, World!' });
   */
  async sendMessage(data: any, recipient: User, options: MessageOptions): Promise<void> {
    const { id: messageId } = await this.prisma.message.create({
      data: {
        messageTemplateId: this.messageTemplateId!,
        recipient: recipient.id,
      },
    });
    await Promise.all(
      getObjectKeys(this.senders).map(async (type) => {
        if (this.senders[type]) {
          const sender = this.senders[type]!.formatMessage(data);
          await sender.templateDB.prisma.$transaction(async (tx) => {
            // Store the message
            await sender.storeSentMessage(options[type], messageId);
            // Attempt to send the message
            try {
              const sendResult = await sender.sendAttempt();
              console.log(tx);
              if (type === 'EMAIL') {
                await tx.email.update({
                  where: { id: messageId },
                  data: {
                    status: 'SENT',
                    response: JSON.stringify(sendResult),
                  },
                });
              }
              if (type === 'SMS') {
                await tx.sMS.update({
                  where: { id: messageId },
                  data: {
                    status: 'SENT',
                    response: JSON.stringify(sendResult),
                  },
                });
              }
              if (type === 'PUSH_NOTIFICATION') {
                await tx.pushNotification.update({
                  where: { id: messageId },
                  data: {
                    status: 'SENT',
                    response: JSON.stringify(sendResult),
                  },
                });
              }
              console.log({ sendResult });
            } catch (error) {
              console.log({ error });
              if (type === 'EMAIL') {
                await tx.email.update({
                  where: { id: messageId },
                  data: {
                    status: 'FAILED',
                    response: JSON.stringify(error),
                  },
                });
              }
              if (type === 'SMS') {
                await tx.sMS.update({
                  where: { id: messageId },
                  data: {
                    status: 'FAILED',
                    response: JSON.stringify(error),
                  },
                });
              }
              if (type === 'PUSH_NOTIFICATION') {
                await tx.pushNotification.update({
                  where: { id: messageId },
                  data: {
                    status: 'FAILED',
                    response: JSON.stringify(error),
                  },
                });
              }
              console.log({ error });
              throw error;
            }
          });
        }
      }),
    );
  }

  // /**
  //  * Sends a message using the appropriate sender.
  //  * @async @method {@link sendMessage}
  //  * @param {TMessageType} type - The type of message to send.
  //  * @param {any} message - The message to be sent.
  //  * @returns {Promise<void>}
  //  * @example
  //  * const messagingService = new MessagingService(['EMAIL', 'SMS'], appSettings);
  //  * await messagingService.sendMessage('EMAIL', { to: 'example@example.com', body: 'Hello, World!' });
  //  */
  // async sendMessage(type: TMessageType, message: any): Promise<void> {
  //   if (this.senders[type]) {
  //     await this.senders[type]!.sendMessage(message);
  //   } else {
  //     throw new Error(`No sender configured for message type: ${type}`);
  //   }
  // }

  // /**
  //  * Stores the sent messages for each sender.
  //  * @async @method {@link storeSentMessages}
  //  * @returns {Promise<void>}
  //  * @example
  //  * const messagingService = new MessagingService(['EMAIL', 'SMS'], appSettings);
  //  * await messagingService.storeSentMessages();
  //  */
  // async storeSentMessages(): Promise<void> {
  //   for (const type in this.senders) {
  //     if (this.senders[type as TMessageType]) {
  //       await this.senders[type as TMessageType]!.storeSentMessage();
  //     }
  //   }
  // }

  /**
   * Retrieves the initialized senders.
   * @method {@link getSenders}
   * @returns {{ [key in TMessageType]: IMessageSender | null }} The initialized senders.
   * @example
   * const messagingService = new MessagingService(['EMAIL', 'SMS'], appSettings);
   * const senders = messagingService.getSenders();
   */
  getSenders(): { [key in TMessageType]: IMessageSender | null } {
    return this.senders;
  }

  /**
   * Checks the status of the senders to ensure they are ready to send messages.
   * @method {@link checkSenderStatus}
   * @returns {void}
   * @example
   * const messagingService = new MessagingService(['EMAIL', 'SMS'], appSettings);
   * messagingService.checkSenderStatus();
   */
  checkSenderStatus(): void {
    for (const type in this.senders) {
      if (this.senders[type as TMessageType] && !this.senders[type as TMessageType]!.isReady) {
        throw new Error(`Sender for type ${type} is not ready`);
      }
    }
  }
}
