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

    window.console.log = noop;
    window.console.warn = noop;
    window.console.error = noop;
    window.console.info = noop;
    window.console.debug = noop;

    return () => {
      window.console.log = original.log;
      window.console.warn = original.warn;
      window.console.error = original.error;
      window.console.info = original.info;
      window.console.debug = original.debug;
    };
  }, []);

  return null;
}
