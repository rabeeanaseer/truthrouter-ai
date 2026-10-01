export function isClerkAuthEnabled(): boolean {
  return process.env.VERCEL === "1" || process.env.AUTH_PROVIDER === "clerk";
}