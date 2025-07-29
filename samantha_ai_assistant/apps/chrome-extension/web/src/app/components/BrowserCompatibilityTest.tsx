'use client';
import React, { useState, useEffect } from 'react';

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  isSupported: boolean;
  features: {
    webSpeechAPI: boolean;
    localStorage: boolean;
    cssGrid: boolean;
    cssFlexbox: boolean;
    cssAnimations: boolean;
    backdropFilter: boolean;
    webkitBackdropFilter: boolean;
  };
  issues: string[];
}

interface BrowserCompatibilityTestProps {
  onBrowserDetected?: (browserInfo: BrowserInfo) => void;
  showWarnings?: boolean;
  className?: string;
}

export default function BrowserCompatibilityTest({
  onBrowserDetected,
  showWarnings = true,
  className = ''
}: BrowserCompatibilityTestProps) {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const detectBrowser = (): BrowserInfo => {
      const userAgent = navigator.userAgent;
      let name = 'Unknown';
      let version = 'Unknown';
      let engine = 'Unknown';

      // Detect browser
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        name = 'Chrome';
        const match = userAgent.match(/Chrome\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Blink';
      } else if (userAgent.includes('Firefox')) {
        name = 'Firefox';
        const match = userAgent.match(/Firefox\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Gecko';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        name = 'Safari';
        const match = userAgent.match(/Version\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'WebKit';
      } else if (userAgent.includes('Edg')) {
        name = 'Edge';
        const match = userAgent.match(/Edg\/(\d+)/);
        version = match ? match[1] : 'Unknown';
        engine = 'Blink';
      }

      // Test features
      const features = {
        webSpeechAPI: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
        localStorage: (() => {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
          } catch {
            return false;
          }
        })(),
        cssGrid: CSS.supports('display', 'grid'),
        cssFlexbox: CSS.supports('display', 'flex'),
        cssAnimations: CSS.supports('animation', 'name 1s'),
        backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
        webkitBackdropFilter: CSS.supports('-webkit-backdrop-filter', 'blur(10px)')
      };

      // Check for issues
      const issues: string[] = [];

      if (!features.webSpeechAPI) {
        issues.push('Speech recognition not supported');
      }

      if (!features.localStorage) {
        issues.push('Local storage not available');
      }

      if (!features.cssGrid) {
        issues.push('CSS Grid not supported');
      }

      if (!features.cssFlexbox) {
        issues.push('CSS Flexbox not supported');
      }

      if (!features.cssAnimations) {
        issues.push('CSS Animations not supported');
      }

      const isSupported = issues.length === 0;

      const browserInfo: BrowserInfo = {
        name,
        version,
        engine,
        isSupported,
        features,
        issues
      };

      setBrowserInfo(browserInfo);
      onBrowserDetected?.(browserInfo);

      return browserInfo;
    };

    detectBrowser();
  }, [onBrowserDetected]);

  if (!browserInfo) {
    return null;
  }

  if (!showWarnings && browserInfo.isSupported) {
    return null;
  }

  return (
    <div className={`browser-compatibility-test ${className}`}>
      <div className="browser-info">
        <div className="browser-header">
          <span className="browser-name">{browserInfo.name} {browserInfo.version}</span>
          <span className={`browser-status ${browserInfo.isSupported ? 'supported' : 'unsupported'}`}>
            {browserInfo.isSupported ? '✅ Supported' : '⚠️ Issues Detected'}
          </span>
        </div>

        {!browserInfo.isSupported && (
          <div className="browser-issues">
            <button
              className="issues-toggle"
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails ? 'true' : 'false'}
            >
              {showDetails ? 'Hide' : 'Show'} Issues ({browserInfo.issues.length})
            </button>

            {showDetails && (
              <ul className="issues-list">
                {browserInfo.issues.map((issue, index) => (
                  <li key={index} className="issue-item">
                    {issue}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
