import {AbstractModel} from './abstract-model';
import {LineType} from '../enums/line-type';
import {Grade, gradeMap} from '../utility/misc/grades';
import {LinePath} from './line-path';
import {TopoImage} from './topo-image';
import {TranslocoService} from '@ngneat/transloco';
import {StartingPosition} from '../enums/starting-position';

/**
 * Model of a climbing area's line.
 */
export class Line extends AbstractModel {

  name: string;
  description: string;
  slug: string;
  video: string;
  grade: Grade;
  rating: number;
  type: LineType;
  faYear: number;
  faName: string;
  startingPosition: StartingPosition;

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
  crimps: boolean;
  pockets: boolean;
  pinches: boolean;

  crack: boolean;
  dihedral: boolean;
  compression: boolean;
  arete: boolean;
  mantle: boolean;

  topoImages: TopoImage[];

  // UI specific attributes, not related to data model
  disabled = false;

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
    line.video = payload.video;
    line.slug = payload.slug;

    line.grade = gradeMap.FB[payload.gradeName];
    line.rating = payload.rating;
    line.type = payload.type;
    line.faYear = payload.faYear;
    line.faName = payload.faName;
line.startingPosition = payload.startingPosition;

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
    line.crimps = payload.crimps;
    line.pockets = payload.pockets;
    line.pinches = payload.pinches;

    line.crack = payload.crack;
    line.dihedral = payload.dihedral;
    line.compression = payload.compression;
    line.arete = payload.arete;
    line.mantle = payload.mantle;

    line.topoImages = payload.linePaths.map(linePathJson => {
      const linePath = LinePath.deserialize(linePathJson);
      const topoImage = TopoImage.deserialize(linePathJson.topoImage);
      topoImage.linePaths = [linePath];
      return topoImage;
    })

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
      video: line.video ? line.video : null,
      gradeScale: 'FB',
      gradeName: line.grade.name,
      rating: line.rating,
      type: line.type,
      faYear: line.faYear,
      faName: line.faName ? line.faName : null,
      startingPosition: line.startingPosition,

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
