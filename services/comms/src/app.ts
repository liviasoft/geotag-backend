import express from 'express';
import { getProxyMeta } from './middleware/auth';
import { statusTypes } from '@neoncoder/typed-service-response';
import { sfff, role, roles, allRoles, rperm, rperms, specPerm } from './middleware/common.middleware';

const app = express();
app.use(express.json());
app.use(getProxyMeta);

// const port = 3002;

app.get('/', (req, res) => {
  res.send('Hello, TypeScript with Express!');
});

app.post('/api/v1/comms', (req, res) => {
  return res.status(200).send({ data: req.body });
});

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

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });

export { app };
