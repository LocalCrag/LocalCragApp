/**
 * Build id for floating image tags such as `next`.
 * The client Docker build overwrites this file when `APP_VERSION` is set.
 * Release builds leave it null and use the package.json version.
 */
export const buildVersion: string | null = null;
