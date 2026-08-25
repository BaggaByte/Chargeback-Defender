import './globals.css';
import AppShell from '@/components/app-shell';

export const metadata = {
  title: 'Chargeback Defender',
  description: 'Automate payment dispute management for B2B SaaS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
