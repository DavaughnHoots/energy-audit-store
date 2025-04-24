export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  accessToken?: string;  // Optional access token for authentication
  refreshToken?: string; // Optional refresh token for token renewal
}
