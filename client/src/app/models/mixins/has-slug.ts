type Constructor = new (...args: any[]) => object;

export function HasSlug<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    slug: string;
  };
}

export type SlugInstance = InstanceType<ReturnType<typeof HasSlug>>;

export function deserializeSlugAttributes(
  instance: SlugInstance,
  payload: any,
): void {
  instance.slug = payload.slug;
}
