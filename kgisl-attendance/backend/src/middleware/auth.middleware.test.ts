import { requireAuth, signAccessToken, AuthPayload } from './auth.middleware';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

describe('Auth Middleware', () => {
  it('should accept valid token and populate req.auth', () => {
    const payload: AuthPayload = { sub: 'user1', role: 'STUDENT' };
    const token = signAccessToken(payload);
    
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = {} as Response;
    const next = jest.fn();

    const middleware = requireAuth('STUDENT');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(); // called without error
    expect(req.auth).toMatchObject({ sub: 'user1', role: 'STUDENT' });
  });

  it('should reject missing authorization header', () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = jest.fn();

    const middleware = requireAuth('STUDENT');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Authentication token is invalid or expired' }));
  });

  it('should reject vertical privilege escalation (Student accessing Faculty route)', () => {
    const payload: AuthPayload = { sub: 'user1', role: 'STUDENT' };
    const token = signAccessToken(payload);
    
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = {} as Response;
    const next = jest.fn();

    const middleware = requireAuth('FACULTY'); // Route requires Faculty
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Authentication token is invalid or expired' }));
  });

  it('should reject tokens signed with algorithm other than HS256', () => {
    const payload = { sub: 'user1', role: 'STUDENT' };
    // Sign with RS256 or none. We simulate attack by mocking jwt.verify to throw if wrong algo.
    // Actually the middleware explicitly specifies { algorithms: ['HS256'] }
    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, { algorithm: 'none' as any });
    
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = {} as Response;
    const next = jest.fn();

    const middleware = requireAuth();
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Authentication token is invalid or expired' }));
  });
});
