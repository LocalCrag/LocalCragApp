import {AbstractModel} from './abstract-model';
import {File} from './file';
import {LineType} from '../enums/line-type';

/**
 * Model of a climbing area's line.
 */
export class Line extends AbstractModel {

  name: string;
  description: string;
  slug: string;
  video: string;
  grade: number;
  rating: number;
  linepath: any; // todo add type
  type: LineType;
  faYear: number;
  faName: string;

  sitstart: boolean;
  eliminate: boolean;
  traverse: boolean;
  highball: boolean;
  noTopout: boolean;

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
  crimpy: boolean;
  pockets: boolean;

  crack: boolean;
  dihedral: boolean;
  compression: boolean;
  arete: boolean;
  wall: boolean;

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
    line.video = payload.video;
    line.slug = payload.slug;

    line.grade = payload.grade;
    line.rating = payload.rating;
    line.linepath = payload.linepath;
    line.type = payload.type;
    line.faYear = payload.fa_year;
    line.faName = payload.fa_name;

    line.sitstart = payload.sitstart;
    line.eliminate = payload.eliminate;
    line.traverse = payload.traverse;
    line.highball = payload.highball;
    line.noTopout = payload.noTopout;

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
    line.crimpy = payload.crimpy;
    line.pockets = payload.pockets;

    line.crack = payload.crack;
    line.dihedral = payload.dihedral;
    line.compression = payload.compression;
    line.arete = payload.arete;
    line.wall = payload.wall;

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
      video: line.video,
      slug: line.slug,
      grade: line.grade,
      rating: line.rating,
      linepath: line.linepath,
      type: line.type,
      faYear: line.faYear,
      faName: line.faName,

      sitstart: line.sitstart,
      eliminate: line.eliminate,
      traverse: line.traverse,
      highball: line.highball,
      noTopout: line.noTopout,

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
      crimpy: line.crimpy,
      pockets: line.pockets,

      crack: line.crack,
      dihedral: line.dihedral,
      compression: line.compression,
      arete: line.arete,
      wall: line.wall,
    };
  }

}
