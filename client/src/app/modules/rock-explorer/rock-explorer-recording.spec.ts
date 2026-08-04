import {
  RockExplorerRecordingSession,
  distanceMeters,
  getOrCreateRecordingDeviceId,
  gpsFixToPosition,
  shouldKeepGpsPoint,
  RECORDING_DEVICE_ID_KEY,
  MIN_PATH_POINT_DISTANCE_M,
} from './rock-explorer-recording';

describe('rock-explorer-recording', () => {
  describe('getOrCreateRecordingDeviceId', () => {
    it('creates and reuses a stable id', () => {
      const store: Record<string, string> = {};
      const storage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
      } as Storage;
      const a = getOrCreateRecordingDeviceId(storage);
      const b = getOrCreateRecordingDeviceId(storage);
      expect(a).toBeTruthy();
      expect(a).toBe(b);
      expect(store[RECORDING_DEVICE_ID_KEY]).toBe(a);
    });
  });

  describe('distanceMeters / shouldKeepGpsPoint', () => {
    it('keeps the first point', () => {
      expect(shouldKeepGpsPoint(null, { lng: 8, lat: 50 })).toBeTrue();
    });

    it('drops points closer than 5 m', () => {
      const a = { lng: 8.0, lat: 50.0 };
      // ~1.1 m east at this latitude
      const near = { lng: 8.00001, lat: 50.0 };
      expect(distanceMeters(a, near)).toBeLessThan(MIN_PATH_POINT_DISTANCE_M);
      expect(shouldKeepGpsPoint(a, near)).toBeFalse();
    });

    it('keeps points at least 5 m away', () => {
      const a = { lng: 8.0, lat: 50.0 };
      // ~11 m east
      const far = { lng: 8.00015, lat: 50.0 };
      expect(distanceMeters(a, far)).toBeGreaterThanOrEqual(
        MIN_PATH_POINT_DISTANCE_M,
      );
      expect(shouldKeepGpsPoint(a, far)).toBeTrue();
    });
  });

  describe('gpsFixToPosition', () => {
    it('encodes lng/lat and optional numerics', () => {
      expect(gpsFixToPosition({ lng: 1, lat: 2 })).toEqual([1, 2]);
      expect(
        gpsFixToPosition({
          lng: 1,
          lat: 2,
          altitudeM: 10,
          timestampMs: 100,
          accuracyM: 5,
        }),
      ).toEqual([1, 2, 10, 100, 5]);
    });
  });

  describe('RockExplorerRecordingSession', () => {
    let session: RockExplorerRecordingSession;

    beforeEach(() => {
      session = new RockExplorerRecordingSession('device-test');
    });

    it('starts in recording with an open gps path', () => {
      expect(session.feature.status).toBe('draft');
      expect(session.feature.recordingDeviceId).toBe('device-test');
      expect(session.recordingState).toBe('recording');
      expect(session.activePath?.source).toBe('gps');
      expect(session.activePath?.geometry.coordinates.length).toBe(0);
    });

    it('appends fixes with distance filter and pauses without appending', () => {
      expect(
        session.tryAppendFix({ lng: 8, lat: 50, timestampMs: 1, accuracyM: 4 }),
      ).toBeTrue();
      expect(session.tryAppendFix({ lng: 8.00001, lat: 50 })).toBeFalse();
      expect(
        session.tryAppendFix({ lng: 8.00015, lat: 50, timestampMs: 2 }),
      ).toBeTrue();
      expect(session.activePath!.geometry.coordinates.length).toBe(2);

      session.pause();
      expect(session.recordingState).toBe('paused');
      expect(session.tryAppendFix({ lng: 8.001, lat: 50 })).toBeFalse();

      session.resume();
      expect(session.recordingState).toBe('recording');
      expect(session.tryAppendFix({ lng: 8.001, lat: 50 })).toBeTrue();
    });

    it('finishPath requires ≥2 vertices then newPath starts fresh', () => {
      expect(session.finishPath()).toBeFalse();
      session.tryAppendFix({ lng: 8, lat: 50 });
      expect(session.finishPath()).toBeFalse();
      session.tryAppendFix({ lng: 8.00015, lat: 50 });
      const firstId = session.activePathId;
      expect(session.finishPath()).toBeTrue();
      expect(session.activePathId).toBeNull();
      expect(session.recordingState).toBe('paused');

      session.newPath();
      expect(session.recordingState).toBe('recording');
      expect(session.activePathId).not.toBe(firstId);
      expect(session.feature.paths.length).toBe(2);
    });

    it('pathsForSerialize omits open paths with fewer than 2 points', () => {
      session.tryAppendFix({ lng: 8, lat: 50 });
      expect(session.pathsForSerialize().length).toBe(0);
      session.tryAppendFix({ lng: 8.00015, lat: 50 });
      expect(session.pathsForSerialize().length).toBe(1);
    });

    it('toSnapshot / hydrateFromSnapshot round-trips open 1-vertex path', () => {
      expect(
        session.tryAppendFix({ lng: 8.1, lat: 50.2, timestampMs: 42 }),
      ).toBeTrue();
      expect(session.activePath!.geometry.coordinates.length).toBe(1);
      session.keptSinceSync = 3;
      session.lastSyncAtMs = 99;

      const snapshot = session.toSnapshot();
      expect(snapshot.activePathId).toBe(session.activePathId);
      expect(snapshot.keptSinceSync).toBe(3);
      expect(snapshot.lastSyncAtMs).toBe(99);
      expect(snapshot.lastKept).toEqual({ lng: 8.1, lat: 50.2 });
      const paths = snapshot.feature['paths'] as Array<{
        geometry: { coordinates: number[][] };
      }>;
      expect(paths[0].geometry.coordinates.length).toBe(1);
      expect(paths[0].geometry.coordinates[0][0]).toBe(8.1);

      const restored = RockExplorerRecordingSession.hydrateFromSnapshot(
        snapshot,
        'device-test',
      );
      expect(restored.activePathId).toBe(session.activePathId);
      expect(restored.keptSinceSync).toBe(3);
      expect(restored.lastSyncAtMs).toBe(99);
      expect(restored.activePath!.geometry.coordinates.length).toBe(1);
      expect(restored.activePath!.geometry.coordinates[0][0]).toBe(8.1);
      expect(restored.activePath!.geometry.coordinates[0][1]).toBe(50.2);
      // API serialize would drop this path — snapshot must not
      expect(restored.pathsForSerialize().length).toBe(0);
    });
  });
});
