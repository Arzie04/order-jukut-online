'use client';

import { useEffect } from 'react';
import { DEVELOPER_MODE } from '../lib/settings';

const noop = () => {};

export default function ConsoleGate() {
  useEffect(() => {
    if (DEVELOPER_MODE || typeof window === 'undefined') {
      return;
    }

    const original = {
      log: window.console.log,
      warn: window.console.warn,
      error: window.console.error,
      info: window.console.info,
      debug: window.console.debug,
    };

    // Suppress all logs except for critical errors
    window.console.log = noop;
    window.console.warn = noop;
    window.console.info = noop;
    window.console.debug = noop;
    
    // Only allow errors with a specific prefix
    window.console.error = (...args: unknown[]) => {
      if (args.length > 0 && typeof args[0] === 'string' && args[0].startsWith('CRITICAL:')) {
        original.error(...args);
      }
      // Otherwise, do nothing (noop)
    };

    return () => {
      // Restore all original console functions on cleanup
      window.console.log = original.log;
      window.console.warn = original.warn;
      window.console.error = original.error;
      window.console.info = original.info;
      window.console.debug = original.debug;
    };
  }, []);

  return null;
}
