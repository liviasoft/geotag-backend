import net from 'net';
// const port = 7071;
// const host = '127.0.0.1';

// let TCPClient: net.Socket;

// export const setTCPClient = () => {
//   TCPClient = new net.Socket();
//   TCPClient.connect(port, host, () => {
//     console.log(`TCP Client connected`);
//   });
//   TCPClient.on('data', (data) => {
//     console.log({ serverReply: data.toString() });
//   });
//   TCPClient.on('close', () => {
//     console.log('Connection closed');
//   });
// };

// export const getTCPClient = () => TCPClient;

// class TCPClient {
//   tcpClient: net.Socket;
//   result: any;

//   constructor({ port, host }: { port: number; host: string }) {
//     this.tcpClient = net.createConnection({ port, host }, () => {
//       console.log(`TCP Client Connected: ${this.tcpClient.remoteAddress}:${this.tcpClient.remotePort}`);
//     });
//     this.tcpClient.on('data', (data) => {
//       this.result += data;
//       console.log({ serverReply: data.toString() });
//     });
//     this.tcpClient.on('close', () => {
//       console.log('Connection closed');
//     });
//   }

//   write(string: string, cb?: (err?: Error | undefined) => void) {
//     return new Promise((resolve) => {
//       this.result = this.tcpClient.write(string, cb);
//       resolve(this);
//     });
//   }

//   end(cb?: () => void) {
//     return this.tcpClient.end(cb);
//   }

//   destroy() {
//     return new Promise((resolve) => {
//       this.result = this.tcpClient.destroy();
//       resolve(this);
//     });
//   }
// }

export class TCPClientFactory {
  static createTCPClient({ port = 9001, host = '192.168.1.107' }): net.Socket {
    const tcpClient = new net.Socket();
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
    return tcpClient;
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
    client.write(command + '\n', async (err) => {
      if (err) {
        await callback(err);
        client.destroy();
      } else if (command.charAt(command.length - 1) !== '?') {
        await callback(null, `Command Sent: ${command}`);
        client.destroy();
      }
    });
  });

  client.on('data', async (data) => {
    console.log('Received: ' + data);
    client.destroy(); // kill client after server's response
    return await callback(null, data.toString());
  });

  client.on('close', () => {
    console.log('Connection closed');
  });

  client.on('error', async (err) => {
    console.log('Error: ' + err.message);
    client.destroy();
    return await callback(err);
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
      client.write(message + '\n', (err) => {
        if (err) {
          reject({ response: null, error: err });
          client.destroy();
        } else if (message.charAt(message.length - 1) !== '?') {
          client.destroy();
          resolve({ response: `Command Sent: ${message}`, error: null });
        }
      });
    });

    client.on('data', (data) => {
      console.log(`Received: ${data}`);
      resolve({ response: data.toString(), error: null });
      client.destroy(); // Close the connection
    });

    client.on('error', (err) => {
      console.error(`Connection error: ${err.message}`);
      reject({ response: null, error: err });
      client.destroy();
    });

    client.on('close', () => {
      console.log('Connection closed');
    });
  });
}
