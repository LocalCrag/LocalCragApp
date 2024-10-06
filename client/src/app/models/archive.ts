export class ArchiveStats {

  lines: number;
  topoImages: number;

  public static deserialize(payload: any): ArchiveStats {
    const archiveStats = new ArchiveStats();
    archiveStats.lines = payload.lines;
    archiveStats.topoImages = payload.topoImages;

    return archiveStats;
  }

  public static serialize(archiveStats: ArchiveStats): any {
    return {
      lines: archiveStats.lines,
      topoImages: archiveStats.topoImages,
    };
  }

}

