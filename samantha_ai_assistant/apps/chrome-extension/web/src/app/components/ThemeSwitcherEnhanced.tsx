'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { analytics } from '../utils/analytics';

// Types for enhanced theme switcher
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeSwitcherProps {
  className?: string;
  showSystemOption?: boolean;
  persistTheme?: boolean;
  onThemeChange?: (theme: Theme) => void;
  disabled?: boolean;
}

export default function ThemeSwitcherEnhanced({
  className = '',
  showSystemOption = true,
  persistTheme = true,
  onThemeChange,
  disabled = false
}: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [isOpen, setIsOpen] = useState(false);

  // Initialize theme
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Check for stored theme
        if (persistTheme && typeof window !== 'undefined') {
          const storedTheme = localStorage.getItem('samantha-theme') as Theme;
          if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
            setTheme(storedTheme);
          }
        }

        // Check system theme
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

          // Listen for system theme changes
          const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
          };

          mediaQuery.addEventListener('change', handleSystemThemeChange);
          return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
        }
      } catch (error) {
        console.error('Failed to initialize theme:', error);
      }
    };

    initializeTheme();
  }, [persistTheme]);

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      try {
        const root = document.documentElement;
        const actualTheme = theme === 'system' ? systemTheme : theme;

        // Remove all theme classes
        root.classList.remove('light', 'dark');

        // Add current theme class
        root.classList.add(actualTheme);

        // Update CSS custom properties
        root.style.setProperty('--theme', actualTheme);

        // Store theme if persistence is enabled
        if (persistTheme && typeof window !== 'undefined') {
          localStorage.setItem('samantha-theme', theme);
        }

        // Notify parent component
        onThemeChange?.(theme);

      } catch (error) {
        console.error('Failed to apply theme:', error);
      }
    };

    applyTheme();
  }, [theme, systemTheme, persistTheme, onThemeChange]);

  // Handle theme change
  const handleThemeChange = useCallback((newTheme: Theme) => {
    analytics.trackFeatureUsage('theme_switch', { theme: newTheme });
    setTheme(newTheme);
    setIsOpen(false);
  }, []);

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }, [disabled, isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        toggleDropdown();
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  }, [disabled, isOpen, toggleDropdown]);

  // Get current theme display
  const getCurrentThemeDisplay = () => {
    const actualTheme = theme === 'system' ? systemTheme : theme;
    return {
      icon: actualTheme === 'dark' ? '🌙' : '☀️',
      label: theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light',
      description: theme === 'system' ? `System (${systemTheme})` : theme
    };
  };

  // Get theme options
  const getThemeOptions = () => {
    const options = [
      {
        value: 'light' as Theme,
        icon: '☀️',
        label: 'Light',
        description: 'Light theme'
      },
      {
        value: 'dark' as Theme,
        icon: '🌙',
        label: 'Dark',
        description: 'Dark theme'
      }
    ];

    if (showSystemOption) {
      options.push({
        value: 'system' as Theme,
        icon: '🖥️',
        label: 'System',
        description: `System theme (${systemTheme})`
      });
    }

    return options;
  };

  const currentTheme = getCurrentThemeDisplay();
  const themeOptions = getThemeOptions();

  return (
    <div className={`theme-switcher ${className}`}>
      <button
        className="theme-switcher-button"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Toggle theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={`Current theme: ${currentTheme.description}`}
      >
        <span className="theme-switcher-icon" role="img" aria-hidden="true">
          {currentTheme.icon}
        </span>
        <span className="theme-switcher-label">{currentTheme.label}</span>
        <svg
          className={`theme-switcher-arrow ${isOpen ? 'theme-switcher-arrow-open' : ''}`}
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="theme-switcher-dropdown" role="listbox">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              className={`theme-switcher-option ${theme === option.value ? 'theme-switcher-option-selected' : ''}`}
              onClick={() => handleThemeChange(option.value)}
              role="option"
              aria-selected={theme === option.value}
              title={option.description}
            >
              <span className="theme-switcher-option-icon" role="img" aria-hidden="true">
                {option.icon}
              </span>
              <span className="theme-switcher-option-label">{option.label}</span>
              {theme === option.value && (
                <svg
                  className="theme-switcher-option-check"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="theme-switcher-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
