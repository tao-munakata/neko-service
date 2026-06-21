'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeviceUser {
  id: string;
  nickname: string;
  catCharacter: string | null;
  deviceFingerprint: string | null;
  authMethod: string;
  createdAt: string;
  lastActiveAt: string;
}

interface DeviceIdentity {
  deviceId: string | null;
  userAgent: string;
  screenResolution?: string | null;
  timezone?: string | null;
  language?: string | null;
}

interface DeviceLogEntry {
  id: string;
  timestamp: string;
  type: 'registration_init' | 'device_login' | 'email_login';
  ip: string;
  identity: DeviceIdentity;
}

interface DeviceLogsResponse {
  active: boolean;
  expiresAt: string;
  logs: DeviceLogEntry[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const TYPE_LABEL: Record<DeviceLogEntry['type'], string> = {
  registration_init: '登録/デバイスログイン',
  device_login: 'デバイスログイン',
  email_login: 'メールログイン',
};

const TYPE_COLOR: Record<DeviceLogEntry['type'], string> = {
  registration_init: '#805ad5',
  device_login: '#2b6cb0',
  email_login: '#276749',
};

function parseUA(ua: string): string {
  if (/iPhone|iPad/.test(ua)) return `iOS / ${/Safari/.test(ua) ? 'Safari' : 'Other'}`;
  if (/Android/.test(ua)) return `Android / ${/Chrome/.test(ua) ? 'Chrome' : 'Other'}`;
  if (/Mac/.test(ua)) return `Mac / ${/Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : 'Safari'}`;
  if (/Windows/.test(ua)) return `Windows / ${/Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : 'Other'}`;
  return ua.slice(0, 40);
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [devices, setDevices] = useState<DeviceUser[]>([]);
  const [logs, setLogs] = useState<DeviceLogEntry[]>([]);
  const [logActive, setLogActive] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/devices`, {
        headers: { 'x-admin-secret': secret },
      });
      if (res.ok) setDevices(await res.json());
    } catch { /* ignore */ }
  }, [secret]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/device-logs`, {
        headers: { 'x-admin-secret': secret },
      });
      if (res.ok) {
        const data: DeviceLogsResponse = await res.json();
        setLogs(data.logs);
        setLogActive(data.active);
      }
    } catch { /* ignore */ }
  }, [secret]);

  async function authenticate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/devices`, {
        headers: { 'x-admin-secret': secret },
      });
      if (!res.ok) { setError(`認証失敗: ${res.status}`); return; }
      setDevices(await res.json());
      setAuthed(true);
      fetchLogs();
    } catch {
      setError('接続エラー');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authed) return;
    const timer = setInterval(() => { fetchDevices(); fetchLogs(); }, 10_000);
    return () => clearInterval(timer);
  }, [authed, fetchDevices, fetchLogs]);

  async function deleteDevice(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/devices/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      });
      if (res.ok) setDevices((prev) => prev.filter((d) => d.id !== id));
      else alert(`削除失敗: ${res.status}`);
    } finally {
      setDeletingId(null);
    }
  }

  if (!authed) {
    return (
      <div style={{ padding: '40px', maxWidth: '400px', margin: '80px auto', fontFamily: 'monospace' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '24px' }}>管理者ログイン</h1>
        <input
          type="password"
          placeholder="ADMIN_SECRET"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && authenticate()}
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '12px', boxSizing: 'border-box' }}
        />
        <button
          onClick={authenticate}
          disabled={loading}
          style={{ width: '100%', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? '確認中...' : 'ログイン'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '12px' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'monospace', fontSize: '13px' }}>

      {/* 左ペイン: デバイス一覧 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px', borderRight: '2px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>デバイス一覧 ({devices.length})</h2>
          <button onClick={fetchDevices} style={btnStyle}>更新</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f7fafc' }}>
              <th style={th}>名前</th>
              <th style={th}>方式</th>
              <th style={th}>デバイスID</th>
              <th style={th}>登録日</th>
              <th style={th}>最終</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>{d.catCharacter ?? d.nickname}</td>
                <td style={td}>
                  <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                    {d.authMethod}
                  </span>
                </td>
                <td style={{ ...td, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#718096' }}>
                  {d.deviceFingerprint ?? '—'}
                </td>
                <td style={td}>{new Date(d.createdAt).toLocaleDateString('ja-JP')}</td>
                <td style={td}>{new Date(d.lastActiveAt).toLocaleDateString('ja-JP')}</td>
                <td style={td}>
                  <button
                    onClick={() => deleteDevice(d.id, d.catCharacter ?? d.nickname)}
                    disabled={deletingId === d.id}
                    style={{ padding: '3px 8px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    {deletingId === d.id ? '...' : '削除'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 右ペイン: アクセスログ */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px', background: '#1a202c', color: '#e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>
            アクセスログ ({logs.length})
            {!logActive && (
              <span style={{ marginLeft: '8px', fontSize: '11px', color: '#fc8181', background: '#742a2a', padding: '2px 6px', borderRadius: '4px' }}>
                期限切れ
              </span>
            )}
          </h2>
          <button onClick={fetchLogs} style={{ ...btnStyle, background: '#2d3748', color: '#e2e8f0', border: '1px solid #4a5568' }}>更新</button>
        </div>

        {logs.length === 0 && (
          <p style={{ color: '#718096' }}>ログなし（ログイン操作後に表示されます）</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logs.map((entry) => (
            <div key={entry.id} style={{ background: '#2d3748', borderRadius: '6px', padding: '12px', borderLeft: `3px solid ${TYPE_COLOR[entry.type]}` }}>

              {/* タイムスタンプ + タイプバッジ */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#a0aec0', fontSize: '11px' }}>
                  {new Date(entry.timestamp).toLocaleString('ja-JP')}
                </span>
                <span style={{ background: TYPE_COLOR[entry.type], color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                  {TYPE_LABEL[entry.type]}
                </span>
              </div>

              {/* deviceId — 最重要・大・オレンジ */}
              <div style={{ marginBottom: '6px' }}>
                <span style={{ color: '#718096', fontSize: '10px' }}>DEVICE ID</span>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f6ad55', letterSpacing: '0.5px', wordBreak: 'break-all' }}>
                  {entry.identity.deviceId ?? '—'}
                </div>
              </div>

              {/* IP — 中・青 */}
              <div style={{ marginBottom: '6px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#718096', fontSize: '10px' }}>IP</span>
                  <div style={{ fontSize: '13px', color: '#63b3ed', fontWeight: '600' }}>{entry.ip}</div>
                </div>
                {entry.identity.timezone && (
                  <div>
                    <span style={{ color: '#718096', fontSize: '10px' }}>TZ</span>
                    <div style={{ fontSize: '12px', color: '#76e4f7' }}>{entry.identity.timezone}</div>
                  </div>
                )}
                {entry.identity.language && (
                  <div>
                    <span style={{ color: '#718096', fontSize: '10px' }}>LANG</span>
                    <div style={{ fontSize: '12px', color: '#76e4f7' }}>{entry.identity.language}</div>
                  </div>
                )}
                {entry.identity.screenResolution && (
                  <div>
                    <span style={{ color: '#718096', fontSize: '10px' }}>SCREEN</span>
                    <div style={{ fontSize: '12px', color: '#76e4f7' }}>{entry.identity.screenResolution}</div>
                  </div>
                )}
              </div>

              {/* User-Agent — 小・グレー */}
              <div>
                <span style={{ color: '#718096', fontSize: '10px' }}>UA</span>
                <div style={{ fontSize: '11px', color: '#a0aec0' }}>{parseUA(entry.identity.userAgent)}</div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 6px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '7px 6px' };
const btnStyle: React.CSSProperties = { padding: '5px 12px', background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };
