import type {InferUser, InferSession} from 'better-auth';
import {createAuthClient} from 'better-auth/react';
import type {auth} from '../server/auth';

export const authClient = createAuthClient({basePath: '/api/auth'});

export type Session = InferSession<typeof auth>;
export type User = InferUser<typeof auth>;
