/** Les tarifs et les données admin doivent toujours être relus en base. */
export const fetchNoStore: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' });
