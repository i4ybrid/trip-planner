'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseFormSubmitOptions {
  /** Callback to execute on successful submission (e.g., navigation) */
  onSuccess?: () => void | Promise<void>;
  /** Wait for Next.js router navigation to complete before unlocking */
  waitForNavigation?: boolean;
  /** Timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}

interface UseFormSubmitReturn {
  isSubmitting: boolean;
  error: string | null;
  submitForm: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
}

/**
 * Shared hook for form submit button loading state.
 * - On submit: locks button + shows spinner
 * - On error: unlocks immediately, sets error
 * - On success with waitForNavigation: waits for routeChangeComplete OR timeout, then unlocks
 * - On success without waitForNavigation: unlocks after response
 */
export function useFormSubmit({
  onSuccess,
  waitForNavigation = false,
  timeoutMs = 30000,
}: UseFormSubmitOptions = {}): UseFormSubmitReturn {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const submitForm = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const result = await fn();

        if (!isMountedRef.current) return undefined;

        if (waitForNavigation && typeof window !== 'undefined') {
          // Wait for Next.js router navigation to complete
          let completed = false;

          const handleRouteChangeComplete = () => {
            completed = true;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
            }
            if (isMountedRef.current) {
              setIsSubmitting(false);
            }
          };

          // Start timeout as fallback
          timeoutRef.current = setTimeout(() => {
            if (!completed && isMountedRef.current) {
              completed = true;
              if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
              }
              setError('Request timed out while waiting for navigation');
              setIsSubmitting(false);
            }
          }, timeoutMs);

          // Set up router events listener
          const routerAny = router as any;
          if (routerAny.events?.on) {
            unsubscribeRef.current = routerAny.events.on('routeChangeComplete', handleRouteChangeComplete);
          }

          // Execute success callback (e.g., router.push) which triggers navigation
          if (onSuccess) {
            await onSuccess();
          }

          // If we're already on the target page, routeChangeComplete won't fire.
          // The timeout will handle unlocking in that case.
        } else {
          // No navigation wait needed (e.g., invite modal)
          if (onSuccess) {
            await onSuccess();
          }
          if (isMountedRef.current) {
            setIsSubmitting(false);
          }
        }

        return result;
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err.message || 'An error occurred');
          setIsSubmitting(false);
        }
        return undefined;
      }
    },
    [onSuccess, waitForNavigation, timeoutMs, router]
  );

  return { isSubmitting, error, submitForm };
}
