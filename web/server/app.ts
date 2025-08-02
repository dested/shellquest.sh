import {createExpressMiddleware} from '@trpc/server/adapters/express';
import express from 'express';
import {appRouter} from './routers/_app';
import {createContext} from './trpc';

function cleanBody(body: any) {
  return JSON.stringify(body, null, 2);
}

// Create the Express router
export const apiRouter = express.Router();

// Request logging middleware
apiRouter.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] REQUEST: ${req.method} ${req.url}`);
  console.log('Request Body:', req.body ? cleanBody(req.body) : 'No body');
  next();
});

// Add tRPC middleware to the router
apiRouter.use(
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// Response logging middleware
apiRouter.use((req, res, next) => {
  const originalSend = res.send;

  res.send = function (body) {
    console.log(
      `[${new Date().toISOString()}] RESPONSE: ${res.statusCode} ${req.method} ${req.url}`,
    );
    console.log('Response Body:', body ? cleanBody(body) : 'No body');
    return originalSend.call(this, body);
  };

  next();
});
