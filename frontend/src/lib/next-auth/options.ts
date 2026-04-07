import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { logger } from '@/lib/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:16198/api';

export const authOptions: NextAuthOptions = {
  providers: [
    // OAuth Providers
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
    // Credentials Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'Login failed' }));
          throw new Error(error.message || 'Invalid email or password');
        }

        const result = await response.json();
        const user = result.data?.user;
        const token = result.data?.token;

        if (!user || !token) {
          throw new Error('Invalid response from server');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          token,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, sync user with backend
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          // Get OAuth access token from account
          const oauthToken = account.access_token;
          const provider = account.provider;
          
          // Get profile image based on provider
          let avatarUrl = undefined;
          if (provider === 'google' && profile) {
            avatarUrl = (profile as any).picture;
          } else if (provider === 'facebook' && profile) {
            avatarUrl = (profile as any).picture?.data?.url;
          }
          
          // Call backend to create/get user and get our app token
          const response = await fetch(`${API_BASE_URL}/users/oauth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatarUrl,
              provider,
              providerId: account.providerAccountId,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'OAuth login failed' }));
            throw new Error(error.error || 'OAuth login failed');
          }

          const result = await response.json();
          const { user: backendUser, token } = result.data;

          // Attach our backend token to the user for the jwt callback
          (user as any).token = token;
          (user as any).id = backendUser.id;
          (user as any).avatarUrl = backendUser.avatarUrl;
        } catch (error: any) {
          logger.error('OAuth signIn error:', error);
          throw new Error(error.message || 'OAuth login failed');
        }
      }
      // For credentials, the authorize function already sets up the token
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.accessToken = (user as any).token;
        token.id = user.id;
        token.avatarUrl = (user as any).avatarUrl ?? null;
      }
      // Capture OAuth profile image in token
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        if (profile) {
          const image = account.provider === 'google' 
            ? (profile as any).picture 
            : (profile as any).picture?.data?.url;
          if (image) {
            token.image = image;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = (token.avatarUrl as string | null) || (token.image as string | null);
      }
      return {
        ...session,
        accessToken: token.accessToken as string,
      };
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
