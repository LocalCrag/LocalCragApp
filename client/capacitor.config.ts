import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.localcrag.app',
  appName: 'LocalCrag',
  webDir: 'dist/client/browser',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      androidSplashResourceName: 'splash',
      splashFullScreen: false,
      splashImmersive: false,
    },
  },
};

export default config;
