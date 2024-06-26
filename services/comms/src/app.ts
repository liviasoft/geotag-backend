import express from 'express';
import { getProxyMeta } from './middleware/auth';
import { statusTypes } from '@neoncoder/typed-service-response';
import { sfff, role, roles, allRoles, rperm, rperms, specPerm } from './middleware/common.middleware';
import cors from 'cors';
import { commsServiceRoutes } from './routes/index.routes';
import { healthCheckHandler } from './controllers/default';

const app = express();

app.use(cors());
app.use(express.json());
app.use(getProxyMeta);

app.get('/ping', (req, res) => {
  res.send('Hello, TypeScript with Express!');
});

app.get('/health', healthCheckHandler);

app.use('/api/v1/comms', commsServiceRoutes);

app.get(
  '/api/v1/comms',
  sfff('comms.send_message.email'),
  role('guest', false),
  roles(['visitor'], false),
  allRoles(['user', 'admin'], false),
  rperm('backflip.create'),
  rperms('backflip', 'create', 'deleteOwn', 'readOwn'),
  specPerm('ANOTHER_SPECIAL_PERMISSION'),
  (req, res) => {
    console.log({ body: req.body, locals: res.locals });
    const sr = statusTypes.get('OK')!({ data: { meta: { ...res.locals } } });
    return res.status(sr.statusCode).send(sr);
  },
);

export { app };
