import { AbstractModel } from './abstract-model';
import { LineType } from '../enums/line-type';
import { LinePath } from './line-path';
import { TopoImage } from './topo-image';
import { StartingPosition } from '../enums/starting-position';
import { Area } from './area';
import {
  deserializeClosableAttributes,
  IsClosable,
  serializeClosableAttributes,
} from './mixins/is-closable';

export interface LineVideo {
  url: string;
  title: string;
}

/**
 * Model of a climbing area's line.
 */
export class Line extends IsClosable(AbstractModel) {
  name: string;
  description: string;
  slug: string;
  color?: string;
  videos: LineVideo[];
  gradeScale: string;
  authorGradeValue: number;
  userGradeValue: number;
  authorRating: number;
  userRating: number;
  type: LineType;
  faYear: number;
  faDate: Date;
  faName: string;
  startingPosition: StartingPosition;
  secret: boolean;
  archived?: boolean;

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
    deserializeClosableAttributes(line, payload);
    line.name = payload.name;
    line.description = payload.description;
    line.videos = payload.videos ? payload.videos : [];
    line.slug = payload.slug;
    line.color = payload.color;

    line.gradeScale = payload.gradeScale;
    line.authorGradeValue = payload.authorGradeValue;
    line.userGradeValue = payload.userGradeValue;
    line.authorRating = payload.authorRating;
    line.userRating = payload.userRating;
    line.type = payload.type;
    line.faYear = payload.faYear;
    line.faDate = payload.faDate ? new Date(payload.faDate) : null;
    line.faName = payload.faName;
    line.startingPosition = payload.startingPosition;
    line.secret = payload.secret;
    line.archived = payload.archived;

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
      ...serializeClosableAttributes(line),
      ...{
        name: line.name,
        description: line.description,
        color: line.color,
        videos: line.videos ? line.videos : null,
        gradeScale: line.gradeScale,
        authorGradeValue: line.authorGradeValue,
        authorRating: line.authorRating,
        type: line.type,
        faYear: line.faYear,
        faDate: line.faDate ? line.faDate.toISOString().split('T')[0] : null,
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
      },
    };
  }
}
