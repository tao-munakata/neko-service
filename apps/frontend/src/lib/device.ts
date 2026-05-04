// デバイス指紋を生成する（UA + 画面 + タイムゾーンのハッシュ）
export async function getDeviceFingerprint(): Promise<string> {
  const raw = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.hardwareConcurrency ?? 0,
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getUserAgent(): string {
  return navigator.userAgent;
}
