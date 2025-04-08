import { UserType } from './auth';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: any; // TODO: Define proper user type
    }
  }
}
