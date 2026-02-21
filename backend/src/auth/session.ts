export async function getSession() {
  return null;
}

export async function getCurrentUser() {
  return null;
}

export async function requireAuth() {
  throw new Error('Not implemented');
}

export const authOptions = {
  providers: [],
  session: { strategy: 'jwt' as const },
};
