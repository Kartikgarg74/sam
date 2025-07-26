'use client';
import { useEffect, useState } from 'react';

interface VoiceSettings {
  recognition: 'Whisper' | 'Gemini';
  synthesis: 'ElevenLabs' | 'System';
  volume: number;
}
interface ServiceSettings {
  geminiApiKey: string;
  elevenLabsApiKey: string;
}
interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
}
interface SecuritySettings {
  permissions: string[];
  accessControl: boolean;
}
interface Settings {
  voice: VoiceSettings;
  service: ServiceSettings;
  user: UserSettings;
  security: SecuritySettings;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then((data: Settings) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  function handleChange<T extends keyof Settings, K extends keyof Settings[T]>(section: T, key: K, value: Settings[T][K]) {
    setSettings(prev => prev ? {
      ...prev,
      [section]: { ...prev[section], [key]: value },
    } : prev);
  }

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
  }

  if (loading || !settings) return <div>Loading settings...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <form
        className="space-y-6"
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
      >
        <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
          <h2 className="font-semibold mb-2">Voice Settings</h2>
          <div className="flex flex-col gap-2">
            <label>
              Recognition:
              <select
                className="ml-2"
                value={settings.voice.recognition}
                onChange={e => handleChange('voice', 'recognition', e.target.value as VoiceSettings['recognition'])}
              >
                <option value="Whisper">Whisper</option>
                <option value="Gemini">Gemini</option>
              </select>
            </label>
            <label>
              Synthesis:
              <select
                className="ml-2"
                value={settings.voice.synthesis}
                onChange={e => handleChange('voice', 'synthesis', e.target.value as VoiceSettings['synthesis'])}
              >
                <option value="ElevenLabs">ElevenLabs</option>
                <option value="System">System</option>
              </select>
            </label>
            <label>
              Volume:
              <input
                type="range"
                min={0}
                max={100}
                value={settings.voice.volume}
                onChange={e => handleChange('voice', 'volume', Number(e.target.value))}
                className="ml-2"
              />
              <span className="ml-2">{settings.voice.volume}</span>
            </label>
          </div>
        </section>
        <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
          <h2 className="font-semibold mb-2">Service Configuration</h2>
          <div className="flex flex-col gap-2">
            <label>
              Gemini API Key:
              <input
                type="password"
                className="ml-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                value={settings.service.geminiApiKey}
                onChange={e => handleChange('service', 'geminiApiKey', e.target.value)}
              />
            </label>
            <label>
              ElevenLabs API Key:
              <input
                type="password"
                className="ml-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                value={settings.service.elevenLabsApiKey}
                onChange={e => handleChange('service', 'elevenLabsApiKey', e.target.value)}
              />
            </label>
          </div>
        </section>
        <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
          <h2 className="font-semibold mb-2">User Preferences</h2>
          <div className="flex flex-col gap-2">
            <label>
              Theme:
              <select
                className="ml-2"
                value={settings.user.theme}
                onChange={e => handleChange('user', 'theme', e.target.value as UserSettings['theme'])}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>
              Notifications:
              <input
                type="checkbox"
                className="ml-2"
                checked={settings.user.notifications}
                onChange={e => handleChange('user', 'notifications', e.target.checked)}
              />
            </label>
          </div>
        </section>
        <section className="p-6 bg-white dark:bg-gray-800 rounded shadow">
          <h2 className="font-semibold mb-2">Security Settings</h2>
          <div className="flex flex-col gap-2">
            <label>
              Permissions:
              <input
                type="text"
                className="ml-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700"
                value={settings.security.permissions.join(', ')}
                onChange={e => handleChange('security', 'permissions', e.target.value.split(',').map((s: string) => s.trim()))}
              />
            </label>
            <label>
              Access Control:
              <input
                type="checkbox"
                className="ml-2"
                checked={settings.security.accessControl}
                onChange={e => handleChange('security', 'accessControl', e.target.checked)}
              />
            </label>
          </div>
        </section>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
