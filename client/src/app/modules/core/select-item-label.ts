export function selectItemLabel(
  options: { label: string; value: unknown }[] | null | undefined,
) {
  return (value: unknown) =>
    options?.find((option) => option.value === value)?.label ??
    (value == null ? '' : String(value));
}

export function joinedSelectLabels(
  options: { label: string; value: unknown }[] | null | undefined,
  values: unknown[] | null | undefined,
) {
  return (values ?? [])
    .map((value) => selectItemLabel(options)(value))
    .filter((label) => label.length > 0)
    .join(', ');
}
