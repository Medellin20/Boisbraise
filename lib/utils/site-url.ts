export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    'http://localhost:3000';

  return configuredUrl.replace(/\/$/, '');
}
