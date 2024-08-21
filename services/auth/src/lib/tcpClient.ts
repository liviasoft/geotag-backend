import { CustomErrorByType } from '@neoncoder/typed-service-response';
import net from 'net';
// import { Response } from 'express';

export class TCPClientFactory {
  static createTCPClient({ port = 9001, host = '192.168.1.107' }): net.Socket {
    const tcpClient = new net.Socket();
    try {
      tcpClient.connect(port, host, () => {
        console.log(`TCP Client Connected: ${tcpClient.remoteAddress}:${tcpClient.remotePort}`);
      });

      // // tcpClient.connect();
      // tcpClient.on('data', (data) => {
      //   console.log({ serverReply: data.toString() });
      // });
      tcpClient.on('close', () => {
        console.log('Connection closed');
      });
      tcpClient.on('error', (err) => {
        throw err;
      });
      tcpClient.on('timeout', () => {
        throw new CustomErrorByType({ type: 'Timeout', message: `TCP Client Timeeout` });
      });
      return tcpClient;
    } catch (error: any) {
      console.log({ error });
      throw error;
    }
  }
}

export type SCPICommandParams = {
  host: string;
  port: number;
  command: string;
};

export const sendScpiCommand = (
  scpiCommand: SCPICommandParams,
  callback: (err: Error | null, response?: string) => any,
) => {
  const client = new net.Socket();
  const { port, host, command } = scpiCommand;
  client.connect(port, host, () => {
    console.log('Connected to device');
    client.write(command + '\n');
  });

  client.on('data', async (data) => {
    console.log('Received: ' + data);
    client.destroy(); // kill client after server's response
    await callback(null, data.toString());
  });

  client.on('close', () => {
    console.log('Connection closed');
  });

  client.on('error', async (err) => {
    console.log('Error: ' + err.message);
    await callback(err);
  });
};

export function sendTCPMessage(
  host: string,
  port: number,
  message: string,
): Promise<{ response: string | null; error: any | null }> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();

    client.connect(port, host, () => {
      console.log(`Connected to ${host}:${port}`);
      client.write(message + '\n');
    });

    client.on('data', (data) => {
      console.log(`Received: ${data}`);
      resolve({ response: data.toString(), error: null });
      client.destroy(); // Close the connection
    });

    client.on('error', (err) => {
      console.error(`Connection error: ${err.message}`);
      reject({ response: null, error: err });
    });

    client.on('close', () => {
      console.log('Connection closed');
    });
  });
}
