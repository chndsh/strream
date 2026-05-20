'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StreamVideoClient, User } from '@stream-io/video-react-sdk';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

interface StreamContextType {
  client: StreamVideoClient | null;
  user: User | null;
  setCurrentUser: (user: User) => void;
}

const StreamContext = createContext<StreamContextType>({
  client: null,
  user: null,
  setCurrentUser: () => {},
});

export function StreamProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const setCurrentUser = async (newUser: User) => {
    if (client) {
      await client.disconnectUser();
    }

    const tokenRes = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/calls/token`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: newUser.id }),
  }
);
    const { token } = await tokenRes.json();

    const newClient = new StreamVideoClient({
      apiKey,
      user: newUser,
      token,
    });

    setUser(newUser);
    setClient(newClient);
  };

  useEffect(() => {
    return () => {
      client?.disconnectUser();
    };
  }, [client]);

  return (
    <StreamContext.Provider value={{ client, user, setCurrentUser }}>
      {children}
    </StreamContext.Provider>
  );
}

export const useStream = () => useContext(StreamContext);