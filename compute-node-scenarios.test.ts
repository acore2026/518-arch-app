import { describe, expect, it, vi } from 'vitest';
import {
  armComputeScenario,
  buildComputeScenarioUrl,
  COMPUTE_NODE_STORAGE_KEY,
  getStoredComputeNodeHost,
  normalizeComputeNodeHost,
  persistComputeNodeHost,
} from './compute-node-scenarios';

describe('Compute Node scenario API', () => {
  it('normalizes configured hosts and builds scenario URLs', () => {
    expect(normalizeComputeNodeHost('192.168.1.20')).toBe('192.168.1.20');
    expect(normalizeComputeNodeHost('http://192.168.1.20:7878/scenarios/base/arm')).toBe('192.168.1.20');
    expect(buildComputeScenarioUrl('192.168.1.20', 'overload')).toBe(
      'http://192.168.1.20:7878/scenarios/overload/arm'
    );
    expect(buildComputeScenarioUrl('', 'base')).toBe('');
  });

  it('persists and clears the Compute Node host', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };

    persistComputeNodeHost(storage, 'http://10.0.0.9:7878');
    expect(values.get(COMPUTE_NODE_STORAGE_KEY)).toBe('10.0.0.9');
    expect(getStoredComputeNodeHost(storage)).toBe('10.0.0.9');

    persistComputeNodeHost(storage, '');
    expect(values.has(COMPUTE_NODE_STORAGE_KEY)).toBe(false);
  });

  it('arms a scenario with POST and validates the active scenario', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, activeScenario: 'overload' }),
    }));

    await expect(armComputeScenario('10.0.0.9', 'overload', fetcher)).resolves.toMatchObject({
      ok: true,
      activeScenario: 'overload',
    });
    expect(fetcher).toHaveBeenCalledWith('http://10.0.0.9:7878/scenarios/overload/arm', { method: 'POST' });
  });

  it('rejects failed scenario responses', async () => {
    await expect(
      armComputeScenario('10.0.0.9', 'base', async () => ({
        ok: false,
        status: 503,
        json: async () => ({ ok: false }),
      }))
    ).rejects.toThrow('HTTP 503');

    await expect(
      armComputeScenario('10.0.0.9', 'base', async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, activeScenario: 'overload' }),
      }))
    ).rejects.toThrow('did not arm');

    await expect(
      armComputeScenario('', 'base', async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, activeScenario: 'base' }),
      }))
    ).rejects.toThrow('not configured');
  });
});
