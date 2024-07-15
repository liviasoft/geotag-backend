import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { filesServiceRoutes } from './routes/index.routes';

const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/files', filesServiceRoutes);
app.get('/ping', (_, res) => res.status(200).send('pong'));

app.get('/', async (_, res) => {
  const data = res.locals;
  return res.status(200).send({ message: 'OK', data });
});

export { app };
