import amqp from 'amqplib';

let channel: amqp.Channel;

export const setChannel = async (url: string, queue: string, exchange: string) => {
  try {
    console.log({ url, queue, exchange });
    const connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });
    await channel.assertExchange(exchange, 'fanout');
  } catch (error) {
    console.log(error);
  }
};

export const getChannel = () => channel;

export const rabbitMQConnect = async (
  url: string,
  queue: string,
  exchange: string,
  serviceName: string,
  emoji = '🐰',
) => {
  try {
    const connection = await amqp.connect(url);
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });
    await channel.assertExchange(exchange, 'fanout');
    console.log(`🚀 ${emoji} \t${serviceName} RabbitMQ connected`);
    return { error: null, channel, connection };
  } catch (error) {
    console.log(error);
    return { error, channel: null, connection: null };
  }
};
