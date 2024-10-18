import { Ascent } from './ascent';

export class Paginated<T> {
  items: T[];
  hasNext: boolean;

  public static deserialize<T>(
    payload: any,
    deserializeItems: (x: any) => T,
  ): Paginated<T> {
    const paginated = new Paginated<T>();
    paginated.hasNext = payload.hasNext;
    paginated.items = payload.items.map(deserializeItems);
    return paginated;
  }
}
