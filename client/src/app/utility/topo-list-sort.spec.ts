import {
  topoListSortFieldAndOrder,
  TopoListSortSelectOption,
} from './topo-list-sort';

describe('topoListSortFieldAndOrder', () => {
  const orderIndexAsc: TopoListSortSelectOption = {
    label: 'Topo position',
    value: 'orderIndex',
  };
  const nameDesc: TopoListSortSelectOption = { label: 'Name', value: 'name' };
  const asc: TopoListSortSelectOption = { label: 'asc', value: 'asc' };
  const desc: TopoListSortSelectOption = { label: 'desc', value: 'desc' };

  it('maps ascending to PrimeNG sortOrder 1', () => {
    expect(topoListSortFieldAndOrder(orderIndexAsc, asc)).toEqual({
      sortField: 'orderIndex',
      sortOrder: 1,
    });
  });

  it('maps descending to PrimeNG sortOrder -1', () => {
    expect(topoListSortFieldAndOrder(nameDesc, desc)).toEqual({
      sortField: 'name',
      sortOrder: -1,
    });
  });
});
