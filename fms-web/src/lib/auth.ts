import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fms-logistics-platform-jwt-secret-key-2026-intergis'
);

const TOKEN_NAME = 'fms_auth_token';
const TOKEN_EXPIRY = '8h';

export interface AuthUser {
  userId: string;
  userNm: string;
  email: string;
  userTypeCd: string;
  companyCd: string;
  companyNm: string;
  department: string;
  positionNm: string;
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      userNm: payload.userNm as string,
      email: payload.email as string,
      userTypeCd: payload.userTypeCd as string,
      companyCd: payload.companyCd as string,
      companyNm: payload.companyNm as string,
      department: payload.department as string,
      positionNm: payload.positionNm as string,
    };
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { TOKEN_NAME };
