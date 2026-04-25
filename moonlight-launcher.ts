export const MOONLIGHT_PACKAGES = ['com.limelight.debug', 'com.limelight'] as const;

export type MoonlightPackage = (typeof MOONLIGHT_PACKAGES)[number];

export type AppLauncherLike = {
  canOpenUrl(options: { url: string }): Promise<{ value: boolean }>;
};

export async function findInstalledMoonlightPackage(appLauncher: AppLauncherLike): Promise<MoonlightPackage | null> {
  for (const candidatePackage of MOONLIGHT_PACKAGES) {
    const canOpen = await appLauncher.canOpenUrl({ url: candidatePackage });
    if (canOpen.value) {
      return candidatePackage;
    }
  }

  return null;
}

