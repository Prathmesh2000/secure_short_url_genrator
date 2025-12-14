import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
}

// Type assertion after the check ensures TypeScript knows JWT_SECRET is a string
const secret: string = JWT_SECRET;

export interface JwtPayload {
    username: string;
    email: string;
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, secret, {
      expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn']
    });
  }
  
  export function verifyToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, secret);
    return decoded as JwtPayload;
  }
  