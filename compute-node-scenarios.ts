import { Capacitor, registerPlugin } from '@capacitor/core';

export const COMPUTE_NODE_PORT = 7878;
export const COMPUTE_NODE_STORAGE_KEY = 'intentlink.computeNodeHost';

export type ComputeScenario = 'base' | 'overload';

export type ComputeScenarioResponse = {
  ok: boolean;
  activeScenario?: string;
};

export type ComputeScenarioFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

type NativeComputeScenarioResult = ComputeScenarioResponse & {
  status: number;
  body?: string;
};

type ComputeNodePlugin = {
  armScenario(options: {
    url: string;
    scenario: ComputeScenario;
  }): Promise<NativeComputeScenarioResult>;
};

const ComputeNode = registerPlugin<ComputeNodePlugin>('ComputeNode');

export class ComputeScenarioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ComputeScenarioError';
  }
}

export function normalizeComputeNodeHost(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`);
    return url.hostname;
  } catch {
    return trimmed
      .replace(/^\/+|\/+$/g, '')
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');
  }
}

export function buildComputeScenarioUrl(host: string, scenario: ComputeScenario) {
  const normalizedHost = normalizeComputeNodeHost(host);
  if (!normalizedHost) {
    return '';
  }

  return `http://${normalizedHost}:${COMPUTE_NODE_PORT}/scenarios/${scenario}/arm`;
}

export function getStoredComputeNodeHost(storage: Pick<Storage, 'getItem'>) {
  return normalizeComputeNodeHost(storage.getItem(COMPUTE_NODE_STORAGE_KEY) ?? '');
}

export function persistComputeNodeHost(storage: Pick<Storage, 'setItem' | 'removeItem'>, host: string) {
  const normalizedHost = normalizeComputeNodeHost(host);
  if (!normalizedHost) {
    storage.removeItem(COMPUTE_NODE_STORAGE_KEY);
    return;
  }

  storage.setItem(COMPUTE_NODE_STORAGE_KEY, normalizedHost);
}

export async function armComputeScenario(
  host: string,
  scenario: ComputeScenario,
  fetcher: ComputeScenarioFetch = fetch
) {
  const url = buildComputeScenarioUrl(host, scenario);
  if (!url) {
    throw new ComputeScenarioError('Compute Node host is not configured.');
  }

  if (Capacitor.getPlatform() === 'android' && fetcher === fetch) {
    return armComputeScenarioNative(url, scenario);
  }

  let response: Pick<Response, 'ok' | 'status' | 'json'>;
  try {
    response = await fetcher(url, { method: 'POST' });
  } catch (error) {
    throw new ComputeScenarioError(`Compute Node request failed: ${String(error)}`);
  }

  if (!response.ok) {
    throw new ComputeScenarioError(`Compute Node returned HTTP ${response.status}.`);
  }

  let payload: ComputeScenarioResponse;
  try {
    payload = (await response.json()) as ComputeScenarioResponse;
  } catch {
    throw new ComputeScenarioError('Compute Node returned invalid JSON.');
  }

  if (!payload.ok || payload.activeScenario !== scenario) {
    throw new ComputeScenarioError(`Compute Node did not arm the ${scenario} scenario.`);
  }

  return payload;
}

async function armComputeScenarioNative(url: string, scenario: ComputeScenario) {
  let payload: NativeComputeScenarioResult;
  try {
    payload = await ComputeNode.armScenario({ url, scenario });
  } catch (error) {
    throw new ComputeScenarioError(`Native Compute Node request failed: ${String(error)}`);
  }

  if (payload.status < 200 || payload.status >= 300) {
    throw new ComputeScenarioError(`Compute Node returned HTTP ${payload.status}.`);
  }

  if (!payload.ok || payload.activeScenario !== scenario) {
    const bodySuffix = payload.body ? ` Body: ${payload.body.slice(0, 160)}` : '';
    throw new ComputeScenarioError(`Compute Node did not arm the ${scenario} scenario.${bodySuffix}`);
  }

  return {
    ok: payload.ok,
    activeScenario: payload.activeScenario,
  };
}
