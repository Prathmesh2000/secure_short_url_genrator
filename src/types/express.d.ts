import { Request } from 'express';

export interface User {
    username: string;
    email: string;
    id: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
