export const INTENT_BACKEND_PORT = 7201;
export const INTENT_BACKEND_PATH = '/api/ws';
export const INTENT_BACKEND_STORAGE_KEY = 'intentlink.systemAgentBackendHost';
export const LEGACY_INTENT_ENDPOINT_STORAGE_KEY = 'intentlink.systemAgentEndpoint';

function safelyReadEnvHost() {
  try {
    return typeof import.meta !== 'undefined' ? import.meta.env.VITE_INTENT_BACKEND_HOST?.trim?.() ?? '' : '';
  } catch {
    return '';
  }
}

export function normalizeIntentBackendHost(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^wss?:\/\//i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return parsed.hostname;
    } catch {
      return trimmed;
    }
  }

  return trimmed
    .replace(/^\/+|\/+$/g, '')
    .replace(/^wss?:\/\//i, '')
    .replace(/^https?:\/\//i, '')
    .replace(/:\d+$/, '')
    .replace(/\/.*$/, '');
}

export function buildIntentBackendUrl(host: string) {
  const normalizedHost = normalizeIntentBackendHost(host);
  if (!normalizedHost) {
    return '';
  }

  return `ws://${normalizedHost}:${INTENT_BACKEND_PORT}${INTENT_BACKEND_PATH}`;
}

export function getDefaultIntentBackendHost() {
  return normalizeIntentBackendHost(safelyReadEnvHost());
}

export function getStoredIntentBackendHost(storage: Pick<Storage, 'getItem'>) {
  const currentValue = normalizeIntentBackendHost(storage.getItem(INTENT_BACKEND_STORAGE_KEY) ?? '');
  if (currentValue) {
    return currentValue;
  }

  const legacyValue = normalizeIntentBackendHost(storage.getItem(LEGACY_INTENT_ENDPOINT_STORAGE_KEY) ?? '');
  if (legacyValue) {
    return legacyValue;
  }

  return getDefaultIntentBackendHost();
}

export function persistIntentBackendHost(storage: Pick<Storage, 'setItem' | 'removeItem'>, host: string) {
  const normalizedHost = normalizeIntentBackendHost(host);
  if (!normalizedHost) {
    storage.removeItem(INTENT_BACKEND_STORAGE_KEY);
    storage.removeItem(LEGACY_INTENT_ENDPOINT_STORAGE_KEY);
    return;
  }

  storage.setItem(INTENT_BACKEND_STORAGE_KEY, normalizedHost);
  storage.removeItem(LEGACY_INTENT_ENDPOINT_STORAGE_KEY);
}

