'use client';

import { useState } from 'react';

interface DeviceUser {
  id: string;
  nickname: string;
  catCharacter: string | null;
  deviceFingerprint: string | null;
  authMethod: string;
  createdAt: string;
  lastActiveAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [devices, setDevices] = useState<DeviceUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchDevices() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/devices`, {
        headers: { 'x-admin-secret': secret },
      });
      if (!res.ok) {
        setError(`エラー: ${res.status} ${res.statusText}`);
        return;
      }
      setDevices(await res.json());
    } catch {
      setError('接続エラー');
    } finally {
      setLoading(false);
    }
  }

  async function deleteDevice(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/devices/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      });
      if (res.ok) {
        setDevices((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert(`削除失敗: ${res.status}`);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '16px' }}>管理者: デバイス一覧</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="password"
          placeholder="ADMIN_SECRET"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          onKeyDown={(e) => e.key === 'Enter' && fetchDevices()}
        />
        <button
          onClick={fetchDevices}
          disabled={loading}
          style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? '読込中...' : '取得'}
        </button>
      </div>

      {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}

      {devices.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={th}>名前</th>
              <th style={th}>方式</th>
              <th style={th}>フィンガープリント</th>
              <th style={th}>登録日</th>
              <th style={th}>最終アクティブ</th>
              <th style={th}>削除</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>{d.catCharacter ?? d.nickname}</td>
                <td style={td}>{d.authMethod}</td>
                <td style={{ ...td, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.deviceFingerprint ?? '—'}
                </td>
                <td style={td}>{new Date(d.createdAt).toLocaleDateString('ja-JP')}</td>
                <td style={td}>{new Date(d.lastActiveAt).toLocaleDateString('ja-JP')}</td>
                <td style={td}>
                  <button
                    onClick={() => deleteDevice(d.id, d.catCharacter ?? d.nickname)}
                    disabled={deletingId === d.id}
                    style={{ padding: '4px 10px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {deletingId === d.id ? '削除中' : '削除'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && devices.length === 0 && !error && (
        <p style={{ color: '#888' }}>シークレットを入力して「取得」を押してください</p>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px', textAlign: 'left', borderBottom: '2px solid #ccc' };
const td: React.CSSProperties = { padding: '8px' };
