import {createExpressMiddleware} from '@trpc/server/adapters/express';
import chalk from 'chalk';
import express, {Router} from 'express';
import {appRouter} from './routers/_app';
import {createContext} from './trpc';

interface LogObject {
  timestamp: string;
  method: string;
  url: string;
  statusCode?: number;
  body?: any;
}

function cleanTrpcUrl(url: string): string {
  try {
    // Check if it's a tRPC URL
    if (url.includes('?batch=1&input=')) {
      // Extract the procedure name
      const procedureName = url.split('?')[0];

      // Extract and decode the input parameter
      const inputMatch = url.match(/input=([^&]+)/);
      if (inputMatch && inputMatch[1]) {
        const decodedInput = decodeURIComponent(inputMatch[1]);
        try {
          const parsedInput = JSON.parse(decodedInput);
          // For batch requests, get the first item's JSON content
          if (parsedInput['0'] && parsedInput['0'].json) {
            return `${procedureName} ${JSON.stringify(parsedInput['0'].json)}`;
          }
        } catch (e) {
          // If parsing fails, just return the decoded input
          return `${procedureName} ${decodedInput}`;
        }
      }
    }
  } catch (error) {
    // If anything fails, return the original URL
  }
  return url;
}

function formatLog(type: 'REQUEST' | 'RESPONSE', data: LogObject): void {
  const timestamp = chalk.gray(`[${data.timestamp}]`);

  const badge =
    type === 'REQUEST' ? chalk.bgBlue.white(` ${type} `) : chalk.bgGreen.white(` ${type} `);

  const method =
    type === 'REQUEST'
      ? getMethodColor(data.method)(data.method)
      : getMethodColor(data.method)(data.method);

  const url = chalk.cyan(cleanTrpcUrl(data.url));

  const status = data.statusCode ? getStatusColor(data.statusCode)(` ${data.statusCode} `) : '';

  console.log(`${timestamp} ${badge} ${method} ${url} ${status}`);

  if (data.body) {
    console.log(chalk.yellow('Body:'));
    console.log(chalk.yellow('----------------------------------------'));
    console.log(typeof data.body === 'string' ? data.body : JSON.stringify(data.body, null, 2));
    console.log(chalk.yellow('----------------------------------------'));
  }
}

function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case 'GET':
      return chalk.bgGreen.black;
    case 'POST':
      return chalk.bgBlue.white;
    case 'PUT':
      return chalk.bgYellow.black;
    case 'DELETE':
      return chalk.bgRed.white;
    case 'PATCH':
      return chalk.bgMagenta.white;
    default:
      return chalk.bgGray.white;
  }
}

function getStatusColor(status: number) {
  if (status < 300) return chalk.bgGreen.black;
  if (status < 400) return chalk.bgCyan.black;
  if (status < 500) return chalk.bgYellow.black;
  return chalk.bgRed.white;
}

// Create the Express router
export const apiRouter: Router = express.Router();

// Request logging middleware
apiRouter.use((req, res, next) => {
  formatLog('REQUEST', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    body: req.body,
  });
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
    formatLog('RESPONSE', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      body: body,
    });
    return originalSend.call(this, body);
  };

  next();
});
