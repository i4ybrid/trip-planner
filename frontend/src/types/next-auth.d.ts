import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    token: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    id: string;
    avatarUrl: string | null;
  }
}
