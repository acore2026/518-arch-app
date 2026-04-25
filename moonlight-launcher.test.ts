import { describe, expect, it } from 'vitest';
import { findInstalledMoonlightPackage } from './moonlight-launcher';

describe('Moonlight package selection', () => {
  it('prefers the debug package when both variants are installed', async () => {
    const checked: string[] = [];
    const result = await findInstalledMoonlightPackage({
      canOpenUrl: async ({ url }) => {
        checked.push(url);
        return { value: true };
      },
    });

    expect(result).toBe('com.limelight.debug');
    expect(checked).toEqual(['com.limelight.debug']);
  });

  it('falls back to the release package when debug is missing', async () => {
    const checked: string[] = [];
    const result = await findInstalledMoonlightPackage({
      canOpenUrl: async ({ url }) => {
        checked.push(url);
        return { value: url === 'com.limelight' };
      },
    });

    expect(result).toBe('com.limelight');
    expect(checked).toEqual(['com.limelight.debug', 'com.limelight']);
  });

  it('returns null when no Moonlight variant is installed', async () => {
    await expect(
      findInstalledMoonlightPackage({
        canOpenUrl: async () => ({ value: false }),
      })
    ).resolves.toBeNull();
  });
});

