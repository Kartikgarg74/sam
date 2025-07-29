import type { Metadata } from 'next';
import './globals.css';
import VoiceOrbEnhanced from './components/VoiceOrbEnhanced';
import ThemeSwitcherEnhanced from './components/ThemeSwitcherEnhanced';
import NotificationSystem from './components/NotificationSystem';
import BrowserCompatibilityTest from './components/BrowserCompatibilityTest';

export const metadata: Metadata = {
  title: 'Samantha AI Assistant',
  description: 'Cross-platform AI assistant with voice recognition and browser automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Samantha AI" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        {/* Browser Compatibility Test */}
        <BrowserCompatibilityTest
          showWarnings={true}
          className="fixed top-4 left-4 z-50"
        />

        {/* Voice Orb */}
        <VoiceOrbEnhanced
          position="top-right"
          size="medium"
          showStatus={true}
          showTranscript={true}
          onStatusChange={(status) => {
            console.log('Voice orb status:', status);
          }}
          onTranscript={(transcript) => {
            console.log('Voice transcript:', transcript);
          }}
        />

        {/* Theme Switcher */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
          <ThemeSwitcherEnhanced
            showSystemOption={true}
            persistTheme={true}
            onThemeChange={(theme) => {
              console.log('Theme changed:', theme);
            }}
          />
        </div>

        {/* Notification System */}
        <NotificationSystem
          maxNotifications={5}
          position="top-right"
          autoDismiss={true}
          defaultDuration={5000}
        />

        {/* Main Content */}
        <main className="min-h-screen bg-background text-foreground">
          {children}
        </main>

        {/* Responsive Design Indicators (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-mono">
            <div className="sm:hidden">XS</div>
            <div className="hidden sm:block md:hidden">SM</div>
            <div className="hidden md:block lg:hidden">MD</div>
            <div className="hidden lg:block xl:hidden">LG</div>
            <div className="hidden xl:block 2xl:hidden">XL</div>
            <div className="hidden 2xl:block">2XL</div>
          </div>
        )}
      </body>
    </html>
  );
}
