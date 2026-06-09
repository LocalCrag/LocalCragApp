import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

export interface TopoListSortSelectOption {
  label: string;
  value: string;
}

export function buildTopoListOrderOptions(
  translocoService: TranslocoService,
): TopoListSortSelectOption[] {
  return [
    {
      label: translocoService.translate(marker('orderByOrderIndex')),
      value: 'orderIndex',
    },
    {
      label: translocoService.translate(marker('orderByName')),
      value: 'name',
    },
    {
      label: translocoService.translate(marker('orderByLineCount')),
      value: 'lineCount',
    },
    {
      label: translocoService.translate(marker('orderByAscentCount')),
      value: 'ascentCount',
    },
  ];
}

export function buildTopoListOrderDirectionOptions(
  translocoService: TranslocoService,
): TopoListSortSelectOption[] {
  return [
    {
      label: translocoService.translate(marker('orderDescending')),
      value: 'desc',
    },
    {
      label: translocoService.translate(marker('orderAscending')),
      value: 'asc',
    },
  ];
}

export function topoListSortFieldAndOrder(
  orderKey: TopoListSortSelectOption,
  orderDirectionKey: TopoListSortSelectOption,
): { sortField: string; sortOrder: number } {
  return {
    sortField: orderKey.value,
    sortOrder: orderDirectionKey.value === 'asc' ? 1 : -1,
  };
}
