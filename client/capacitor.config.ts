import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.localcrag.app',
  appName: 'LocalCrag',
  webDir: 'dist/client/browser',
  // Default androidScheme is https, which treats the WebView as a secure context and blocks
  // cleartext <img> loads to the local MinIO endpoint (http://10.0.2.2:9000) even when
  // MIXED_CONTENT_ALWAYS_ALLOW is set. http keeps debug media working with the emulator
  // loopback rewrite; release still ships the same bundled assets without remote cleartext
  // requirements once production media is HTTPS.
  server: {
    androidScheme: 'http',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      androidSplashResourceName: 'splash',
      splashFullScreen: false,
      splashImmersive: false,
    },
    // D-05 / SHELL-03: patch XHR/fetch through native HttpURLConnection so
    // Angular HttpClient bypasses WebView CORS against arbitrary operator APIs.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
