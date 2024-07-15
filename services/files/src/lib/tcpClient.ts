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
