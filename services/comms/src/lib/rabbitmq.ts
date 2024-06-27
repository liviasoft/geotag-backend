import amqp, { Channel } from 'amqplib';
import { config } from '../utils/config';
import { ServiceEvent } from '@neoncoder/typed-service-response';

let channel: amqp.Channel;

export const setChannel = (newChannel: Channel) => {
  channel = newChannel;
};

export const getChannel = () => channel;

const {
  rabbitMQ: r,
  self: { emoji, name: serviceName },
} = config;

export const rabbitMQConnect = async ({ url = r.url, queue = r.queue, exchange = r.exchange }) => {
  try {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });
    await channel.assertExchange(exchange, 'fanout');
    console.log(`🚀 ${emoji} \t${serviceName} RabbitMQ connected`);
    return channel;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const sendToQueues = async <K extends string, T = any>(
  channel: Channel = getChannel(),
  message: ServiceEvent<K, T>,
  services: string[] = [],
) => {
  const promises: any[] = [];
  services.forEach(async (service) => {
    await channel.assertQueue(service);
    promises.push(channel.sendToQueue(service, Buffer.from(JSON.stringify(message)), { persistent: true }));
  });
  const results = await Promise.all(promises);
  console.log(results);
};
