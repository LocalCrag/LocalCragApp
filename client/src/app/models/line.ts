import { AbstractModel } from './abstract-model';
import { LineType } from '../enums/line-type';
import { deserializeGrade, Grade } from '../utility/misc/grades';
import { LinePath } from './line-path';
import { TopoImage } from './topo-image';
import { StartingPosition } from '../enums/starting-position';
import { Area } from './area';

export interface LineVideo {
  url: string;
  title: string;
}

/**
 * Model of a climbing area's line.
 */
export class Line extends AbstractModel {
  name: string;
  description: string;
  slug: string;
  color?: string;
  videos: LineVideo[];
  grade: Grade;
  rating: number;
  type: LineType;
  faYear: number;
  faName: string;
  startingPosition: StartingPosition;
  secret: boolean;

  eliminate: boolean;
  traverse: boolean;
  highball: boolean;
  lowball: boolean;
  morpho: boolean;
  noTopout: boolean;
  badDropzone: boolean;
  childFriendly: boolean;

  roof: boolean;
  slab: boolean;
  vertical: boolean;
  overhang: boolean;

  athletic: boolean;
  technical: boolean;
  endurance: boolean;
  cruxy: boolean;
  dyno: boolean;

  jugs: boolean;
  sloper: boolean;
  crimps: boolean;
  pockets: boolean;
  pinches: boolean;

  crack: boolean;
  dihedral: boolean;
  compression: boolean;
  arete: boolean;
  mantle: boolean;

  topoImages: TopoImage[];
  area: Area;
  ascentCount: number;

  areaSlug: string;
  sectorSlug: string;
  cragSlug: string;

  // UI specific attributes, not related to data model
  disabled = false;
  blockOrderIndex: number; // Set after ordering for easy efficient reuse of ng prime data view order feature
  routerLink: string;

  constructor() {
    super();
    this.type = LineType.BOULDER;
  }

  /**
   * Parses a line.
   *
   * @param payload Line json payload.
   * @return Parsed Line.
   */
  public static deserialize(payload: any): Line {
    const line = new Line();
    AbstractModel.deserializeAbstractAttributes(line, payload);
    line.name = payload.name;
    line.description = payload.description;
    line.videos = payload.videos ? payload.videos : [];
    line.slug = payload.slug;
    line.color = payload.color;

    line.grade = deserializeGrade(payload);
    line.rating = payload.rating;
    line.type = payload.type;
    line.faYear = payload.faYear;
    line.faName = payload.faName;
    line.startingPosition = payload.startingPosition;
    line.secret = payload.secret;

    line.eliminate = payload.eliminate;
    line.traverse = payload.traverse;
    line.highball = payload.highball;
    line.lowball = payload.lowball;
    line.morpho = payload.morpho;
    line.noTopout = payload.noTopout;
    line.badDropzone = payload.badDropzone;
    line.childFriendly = payload.childFriendly;

    line.roof = payload.roof;
    line.slab = payload.slab;
    line.vertical = payload.vertical;
    line.overhang = payload.overhang;

    line.athletic = payload.athletic;
    line.technical = payload.technical;
    line.endurance = payload.endurance;
    line.cruxy = payload.cruxy;
    line.dyno = payload.dyno;

    line.jugs = payload.jugs;
    line.sloper = payload.sloper;
    line.crimps = payload.crimps;
    line.pockets = payload.pockets;
    line.pinches = payload.pinches;

    line.crack = payload.crack;
    line.dihedral = payload.dihedral;
    line.compression = payload.compression;
    line.arete = payload.arete;
    line.mantle = payload.mantle;

    line.areaSlug = payload.areaSlug;
    line.sectorSlug = payload.sectorSlug;
    line.cragSlug = payload.cragSlug;

    line.topoImages = payload.linePaths
      ? payload.linePaths.map((linePathJson) => {
          const linePath = LinePath.deserialize(linePathJson);
          const topoImage = TopoImage.deserialize(linePathJson.topoImage);
          topoImage.linePaths = [linePath];
          return topoImage;
        })
      : null;
    line.area = payload.area ? Area.deserialize(payload.area) : null;
    line.ascentCount = payload.ascentCount;
    line.routerLink = line.area
      ? `/topo/${line.area.sector.crag.slug}/${line.area.sector.slug}/${line.area.slug}/${line.slug}`
      : null;

    return line;
  }

  /**
   * Marshals a line.
   *
   * @param line Line to marshall.
   * @return Marshalled Line.
   */
  public static serialize(line: Line): any {
    return {
      name: line.name,
      description: line.description,
      color: line.color,
      videos: line.videos ? line.videos : null,
      gradeScale: 'FB',
      gradeName: line.grade.name,
      rating: line.rating,
      type: line.type,
      faYear: line.faYear,
      faName: line.faName ? line.faName : null,
      startingPosition: line.startingPosition,
      secret: line.secret,

      eliminate: line.eliminate,
      traverse: line.traverse,
      highball: line.highball,
      lowball: line.lowball,
      morpho: line.morpho,
      noTopout: line.noTopout,
      badDropzone: line.badDropzone,
      childFriendly: line.childFriendly,

      roof: line.roof,
      slab: line.slab,
      vertical: line.vertical,
      overhang: line.overhang,

      athletic: line.athletic,
      technical: line.technical,
      endurance: line.endurance,
      cruxy: line.cruxy,
      dyno: line.dyno,

      jugs: line.jugs,
      sloper: line.sloper,
      crimps: line.crimps,
      pockets: line.pockets,
      pinches: line.pinches,

      crack: line.crack,
      dihedral: line.dihedral,
      compression: line.compression,
      arete: line.arete,
      mantle: line.mantle,
    };
  }
}
