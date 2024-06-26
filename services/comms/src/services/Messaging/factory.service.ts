import { EmailMessageSender } from './Email.service';
import { PushNotificationMessageSender } from './PushNotification.service';
import { SMSMessageSender } from './SMS.service';
import { TMessageType } from './BaseClass.service';

/**
 * Factory class for creating message sender instances.
 */
export class MessageSenderFactory {
  /**
   * Returns an instance of the appropriate message sender based on the type.
   *
   * @static
   * @method {@link getSender}
   * @param {TMessageType} type - The type of message sender to create.
   * @param {any} [settings] - The application settings.
   * @returns {EmailMessageSender | SMSMessageSender | PushNotificationMessageSender} The message sender instance.
   * @throws {Error} If an invalid message type is provided.
   * @example
   * const emailSender = MessageSenderFactory.getSender('EMAIL', appSettings);
   * const smsSender = MessageSenderFactory.getSender('SMS', appSettings);
   * const pushNotificationSender = MessageSenderFactory.getSender('PUSH_NOTIFICATION', appSettings);
   */
  static getSender(type: TMessageType, settings?: any) {
    switch (type) {
      case 'EMAIL':
        return new EmailMessageSender(settings);
      case 'SMS':
        return new SMSMessageSender(settings);
      case 'PUSH_NOTIFICATION':
        return new PushNotificationMessageSender(settings);
      default:
        throw new Error('Invalid notification Type');
    }
  }
}
