export function getDeviceId(): string {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('deviceId', id);
  }
  return id;
}

export function getUserAgent(): string {
  return navigator.userAgent;
}
