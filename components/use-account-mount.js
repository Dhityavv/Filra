'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getMount = () => document.getElementById('filraAccountMount');
const getServerMount = () => null;

export function useAccountMount() {
  return useSyncExternalStore(subscribe, getMount, getServerMount);
}
