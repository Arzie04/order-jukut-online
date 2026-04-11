import { DEVELOPER_MODE } from './settings';

const isServer = typeof window === 'undefined';

// Server logs should always be visible in deployment logs (e.g. Vercel).
// Client/browser logs remain controlled by DEVELOPER_MODE.
export const devLogEnabled = isServer || DEVELOPER_MODE;

export function devLog(...args: unknown[]) {
  if (devLogEnabled) {
    console.log(...args);
  }
}

export function devWarn(...args: unknown[]) {
  if (devLogEnabled) {
    console.warn(...args);
  }
}

export function devError(...args: unknown[]) {
  if (devLogEnabled) {
    console.error(...args);
  }
}

export function criticalError(...args: unknown[]) {
  // This function ALWAYS logs, regardless of DEVELOPER_MODE.
  // It adds a prefix that ConsoleGate can recognize.
  if (args.length > 0) {
    const message = `CRITICAL: ${args[0]}`;
    const otherArgs = args.slice(1);
    console.error(message, ...otherArgs);
  } else {
    console.error('CRITICAL: An unspecified error occurred.');
  }
}
