export type VideoSource =
  'youtube' | 'vimeo' | 'instagram' | 'upload' | 'link' | null;

/**
 * A playable video on a line or an ascent.
 */
export class Video {
  url: string;
  title: string;
  source: VideoSource;
  fileId: string | null;
  startSeconds: number | null;

  public static deserialize(payload: any): Video {
    const video = new Video();
    video.url = payload.url;
    video.title = payload.title;
    video.source = payload.source ?? null;
    video.fileId = payload.fileId ?? null;
    video.startSeconds = payload.startSeconds ?? null;
    return video;
  }

  public static serialize(video: Video): any {
    return {
      url: video.url,
      title: video.title || 'Video',
      source: video.source ?? null,
      fileId: video.fileId ?? null,
      startSeconds: video.startSeconds ?? null,
    };
  }
}
