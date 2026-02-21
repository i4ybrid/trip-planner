// Stub for now - full auth implementation requires next-auth dependencies
export const authOptions = {
  providers: [],
  session: { strategy: 'jwt' as const },
};

export default authOptions;
