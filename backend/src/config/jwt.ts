/**
 * Returns the JWT signing secret. There is deliberately no fallback value:
 * a hard-coded default would let anyone who has read the source forge tokens.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return secret;
};
