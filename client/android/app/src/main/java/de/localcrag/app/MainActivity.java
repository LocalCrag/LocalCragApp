package de.localcrag.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    if (BuildConfig.DEBUG) {
      // The WebView serves the bundled app from the HTTPS-treated https://localhost origin
      // (Capacitor's default androidScheme), so its mixed-content policy blocks the debug-only
      // cleartext calls to http://10.0.2.2:5000 (D-09/D-10) even though the network security
      // config already permits them at the OS level. BuildConfig.DEBUG is a per-build-type
      // generated constant (false in the release variant), so this relaxation can never
      // activate in a release build, matching the debug/release isolation already established
      // for the network security config in plan 02.
      getBridge().getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    }
  }
}
