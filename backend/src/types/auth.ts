// src/types/auth.ts
import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  phone?: string;
  address?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData extends LoginCredentials {
  fullName: string;
  phone?: string;
  address?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}
