import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { filesServiceRoutes } from './routes/index.routes';
import { notFoundHandler } from './controllers/default.controllers';
import { getProxyMeta } from './middleware/auth';

const app = express();

// app.use(cors());
app.use(
  cors({
    credentials: true,
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
      'https://emf-frontend-staging.up.railway.app',
      'https://auth-service-staging-9064.up.railway.app',
    ],
  }),
);
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());
app.use(getProxyMeta);

app.use('/api/v1/files', filesServiceRoutes);
app.get('/ping', (_, res) => res.status(200).send('pong'));

app.get('/', async (_, res) => {
  const data = res.locals;
  return res.status(200).send({ message: 'OK', data });
});

app.use('*', notFoundHandler);

export { app };
