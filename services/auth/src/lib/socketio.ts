import { Server } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

let io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

const setIO = (server: any, path: string) => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
    path,
  });
  return io;
};

const getIO = () => io;

export { setIO, getIO };
