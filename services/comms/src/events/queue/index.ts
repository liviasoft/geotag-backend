import { Channel } from 'amqplib';
import { authJobsHandler } from './auth.jobs';
import { ServiceEvent } from '@neoncoder/typed-service-response';

export const queueEventHandlers = async (msg: any, channel: Channel) => {
  const message = JSON.parse(msg.content.toString()) as ServiceEvent<any>;
  switch (message.origin) {
    case 'auth':
      {
        const result = await authJobsHandler(message);
        console.log(result.message);
        if (result.statusType === 'OK') {
          channel.ack(msg);
        }
      }
      break;
    default:
      console.log('Event Origin service not recognized / handled');
      channel.ack(msg);
      break;
  }
};
