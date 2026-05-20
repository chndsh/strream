'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStream } from './providers/StreamProvider';

export default function Home() {
  const { setCurrentUser } = useStream();
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!name.trim() || !roomId.trim()) return;
    setLoading(true);
    setError('');

    try {
      const userId = name.toLowerCase().replace(/\s+/g, '-');

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calls/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, userId, userName: name }),
      });

      await setCurrentUser({ id: userId, name });
      router.push(`/call/${roomId}`);
    } catch (err) {
      setError('Failed to join room. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', gap: 16,
      fontFamily: 'sans-serif',
      background: '#0f0f0f', color: '#fff',
    }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Stream MVP</h1>

      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Room ID (e.g. room-123)"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        style={inputStyle}
      />

      {error && (
        <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>
      )}

      <button
        onClick={handleJoin}
        disabled={loading || !name.trim() || !roomId.trim()}
        style={{
          ...buttonStyle,
          opacity: loading || !name.trim() || !roomId.trim() ? 0.5 : 1,
        }}
      >
        {loading ? 'Joining...' : 'Join Room'}
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 16px', fontSize: 16, width: 300,
  borderRadius: 8, border: '1px solid #333',
  background: '#1a1a1a', color: '#fff', outline: 'none',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 32px', fontSize: 16,
  borderRadius: 8, border: 'none',
  background: '#2563eb', color: '#fff',
  cursor: 'pointer', width: 300,
};