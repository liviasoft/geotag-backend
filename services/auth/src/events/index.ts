import { Channel } from 'amqplib';
import { config } from '../utils/config';
import { exchangeEventHandlers } from './exchange/index';

export const serviceEvents = async (channel: Channel): Promise<void> => {
  try {
    await channel.assertExchange(config.rabbitMQ.exchange as string, 'fanout');
    const { emoji, serviceName } = config.self;
    const q = await channel.assertQueue(config.rabbitMQ.exqueue as string, { exclusive: true });
    // const j = await channel.assertQueue(config.self.queue as string, { durable: true });
    await channel.bindQueue(q.queue, config.rabbitMQ.exchange as string, '');
    await channel.consume(q.queue, async (msg: any) => {
      const message = JSON.parse(msg.content.toString());
      console.log(
        `${emoji}📨 ${serviceName?.toUpperCase()} - exchange message: ${message.type} from ${message.origin.toUpperCase()}`,
      );
      if (Object.keys(exchangeEventHandlers).includes(message.origin)) {
        await exchangeEventHandlers[message.origin](message);
      }
      channel.ack(msg);
    });
    // await channel.consume(j.queue, async (msg: any) => {
    //   const message = JSON.parse(msg.content.toString());
    //   // queueEventHandlers(msg, channel);
    //   console.log({ message });
    // }, { noAck: false });
  } catch (error) {
    console.log(error);
  }
};
