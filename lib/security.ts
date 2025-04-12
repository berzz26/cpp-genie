const ALLOWED_ORIGINS = [
  'https://cpp-genie.vercel.app',
  'http://localhost:3000',
  'http://localhost:4000'
];

export function isValidOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}
