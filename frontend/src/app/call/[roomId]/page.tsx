'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  StreamVideo,
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  useCallStateHooks,
  CallingState,
} from '@stream-io/video-react-sdk';
import { useStream } from '../../providers/StreamProvider';

function ParticipantList() {
  const { useParticipants, useLocalParticipant } = useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();

  // deduplicate — remove remote entry for local user
  const deduplicated = participants.filter(
    (p) => !(p.userId === localParticipant?.userId && p.sessionId !== localParticipant?.sessionId)
  );

  return (
    <div style={{
      width: 220,
      background: '#111',
      borderLeft: '1px solid #222',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      gap: 8,
      overflowY: 'auto',
    }}>
      <div style={{ fontSize: 11, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        Participants ({deduplicated.length})
      </div>
      {deduplicated.map((p) => (
        <div key={p.sessionId} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 8,
          background: '#1a1a1a',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: stringToColor(p.userId),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0,
          }}>
            {(p.name ?? p.userId).charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.name ?? p.userId}
              {p.sessionId === localParticipant?.sessionId && (
                <span style={{ fontSize: 10, color: '#2563eb', marginLeft: 6 }}>(you)</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
              {p.isSpeaking ? '🎙 speaking' : p.isDominantSpeaker ? '⭐ dominant' : 'in call'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CallUI({ roomId, onLeave }: { roomId: string; onLeave: () => void }) {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const [showParticipants, setShowParticipants] = useState(true);

  if (callingState === CallingState.LEFT) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#fff', background: '#000' }}>
        You left the call.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', background: '#111', borderBottom: '1px solid #222',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
          <span style={{ color: '#fff', fontSize: 14 }}>Room: <strong>{roomId}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#666', fontSize: 13 }}>
  {[...new Map(participants.map(p => [p.userId, p])).values()].length} participant{[...new Map(participants.map(p => [p.userId, p])).values()].length !== 1 ? 's' : ''}
</span>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            style={{
              background: showParticipants ? '#1e40af' : '#1a1a1a',
              border: '1px solid #333', borderRadius: 6,
              color: '#fff', fontSize: 12, padding: '6px 12px', cursor: 'pointer',
            }}
          >
            {showParticipants ? 'Hide' : 'Show'} Participants
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <SpeakerLayout />
        </div>
        {showParticipants && <ParticipantList />}
      </div>

      {/* Controls */}
      <CallControls onLeave={onLeave} />
    </div>
  );
}

export default function CallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { client, user } = useStream();
  const router = useRouter();
  const [call, setCall] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!client || !user) {
      router.push('/');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const _call = client.call('default', roomId);

    // notify backend someone joined
    fetch(`${apiUrl}/calls/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, userId: user.id, userName: user.name }),
    });

    _call.join({ create: true })
      .then(() => setCall(_call))
      .catch((err: Error) => {
        console.error(err);
        setError('Failed to join call. Check console for details.');
      });

    return () => {
      // notify backend someone left
      fetch(`${apiUrl}/calls/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, userId: user.id }),
      });
      _call.leave().catch(console.error);
    };
  }, [client, user, roomId]);

  const handleLeave = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    await fetch(`${apiUrl}/calls/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, userId: user?.id }),
    });
    await call?.leave();
    router.push('/');
  };

  if (error) return (
    <div style={{ color: '#f87171', padding: 32, fontFamily: 'sans-serif', background: '#000', height: '100vh' }}>
      {error}
    </div>
  );

  if (!call) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', color: '#fff', background: '#000', fontFamily: 'sans-serif',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{ width: 32, height: 32, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div>Joining <strong>{roomId}</strong>...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <StreamVideo client={client!}>
      <StreamTheme>
        <StreamCall call={call}>
          <CallUI roomId={roomId} onLeave={handleLeave} />
        </StreamCall>
      </StreamTheme>
    </StreamVideo>
  );
}

// deterministic color from string
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 40%)`;
}