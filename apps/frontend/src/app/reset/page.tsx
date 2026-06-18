'use client';
import { useEffect } from 'react';

export default function ResetPage() {
  useEffect(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.replace('/login');
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fffdf7]">
      <div className="text-center">
        <div className="text-7xl mb-6">🐱</div>
        <p className="text-2xl text-gray-600">リセット中にゃん…</p>
      </div>
    </main>
  );
}
