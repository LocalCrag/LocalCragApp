/**
 * Type for a season response: Maps a month to a percentage of total ascents for an entity.
 */
export type Season = {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  '6': number;
  '7': number;
  '8': number;
  '9': number;
  '10': number;
  '11': number;
  '12': number;
};

/**
 * Checks if a season object is empty (all values are 0).
 * @param season Season object to check.
 * @return True if the season is empty, false otherwise.
 */
export const isSeasonEmpty = (season: Season): boolean => {
  return Object.values(season).every((value) => value === 0);
};
