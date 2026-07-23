import { AbstractModel } from './abstract-model';
import { LineType } from '../enums/line-type';
import { LinePath } from './line-path';
import { TopoImage } from './topo-image';
import { StartingPosition } from '../enums/starting-position';
import { Drying } from '../enums/drying';
import { Area } from './area';
import { Crag } from './crag';
import { Sector } from './sector';
import { User } from './user';
import {
  deserializeClosableAttributes,
  IsClosable,
  serializeClosableAttributes,
} from './mixins/is-closable';
import { deserializeSlugAttributes, HasSlug } from './mixins/has-slug';
import { topoLineRouterLink } from './topo-router-link';
import {
  formatLocalCalendarDate,
  parseLocalCalendarDate,
} from '../utility/local-calendar-date';

export interface LineVideo {
  url: string;
  title: string;
}

/** Registered FA climber plus their FA ascent year/date. */
export interface LineFaUser {
  user: User;
  year: number | null;
  date: Date | null;
}

/**
 * Model of a climbing area's line.
 */
export class Line extends IsClosable(HasSlug(AbstractModel)) {
  name: string;
  description: string;
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
  faUsers: LineFaUser[] = [];
  routesetter: string;
  setDate: Date;
  startingPosition: StartingPosition;
  drying: Drying | null;
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
  area: Area | null;
  sector: Sector | null;
  crag: Crag | null;
  ascentCount: number;
  imageCount: number;
  commentCount: number;
  taskCount?: number;

  areaSlug: string;
  sectorSlug: string;
  cragSlug: string;

  // UI specific attributes, not related to data model
  disabled = false;
  blockOrderIndex: number; // Set after ordering for easy efficient reuse of ng prime data view order feature
  routerLink: string | null;
  routerLinkCrag: string | null;
  routerLinkSector: string | null;
  routerLinkArea: string | null;

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
    deserializeSlugAttributes(line, payload);
    line.name = payload.name;
    line.description = payload.description;
    line.videos = payload.videos ? payload.videos : [];
    line.color = payload.color;

    line.gradeScale = payload.gradeScale;
    line.authorGradeValue = payload.authorGradeValue;
    line.userGradeValue = payload.userGradeValue;
    line.authorRating = payload.authorRating;
    line.userRating = payload.userRating;
    line.type = payload.type;
    line.faYear = payload.faYear;
    line.faDate = payload.faDate
      ? parseLocalCalendarDate(payload.faDate)
      : null;
    line.faName = payload.faName;
    line.faUsers = payload.faUsers
      ? payload.faUsers.map(
          (faUser: any): LineFaUser => ({
            user: User.deserialize(faUser),
            year: faUser.year ?? null,
            date: faUser.date ? parseLocalCalendarDate(faUser.date) : null,
          }),
        )
      : [];
    line.routesetter = payload.routesetter;
    line.setDate = payload.setDate
      ? parseLocalCalendarDate(payload.setDate)
      : null;
    line.startingPosition = payload.startingPosition;
    line.drying = payload.drying ?? null;
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
    line.sector = payload.sector ? Sector.deserialize(payload.sector) : null;
    line.crag = payload.crag ? Crag.deserialize(payload.crag) : null;
    line.ascentCount = payload.ascentCount;
    line.imageCount = payload.imageCount;
    line.commentCount = payload.commentCount;
    line.taskCount = payload.taskCount;

    if (line.cragSlug && line.sectorSlug && line.areaSlug) {
      line.routerLinkCrag = `/topo/${line.cragSlug}`;
      line.routerLinkSector = `${line.routerLinkCrag}/${line.sectorSlug}`;
      line.routerLinkArea = `${line.routerLinkSector}/${line.areaSlug}`;
      line.routerLink = `${line.routerLinkArea}/${line.slug}`;
    } else {
      line.routerLinkCrag = null;
      line.routerLinkSector = null;
      line.routerLinkArea = null;
      line.routerLink = topoLineRouterLink(line);
    }

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
        faDate: line.faDate ? formatLocalCalendarDate(line.faDate) : null,
        faName: line.faName ? line.faName : null,
        routesetter: line.routesetter ? line.routesetter : null,
        setDate: line.setDate ? formatLocalCalendarDate(line.setDate) : null,
        startingPosition: line.startingPosition,
        drying: line.drying ?? null,
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
