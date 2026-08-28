export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  status: string;
  needPasswordChange: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  redirect: boolean;
  token: string;
  user: User;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginResponseData;
}

export interface MeResponseData {
  user: User;
  session: Session;
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: MeResponseData;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
  data: null;
}
