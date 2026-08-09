package de.localcrag.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    if (BuildConfig.DEBUG) {
      // Belt-and-suspenders for cleartext API XHR to http://10.0.2.2:5000 (D-09/D-10).
      // Primary fix for media is capacitor.config server.androidScheme = 'http' (avoids
      // https://localhost mixed-content blocks on <img>). BuildConfig.DEBUG is false in
      // release, matching the debug-only network security config in plan 02.
      getBridge().getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
    }
  }
}
