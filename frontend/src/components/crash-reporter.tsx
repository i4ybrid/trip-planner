'use client';

import { useEffect } from 'react';
import { frontendLogger } from '@/utils/logger';

export function CrashReporter() {
  useEffect(() => {
    frontendLogger.init();
  }, []);

  return null;
}
