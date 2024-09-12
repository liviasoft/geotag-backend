import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import { healthCheckHandler } from './controllers/default';
import { getUserIfLoggedIn, validateAuthTokens } from './middleware/auth';
import { getAppScopes, getAppSettings } from './middleware/settings';
import { limiter, timeout } from './middleware/reqTimeout';
import { appRoutes } from './routes/index.routes';

const app = express();

app.use(
  cors({
    credentials: true,
    origin: ['http://localhost:3001', 'https://emf-frontend-staging.up.railway.app'],
  }),
);
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());
app.use(getAppSettings);
app.use(getAppScopes);
app.use(validateAuthTokens);
app.use(getUserIfLoggedIn);
app.use(fileUpload({ useTempFiles: true }));

app.get('/ping', (_, res) => res.status(200).send('pong'));
app.get('/health', healthCheckHandler);
app.use('/api/v1', limiter, timeout, appRoutes);

app.get('/', async (_, res) => {
  const data = res.locals;
  return res.status(200).send({ message: 'OK', data });
});

export { app };
