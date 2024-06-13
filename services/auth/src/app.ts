import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// import { createProxyMiddleware, Options, fixRequestBody } from 'http-proxy-middleware';
import { rateLimit } from 'express-rate-limit';
// import { OK, TooManyRequests } from '@neoncoder/service-response';
import { TooManyRequests } from '@neoncoder/typed-service-response';
// import { RedisStore } from 'rate-limit-redis'
// import { connectRedis } from './lib/redis';
// import { timeout } from './middleware/reqTimeout';
// import { defaultHandler, notFoundHander } from './controllers/default';
import { defaultHandler } from './controllers/default';
import { allRoles, role, roles, rperm, rperms, specPerm, sfff } from './middleware/common.middleware';
// import { addRequestMeta, getUserIfLoggedIn } from './middleware/auth';
import { getUserIfLoggedIn } from './middleware/auth';
import { getAppScopes, getAppSettings, scope } from './middleware/settings';
import { arrayToObjectByField } from '@neoncoder/validator-utils';
import { authServiceRoutes } from './routes/index.routes';
// import { getPocketBase } from './lib/pocketbase';

const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());
app.use(getAppSettings);
app.use(getAppScopes);
app.use(getUserIfLoggedIn);

const limiter = rateLimit({
  windowMs: 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  // standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  // legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: TooManyRequests({ message: 'Too many requests from this IP, please try again after 1 minute' }),
  // // Redis store configuration
  // store: new RedisStore({
  // 	sendCommand: (...args: string[]) => client.sendCommand(args),
  // }),
});

app.use('/api/v1/auth', scope('auth'), authServiceRoutes);

app.use(
  '/api/v1/auth',
  limiter,
  scope('auth'),
  sfff('auth.login.email'),
  role('guest', false),
  roles(['visitor'], false),
  allRoles(['user', 'admin'], false),
  rperm('backflip.create'),
  rperms('backflip', 'create', 'deleteOwn', 'readOwn'),
  specPerm('ANOTHER_SPECIAL_PERMISSION'),
  defaultHandler,
);

// const services = [
//   {
//     route: '/api/v1/comms',
//     target: 'http://127.0.0.1:3002/api/v1/comms',
//   },

//   {
//     route: '/v1/test',
//     target:
//       // process.env.FEEDBACK_SERVICE_URI ?? "http://127.0.0.1:5008/v1/surveys",
//       'https://webhook.site/69acfec8-b27b-425c-902a-5c8c3d878d24/v1/surveys',
//   },
//   {
//     route: '/v1/surveys',
//     target: 'http://127.0.0.1:5008/v1/surveys',
//   },
//   // {
//   //   route: "/payment",
//   //   target: "https://your-deployed-service.herokuapp.com/payment/",
//   // },
//   // Add more services as needed either deployed or locally.
// ];

// services.forEach(({ route, target }) => {
//   // Proxy options
//   const proxyOptions: Options = {
//     target,
//     changeOrigin: true,
//     pathRewrite: {
//       [`^${route}`]: '',
//     },
//     ws: true,
//     on: {
//       proxyReq: fixRequestBody,
//     },
//   };

//   // Apply rate limiting and timeout middleware before proxying
//   app.use(route, limiter, timeout, addRequestMeta, createProxyMiddleware(proxyOptions));
// });

app.get('/', async (req, res) => {
  const data = res.locals;
  const { scopes } = data;
  const features = arrayToObjectByField(scopes[0]['features'], 'name');
  return res.status(200).send({ message: 'OK', data: { ...data, features } });
  // const pb = getPocketBase();
  // const newName = Math.random().toString();
  // await pb.collection('users').update('jzd4ar37o0m2gkn', { name: newName });
  // res.send(OK({ data: newName }));
});

export { app };
