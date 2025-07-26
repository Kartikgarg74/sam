import './globals.css';
import Link from 'next/link';
import VoiceOrb from './components/VoiceOrb';
import ThemeSwitcher from './ThemeSwitcher';

export const metadata = {
  title: 'Samantha AI Web Management',
  description: 'Manage, monitor, and configure your Samantha AI assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
        <VoiceOrb />
        <nav className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow-md">
          <div className="flex items-center gap-8">
            <span className="font-bold text-xl tracking-tight">Samantha AI</span>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/commands" className="hover:underline">Commands</Link>
            <Link href="/workflows" className="hover:underline">Workflows</Link>
            <Link href="/settings" className="hover:underline">Settings</Link>
          </div>
          <ThemeSwitcher />
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
