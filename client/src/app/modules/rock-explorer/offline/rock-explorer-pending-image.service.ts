import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GalleryService } from '../../../services/crud/gallery.service';
import { UploadService } from '../../../services/crud/upload.service';
import { GalleryImage } from '../../../models/gallery-image';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { Tag } from '../../../models/tag';
import { ObjectType } from '../../../models/object';
import { rockExplorerDraftDb } from './rock-explorer-draft.db';
import type { RockExplorerPendingImageRecord } from './rock-explorer-draft.types';

/**
 * Offline geotagged image queue for Record mode (RE-TRACK-12).
 * Blobs stay in IndexedDB until the draft has a serverId, then upload.
 */
@Injectable({
  providedIn: 'root',
})
export class RockExplorerPendingImageService {
  private readonly db = rockExplorerDraftDb;
  private readonly uploadService = inject(UploadService);
  private readonly galleryService = inject(GalleryService);

  async enqueue(
    localId: string,
    blob: Blob,
    lat: number,
    lng: number,
    fileName?: string,
  ): Promise<string> {
    const id = crypto.randomUUID();
    const record: RockExplorerPendingImageRecord = {
      id,
      localId,
      blob,
      mimeType: blob.type || 'application/octet-stream',
      fileName: fileName || `rock-explorer-${id}.jpg`,
      lat,
      lng,
      createdAt: Date.now(),
    };
    await this.db.pendingImages.put(record);
    return id;
  }

  async listGpsPins(localId: string): Promise<{ lat: number; lng: number }[]> {
    const rows = await this.db.pendingImages
      .where('localId')
      .equals(localId)
      .toArray();
    return rows.map((r) => ({ lat: r.lat, lng: r.lng }));
  }

  /** All pending geotagged pins across drafts (for map markers). */
  async listAllGpsPins(): Promise<
    { id: string; localId: string; lat: number; lng: number }[]
  > {
    const rows = await this.db.pendingImages.toArray();
    return rows.map((r) => ({
      id: r.id,
      localId: r.localId,
      lat: r.lat,
      lng: r.lng,
    }));
  }

  async deleteForLocalId(localId: string): Promise<void> {
    await this.db.pendingImages.where('localId').equals(localId).delete();
  }

  /**
   * Upload all pending images for a local draft to the server feature id.
   * Best-effort: failed rows stay queued.
   */
  async drainForLocalId(
    localId: string,
    serverFeatureId: string,
  ): Promise<void> {
    if (!serverFeatureId) {
      return;
    }
    const rows = await this.db.pendingImages
      .where('localId')
      .equals(localId)
      .sortBy('createdAt');

    for (const row of rows) {
      try {
        await this.uploadOne(row, serverFeatureId);
        await this.db.pendingImages.delete(row.id);
      } catch {
        // Leave row queued for a later drain / Sync now.
      }
    }
  }

  private async uploadOne(
    row: RockExplorerPendingImageRecord,
    serverFeatureId: string,
  ): Promise<void> {
    const fileForUpload = new globalThis.File([row.blob], row.fileName, {
      type: row.mimeType,
    });
    const uploaded = await firstValueFrom(
      this.uploadService.uploadFile(fileForUpload),
    );

    const feature = new RockExplorerFeature();
    feature.id = serverFeatureId;

    const galleryImage = new GalleryImage();
    galleryImage.image = uploaded;
    galleryImage.description = null;
    const tag = new Tag();
    tag.object = feature;
    tag.objectType = ObjectType.RockExplorerFeature;
    galleryImage.tags = [tag];

    const created = await firstValueFrom(
      this.galleryService.createGalleryImage(galleryImage),
    );
    created.lat = row.lat;
    created.lng = row.lng;
    await firstValueFrom(this.galleryService.updateGalleryImage(created));
  }
}
