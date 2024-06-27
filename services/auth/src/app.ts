import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { healthCheckHandler } from './controllers/default';
import { getUserIfLoggedIn } from './middleware/auth';
import { getAppScopes, getAppSettings, scope } from './middleware/settings';
import { authServiceRoutes } from './routes/index.routes';
import { limiter } from './middleware/reqTimeout';

const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());
app.use(getAppSettings);
app.use(getAppScopes);
app.use(getUserIfLoggedIn);

app.get('/ping', (_, res) => res.status(200).send('pong'));
app.get('/health', healthCheckHandler);
app.use('/api/v1/auth', limiter, scope('auth'), authServiceRoutes);

app.get('/', async (_, res) => {
  const data = res.locals;
  return res.status(200).send({ message: 'OK', data });
});

export { app };
