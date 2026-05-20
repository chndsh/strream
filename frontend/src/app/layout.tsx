import type { Metadata } from 'next';
import { StreamProvider } from './providers/StreamProvider';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stream MVP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <StreamProvider>
          {children}
        </StreamProvider>
      </body>
    </html>
  );
}

