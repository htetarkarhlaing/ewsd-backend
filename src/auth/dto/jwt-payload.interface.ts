export interface JwtPayload {
  id: string;
  accountType: 'admin' | 'player';
  role?: string[];
}
