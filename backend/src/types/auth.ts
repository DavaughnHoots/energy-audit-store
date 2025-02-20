import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Re-export the types to be used in express.d.ts
export type UserType = User;
export type AuthRequestType = AuthenticatedRequest;

// Export a type guard for User type
export function isUser(user: any): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.role === 'string'
  );
}
