import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { rateLimit } from 'express-rate-limit';
// import { RedisStore } from 'rate-limit-redis'
// import { connectRedis } from './lib/redis';
import { timeout } from './middleware/reqTimeout';

const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());

// const client = connectRedis();

// (async () => {
//   await client.connect()
// })()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  // standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  // legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 1 minute',
  // // Redis store configuration
  // store: new RedisStore({
  // 	sendCommand: (...args: string[]) => client.sendCommand(args),
  // }),
});

// app.use(limiter)

const services = [
  {
    route: '/api/v1/comms',
    target: 'http://localhost:3001/api/v1/comms',
  },
  // {
  //   route: "/users",
  //   target: "https://your-deployed-service.herokuapp.com/users/",
  // },
  // {
  //   route: "/chats",
  //   target: "https://your-deployed-service.herokuapp.com/chats/",
  // },
  // {
  //   route: "/payment",
  //   target: "https://your-deployed-service.herokuapp.com/payment/",
  // },
  // Add more services as needed either deployed or locally.
];

services.forEach(({ route, target }) => {
  // Proxy options
  const proxyOptions = {
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: '',
    },
  };

  // Apply rate limiting and timeout middleware before proxying
  app.use(route, limiter, timeout, createProxyMiddleware(proxyOptions));
});

export { app };
