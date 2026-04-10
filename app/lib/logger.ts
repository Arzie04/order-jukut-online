import { DEVELOPER_MODE } from './settings';

export const devLogEnabled = DEVELOPER_MODE;

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
