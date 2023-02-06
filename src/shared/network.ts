import { networkInterfaces } from 'node:os';

export function getNetworkIsOnline() {
  const isWindow = typeof window === 'object';

  const windowNetworkOnline = isWindow && window.navigator.onLine;

  console.log(networkInterfaces());

  return windowNetworkOnline || false;
}
