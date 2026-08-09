package de.localcrag.app.gps;

import android.Manifest;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.CancellationTokenSource;

/**
 * Capacitor GpsBridge: starts/stops {@link GpsForegroundService} for Rock Explorer GPS.
 *
 * <p>Location updates are owned by the FGS (not Activity-only FLP) so tracking survives
 * screen-off / backgrounding (Phase 18 / GPS-01). Pause must not call {@link #stop} — JS
 * keeps the service running and gates path appends with {@code isRecording} (D-07).
 *
 * <p>Do not auto-start the FGS from {@link #load()} (D-05 / T-18-06). No native HTTP (D-15).
 */
@CapacitorPlugin(
  name = "GpsBridge",
  permissions = {
    @Permission(
      alias = "location",
      strings = {
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
      }
    ),
    @Permission(
      alias = "background",
      strings = { Manifest.permission.ACCESS_BACKGROUND_LOCATION }
    ),
    @Permission(
      alias = "notifications",
      strings = { Manifest.permission.POST_NOTIFICATIONS }
    )
  }
)
public class GpsBridgePlugin extends Plugin {

  private static final long DEFAULT_INTERVAL_MS = 1000L;

  private FusedLocationProviderClient fusedClient;
  private boolean serviceStarted = false;

  private final GpsForegroundService.FixListener fixListener =
    new GpsForegroundService.FixListener() {
      @Override
      public void onFix(@NonNull Location location) {
        notifyListeners("locationUpdate", toFixPayload(location));
      }
    };

  @Override
  public void load() {
    fusedClient = LocationServices.getFusedLocationProviderClient(getContext());
    GpsForegroundService.setFixListener(fixListener);
    // Intentionally do not start FGS here — JS calls start() after staged perms (D-05).
  }

  /**
   * Starts the location FGS while the Activity is foreground. Does not request permissions —
   * the JS orchestrator owns staging (D-08). Pause must not invoke stop (D-07).
   */
  @PluginMethod
  public void start(PluginCall call) {
    if (!hasLocationPermission()) {
      call.reject("Location permission not granted", "PERMISSION_DENIED");
      return;
    }

    long intervalMs = DEFAULT_INTERVAL_MS;
    if (call.getData() != null && call.getData().has("intervalMs")) {
      Integer fromCall = call.getInt("intervalMs");
      if (fromCall != null && fromCall > 0) {
        intervalMs = fromCall.longValue();
      }
    }

    GpsForegroundService.setFixListener(fixListener);

    Intent intent = new Intent(getContext(), GpsForegroundService.class);
    intent.putExtra(GpsForegroundService.EXTRA_INTERVAL_MS, intervalMs);
    ContextCompat.startForegroundService(getContext(), intent);
    serviceStarted = true;
    call.resolve();
  }

  /** Stops the FGS and clears updates. Idempotent (D-06). */
  @PluginMethod
  public void stop(PluginCall call) {
    Intent intent = new Intent(getContext(), GpsForegroundService.class);
    getContext().stopService(intent);
    serviceStarted = false;
    call.resolve();
  }

  @PluginMethod
  public void getCurrentPosition(PluginCall call) {
    if (!hasLocationPermission()) {
      call.reject("Location permission not granted", "PERMISSION_DENIED");
      return;
    }

    CancellationTokenSource cts = new CancellationTokenSource();
    try {
      fusedClient
        .getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cts.getToken())
        .addOnSuccessListener(
          location -> {
            if (location != null) {
              call.resolve(toFixPayload(location));
              return;
            }
            fusedClient
              .getLastLocation()
              .addOnSuccessListener(
                last -> {
                  if (last != null) {
                    call.resolve(toFixPayload(last));
                  } else {
                    call.reject("Unable to determine location", "POSITION_UNAVAILABLE");
                  }
                }
              )
              .addOnFailureListener(
                e -> call.reject("Unable to determine location", "POSITION_UNAVAILABLE", e)
              );
          }
        )
        .addOnFailureListener(
          e -> call.reject("Unable to determine location", "POSITION_UNAVAILABLE", e)
        );
    } catch (SecurityException e) {
      call.reject("Location permission not granted", "PERMISSION_DENIED", e);
    }
  }

  @PluginMethod
  public void checkPermissions(PluginCall call) {
    JSObject result = new JSObject();
    result.put("location", getPermissionState("location").toString());
    result.put("background", getPermissionState("background").toString());
    result.put("notifications", notificationPermissionState().toString());
    call.resolve(result);
  }

  @PluginMethod
  public void requestPermissions(PluginCall call) {
    if (getPermissionState("location") == PermissionState.GRANTED) {
      JSObject result = new JSObject();
      result.put("location", PermissionState.GRANTED.toString());
      call.resolve(result);
      return;
    }
    requestPermissionForAlias("location", call, "locationPermissionCallback");
  }

  @PluginMethod
  public void requestBackgroundPermission(PluginCall call) {
    if (getPermissionState("background") == PermissionState.GRANTED) {
      JSObject result = new JSObject();
      result.put("background", PermissionState.GRANTED.toString());
      call.resolve(result);
      return;
    }
    requestPermissionForAlias("background", call, "backgroundPermissionCallback");
  }

  @PluginMethod
  public void requestNotificationPermission(PluginCall call) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      JSObject result = new JSObject();
      result.put("notifications", PermissionState.GRANTED.toString());
      call.resolve(result);
      return;
    }
    if (getPermissionState("notifications") == PermissionState.GRANTED) {
      JSObject result = new JSObject();
      result.put("notifications", PermissionState.GRANTED.toString());
      call.resolve(result);
      return;
    }
    requestPermissionForAlias("notifications", call, "notificationsPermissionCallback");
  }

  @PermissionCallback
  private void locationPermissionCallback(PluginCall call) {
    JSObject result = new JSObject();
    result.put("location", getPermissionState("location").toString());
    call.resolve(result);
  }

  @PermissionCallback
  private void backgroundPermissionCallback(PluginCall call) {
    JSObject result = new JSObject();
    result.put("background", getPermissionState("background").toString());
    call.resolve(result);
  }

  @PermissionCallback
  private void notificationsPermissionCallback(PluginCall call) {
    JSObject result = new JSObject();
    result.put("notifications", notificationPermissionState().toString());
    call.resolve(result);
  }

  private PermissionState notificationPermissionState() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      return PermissionState.GRANTED;
    }
    return getPermissionState("notifications");
  }

  private boolean hasLocationPermission() {
    return (
      ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) ==
        android.content.pm.PackageManager.PERMISSION_GRANTED ||
      ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) ==
        android.content.pm.PackageManager.PERMISSION_GRANTED
    );
  }

  private static JSObject toFixPayload(@NonNull Location location) {
    JSObject ret = new JSObject();
    ret.put("latitude", location.getLatitude());
    ret.put("longitude", location.getLongitude());
    ret.put("accuracy", (double) location.getAccuracy());
    if (location.hasAltitude()) {
      ret.put("altitude", location.getAltitude());
    } else {
      ret.put("altitude", JSObject.NULL);
    }
    if (location.hasBearing()) {
      ret.put("heading", (double) location.getBearing());
    } else {
      ret.put("heading", JSObject.NULL);
    }
    if (location.hasSpeed()) {
      ret.put("speed", (double) location.getSpeed());
    } else {
      ret.put("speed", JSObject.NULL);
    }
    ret.put("timestamp", location.getTime());
    return ret;
  }

  @Override
  protected void handleOnDestroy() {
    if (serviceStarted) {
      Intent intent = new Intent(getContext(), GpsForegroundService.class);
      getContext().stopService(intent);
      serviceStarted = false;
    }
    GpsForegroundService.setFixListener(null);
    super.handleOnDestroy();
  }
}
