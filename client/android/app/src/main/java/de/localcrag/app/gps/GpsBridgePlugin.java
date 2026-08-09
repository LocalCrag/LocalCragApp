package de.localcrag.app.gps;

import android.Manifest;
import android.location.Location;
import android.os.Looper;
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
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.CancellationTokenSource;

/**
 * Thin Capacitor plugin wrapping Fused Location for foreground Rock Explorer GPS (Phase 17).
 * No foreground service / notification — Phase 18 extends this class for background survival.
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
    )
  }
)
public class GpsBridgePlugin extends Plugin {

  private static final long DEFAULT_INTERVAL_MS = 1000L;
  private static final long MIN_UPDATE_INTERVAL_MS = 500L;

  private FusedLocationProviderClient fusedClient;
  private LocationCallback locationCallback;
  private boolean updatesActive = false;

  @Override
  public void load() {
    fusedClient = LocationServices.getFusedLocationProviderClient(getContext());
    locationCallback =
      new LocationCallback() {
        @Override
        public void onLocationResult(@NonNull LocationResult result) {
          Location location = result.getLastLocation();
          if (location != null) {
            notifyListeners("locationUpdate", toFixPayload(location));
          }
        }
      };
  }

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

    LocationRequest request =
      new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, intervalMs)
        .setMinUpdateIntervalMillis(MIN_UPDATE_INTERVAL_MS)
        .setWaitForAccurateLocation(false)
        .build();

    try {
      // Idempotent restart: drop prior callback before requesting again.
      if (updatesActive) {
        fusedClient.removeLocationUpdates(locationCallback);
        updatesActive = false;
      }
      fusedClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper());
      updatesActive = true;
      call.resolve();
    } catch (SecurityException e) {
      call.reject("Location permission not granted", "PERMISSION_DENIED", e);
    }
  }

  @PluginMethod
  public void stop(PluginCall call) {
    if (updatesActive && locationCallback != null && fusedClient != null) {
      fusedClient.removeLocationUpdates(locationCallback);
      updatesActive = false;
    }
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

  @PermissionCallback
  private void locationPermissionCallback(PluginCall call) {
    JSObject result = new JSObject();
    result.put("location", getPermissionState("location").toString());
    call.resolve(result);
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
    if (updatesActive && locationCallback != null && fusedClient != null) {
      fusedClient.removeLocationUpdates(locationCallback);
      updatesActive = false;
    }
    super.handleOnDestroy();
  }
}
