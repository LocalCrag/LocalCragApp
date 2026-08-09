package de.localcrag.app.gps;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import de.localcrag.app.MainActivity;
import de.localcrag.app.R;

/**
 * Location-typed foreground service owning Fused Location updates + ongoing
 * tracking notification (Phase 18 / GPS-01, GPS-03).
 *
 * <p>No pause/finish notification actions (D-11). No HTTP from this service (D-15).
 * FLP lives here (not only in the Activity plugin) so updates survive backgrounding.
 */
public class GpsForegroundService extends Service {

  public static final String EXTRA_INTERVAL_MS = "intervalMs";
  public static final String ACTION_RECREATE_NOTIFICATION =
    "de.localcrag.app.gps.RECREATE_NOTIFICATION";

  private static final String CHANNEL_ID = "gps_tracking";
  private static final int NOTIFICATION_ID = 1818;
  private static final long DEFAULT_INTERVAL_MS = 1000L;
  private static final long MIN_UPDATE_INTERVAL_MS = 500L;

  /** Forwards fixes to {@link GpsBridgePlugin} so {@code locationUpdate} keeps working (D-02). */
  public interface FixListener {
    void onFix(@NonNull Location location);
  }

  private static volatile FixListener fixListener;

  public static void setFixListener(@Nullable FixListener listener) {
    fixListener = listener;
  }

  private FusedLocationProviderClient fusedClient;
  private LocationCallback locationCallback;
  private boolean updatesActive = false;
  private long intervalMs = DEFAULT_INTERVAL_MS;

  @Override
  public void onCreate() {
    super.onCreate();
    fusedClient = LocationServices.getFusedLocationProviderClient(this);
    locationCallback =
      new LocationCallback() {
        @Override
        public void onLocationResult(@NonNull LocationResult result) {
          Location location = result.getLastLocation();
          if (location == null) {
            return;
          }
          FixListener listener = fixListener;
          if (listener != null) {
            listener.onFix(location);
          }
        }
      };
    createNotificationChannel();
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    if (intent != null && ACTION_RECREATE_NOTIFICATION.equals(intent.getAction())) {
      // D-12: Android 14+ may allow dismissing ongoing FGS notifications — recreate.
      promoteToForeground();
      return START_STICKY;
    }

    if (intent != null && intent.hasExtra(EXTRA_INTERVAL_MS)) {
      long fromIntent = intent.getLongExtra(EXTRA_INTERVAL_MS, DEFAULT_INTERVAL_MS);
      if (fromIntent > 0) {
        intervalMs = fromIntent;
      }
    }

    promoteToForeground();
    startLocationUpdates();
    return START_STICKY;
  }

  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  @Override
  public void onDestroy() {
    stopLocationUpdates();
    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
    super.onDestroy();
  }

  private void promoteToForeground() {
    Notification notification = buildNotification();
    ServiceCompat.startForeground(
      this,
      NOTIFICATION_ID,
      notification,
      ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
    );
  }

  private void startLocationUpdates() {
    LocationRequest request =
      new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, intervalMs)
        .setMinUpdateIntervalMillis(MIN_UPDATE_INTERVAL_MS)
        .setWaitForAccurateLocation(false)
        .build();

    try {
      if (updatesActive) {
        fusedClient.removeLocationUpdates(locationCallback);
        updatesActive = false;
      }
      fusedClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper());
      updatesActive = true;
    } catch (SecurityException e) {
      stopSelf();
    }
  }

  private void stopLocationUpdates() {
    if (updatesActive && locationCallback != null && fusedClient != null) {
      fusedClient.removeLocationUpdates(locationCallback);
      updatesActive = false;
    }
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    NotificationChannel channel =
      new NotificationChannel(
        CHANNEL_ID,
        getString(R.string.gps_tracking_channel_name),
        NotificationManager.IMPORTANCE_LOW
      );
    channel.setDescription(getString(R.string.gps_tracking_channel_description));
    channel.setShowBadge(false);
    NotificationManager manager = getSystemService(NotificationManager.class);
    if (manager != null) {
      manager.createNotificationChannel(channel);
    }
  }

  private Notification buildNotification() {
    Intent launchIntent = new Intent(this, MainActivity.class);
    launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
    }
    PendingIntent contentIntent = PendingIntent.getActivity(this, 0, launchIntent, pendingFlags);

    // D-12: recreate startForeground if the user dismisses the ongoing notification on API 34+.
    Intent deleteIntent = new Intent(this, GpsForegroundService.class);
    deleteIntent.setAction(ACTION_RECREATE_NOTIFICATION);
    PendingIntent deletePending = PendingIntent.getService(this, 1, deleteIntent, pendingFlags);

    return new NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(getString(R.string.gps_tracking_notification_title))
      .setContentText(getString(R.string.gps_tracking_notification_text))
      .setSmallIcon(R.mipmap.ic_launcher)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setContentIntent(contentIntent)
      .setDeleteIntent(deletePending)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .build();
  }
}
