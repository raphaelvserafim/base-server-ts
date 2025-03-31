export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password: string;
}

export interface AuthSession {
  userId: number;
}