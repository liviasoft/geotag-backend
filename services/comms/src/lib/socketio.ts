import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { config } from '../utils/config';

let io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

const setIO = (server: any) => {
  console.log({ path: `${config.self.publicUrl}/socket` });
  io = new Server(server, {
    cors: {
      origin: '*',
    },
    path: `/${config.self.basePath}/socket`,
  });
  return io;
};

const getIO = () => io;

export { setIO, getIO };
