/**
 * Utility function for getting a single entity from an array of entities. The entity is fetched by checking the matchOn property
 * of the target entity with those of the entities in the instances array.
 * A use-case for this if you have a select fo entities and need to preselect on of the entities based on another item from a different
 * request. Just using === won't work here because object identities are unequal.
 *
 * @param entity Entity to search for equivalent in instances array.
 * @param instances Array of instances to search in.
 * @param matchOn Property to match the items on.
 * @return Found entity.
 */
export const getInstanceEquivalentFromList = <T>(
  entity: T,
  instances: T[],
  matchOn: string = 'id',
): T | null => {
  const results = instances.filter(
    (instance) => entity && instance[matchOn] === entity[matchOn],
  );
  if (results.length === 0) {
    return null;
  }
  return results[0];
};
