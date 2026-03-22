'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, UserPlus, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { api } from '@/services/api';
import { InviteCode } from '@/types';

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code');

  const [code, setCode] = useState(codeFromUrl || '');
  const [inviteData, setInviteData] = useState<{
    valid: boolean;
    creator?: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
    reason?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (codeFromUrl) {
      validateCode(codeFromUrl);
    }
  }, [codeFromUrl]);

  const validateCode = async (inviteCode: string) => {
    if (!inviteCode.trim()) return;

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/invite-codes/${inviteCode}/validate`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();

      if (result.data?.valid) {
        setInviteData({
          valid: true,
          creator: result.data.inviteCode?.creator,
        });
      } else {
        setInviteData({ valid: false, reason: result.data?.reason || 'invalid' });
        if (result.data?.reason === 'already_used') {
          setError('This invite code has already been used');
        } else if (result.data?.reason === 'expired') {
          setError('This invite code has expired');
        } else {
          setError('Invalid invite code');
        }
      }
    } catch {
      setError('Failed to validate invite code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidate = () => {
    validateCode(code);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Compass className="w-12 h-12 text-amber-600" />
            <h1 className="text-3xl font-bold text-amber-800">TripPlanner</h1>
          </div>
          <h2 className="text-xl font-semibold mb-2">You've been invited!</h2>
          <p className="text-muted-foreground">
            Enter an invite code or sign up to connect with your friend
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Invite Code</label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setInviteData(null);
                  setError('');
                }}
                placeholder="XXXXXXXX"
                className="font-mono text-center tracking-widest"
                maxLength={8}
              />
              <Button
                variant="outline"
                onClick={handleValidate}
                disabled={!code.trim() || isValidating}
              >
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <X className="h-4 w-4" />
              {error}
            </div>
          )}

          {inviteData?.valid && inviteData.creator && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">
                    Invite from {inviteData.creator.name}
                  </p>
                  <p className="text-sm text-green-600">
                    You'll become friends after signing up
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              className="w-full"
              onClick={() => {
                const params = new URLSearchParams();
                if (code) params.set('invite', code);
                router.push(`/login?${params.toString()}`);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up / Sign In
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By signing up, you'll automatically become friends with the person who invited you.
          </p>
        </div>
      </Card>
    </div>
  );
}
