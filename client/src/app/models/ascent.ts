import { AbstractModel } from './abstract-model';
import { Line } from './line';
import { formatISO, parseISO } from 'date-fns';
import { User } from './user';
import { Area } from './area';
import { Sector } from './sector';
import { Crag } from './crag';

export class Ascent extends AbstractModel {
  flash: boolean;
  fa: boolean;
  soft: boolean;
  hard: boolean;
  withKneepad: boolean;
  gradeValue: number;
  rating: number;
  comment: string;
  year: number;
  date: Date;
  line: Line;
  area: Area;
  sector: Sector;
  crag: Crag;
  createdBy: User;

  // Helpers for easier template usage
  routerLinkCrag: string;
  routerLinkSector: string;
  routerLinkArea: string;
  routerLinkLine: string;
  routerLinkCreatedBy: string;

  public static deserialize(payload: any): Ascent {
    const ascent = new Ascent();
    AbstractModel.deserializeAbstractAttributes(ascent, payload);
    ascent.gradeValue = payload.gradeValue;
    ascent.flash = payload.flash;
    ascent.fa = payload.fa;
    ascent.soft = payload.soft;
    ascent.hard = payload.hard;
    ascent.withKneepad = payload.withKneepad;
    ascent.rating = payload.rating;
    ascent.comment = payload.comment;
    ascent.year = payload.year;
    ascent.date = payload.date ? parseISO(payload.date) : null;
    ascent.line = payload.line ? Line.deserialize(payload.line) : null;
    ascent.crag = payload.crag ? Crag.deserialize(payload.crag) : null;
    ascent.sector = payload.sector ? Sector.deserialize(payload.sector) : null;
    ascent.area = payload.area ? Area.deserialize(payload.area) : null;
    ascent.createdBy = User.deserialize(payload.createdBy);

    ascent.routerLinkCrag = `/topo/${ascent.crag.slug}`;
    ascent.routerLinkSector = `${ascent.routerLinkCrag}/${ascent.sector.slug}`;
    ascent.routerLinkArea = `${ascent.routerLinkSector}/${ascent.area.slug}`;
    ascent.routerLinkLine = `${ascent.routerLinkArea}/${ascent.line.slug}`;
    ascent.routerLinkCreatedBy = `/users/${ascent.createdBy.slug}`;

    return ascent;
  }

  public static serialize(ascent: Ascent): any {
    const utcDate = new Date(
      ascent.date.getTime() + ascent.date.getTimezoneOffset() * 60000,
    );
    return {
      flash: ascent.flash,
      fa: ascent.fa,
      soft: ascent.soft,
      hard: ascent.hard,
      withKneepad: ascent.withKneepad,
      rating: ascent.rating,
      comment: ascent.comment,
      year: ascent.year,
      gradeValue: ascent.gradeValue,
      line: ascent.line.id,
      date: ascent.date
        ? formatISO(utcDate, {
            representation: 'date',
          })
        : null,
    };
  }
}
