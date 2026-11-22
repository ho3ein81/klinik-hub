import jwt, { JwtPayload } from 'jsonwebtoken'
import { env } from '../config/env'
import { UnauthorizedError } from './errors'

export type UserType = 'adminUser' | 'clinicUser' | 'patient'
export type TokenType = 'access' | 'refresh'

export interface AuthTokenPayload extends JwtPayload {
  userId: string
  userType: UserType
  tokenType: TokenType
}

export function generateAccessToken(
  userId: string,
  userType: UserType,
): string {
  return jwt.sign(
    {
      userId,
      userType,
      tokenType: 'access',
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    },
  )
}

export function generateRefreshToken(
  userId: string,
  userType: UserType,
): string {
  return jwt.sign(
    {
      userId,
      userType,
      tokenType: 'refresh',
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    },
  )
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET)

  if (typeof payload === 'string') {
    throw new UnauthorizedError('Invalid access token')
  }

  if (
    typeof payload.userId !== 'string' ||
    (payload.userType !== 'adminUser' &&
      payload.userType !== 'clinicUser' &&
      payload.userType !== 'patient') ||
    payload.tokenType !== 'access'
  ) {
    throw new UnauthorizedError('Invalid access token payload')
  }

  return payload as AuthTokenPayload
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET)

  if (typeof payload === 'string') {
    throw new UnauthorizedError('Invalid refresh token')
  }

  if (
    typeof payload.userId !== 'string' ||
    (payload.userType !== 'adminUser' &&
      payload.userType !== 'clinicUser' &&
      payload.userType !== 'patient') ||
    payload.tokenType !== 'refresh'
  ) {
    throw new UnauthorizedError('Invalid refresh token payload')
  }

  return payload as AuthTokenPayload
}
