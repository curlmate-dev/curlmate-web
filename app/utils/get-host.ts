export function getHost(request: Request) {
  return new URL(request.url).host;
}

export function isApiHost(request: Request) {
  return getHost(request).startsWith("api.");
}

export function isAppHost(request: Request) {
  return getHost(request).startsWith("app.");
}
