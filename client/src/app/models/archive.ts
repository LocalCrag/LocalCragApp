import {Area} from "./area";
import {Line} from "./line";
import {Sector} from "./sector";
import {Crag} from "./crag";

export class ArchiveObjects {

  line?: string;
  area?: string;
  sector?: string;
  crag?: string;
  archived: boolean;

  public static fromObjects(archived: boolean, line?: Line, area?: Area, sector?: Sector, crag?: Crag): ArchiveObjects {
    const archive = new ArchiveObjects();
    archive.line = line?.slug;
    archive.area = area?.slug;
    archive.sector = sector?.slug;
    archive.crag = crag?.slug;
    archive.archived = archived;

    return archive;
  }

  public static deserialize(payload: any): ArchiveObjects {
    const archive = new ArchiveObjects();
    archive.line = payload.line;
    archive.area = payload.area;
    archive.sector = payload.sector;
    archive.crag = payload.crag;
    archive.archived = payload.archived;

    return archive;
  }

  public static serialize(archive: ArchiveObjects): any {
    return {
      line: archive.line,
      area: archive.area,
      sector: archive.sector,
      crag: archive.crag,
      archived: archive.archived,
    };
  }

}

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

