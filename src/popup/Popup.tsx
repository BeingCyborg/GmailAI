import React, { useState, useEffect } from 'react';
import {
  getSettings,
  saveSettings,
  AVAILABLE_MODELS,
  type ExtensionSettings,
} from '../shared/storage';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const Popup: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.5-flash-lite');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [loaded, setLoaded] = useState(false);

  // ── Load Settings ───────────────────────────────────────────────────────
  useEffect(() => {
    getSettings().then((settings: ExtensionSettings) => {
      setApiKey(settings.geminiApiKey);
      setModel(settings.geminiModel);
      setLoaded(true);
    });
  }, []);

  // ── Save Settings ───────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');

    try {
      await saveSettings({
        geminiApiKey: apiKey.trim(),
        geminiModel: model,
      });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (!loaded) {
    return (
      <div className="w-[350px] h-[300px] flex items-center justify-center bg-slate-900 overflow-hidden">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-[350px] bg-slate-900 text-slate-100 p-4 flex flex-col gap-3 font-sans overflow-hidden">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      />

      <div className="w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-tight">Gmail AI Reply</h1>
            <p className="text-xs text-slate-400">Settings & Configuration</p>
          </div>
        </div>

        {/* Settings Card */}
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
            
            {/* API Key Section */}
            <div className="p-3 border-b border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-200">
                  Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-primary-400 hover:text-primary-300 underline"
                >
                  Get API Key
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="w-full px-3 py-2 pr-10 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder:text-slate-500
                    focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                    transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showKey ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Model Selection */}
            <div className="p-3">
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                AI Model
              </label>
              <div className="space-y-1.5">
                {AVAILABLE_MODELS.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all duration-200 ${
                      model === m.id
                        ? 'border-primary-500 bg-primary-900/20'
                        : 'border-transparent bg-slate-900 hover:bg-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={m.id}
                      checked={model === m.id}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-3 h-3 text-primary-500 focus:ring-primary-500 focus:ring-offset-slate-900 bg-slate-800 border-slate-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="block text-xs font-medium text-slate-200">
                          {m.name}
                        </span>
                        {m.id === 'gemini-3.5-flash-lite' && (
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-primary-400 bg-primary-900/50 px-1.5 rounded-sm">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={status === 'saving'}
            className="w-full py-2 px-4 bg-primary-600 text-white text-sm font-semibold rounded-lg
              hover:bg-primary-500 active:bg-primary-700
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            {status === 'saving' && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {status === 'saved' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            )}
            {status === 'idle' && 'Save Settings'}
            {status === 'saving' && 'Saving...'}
            {status === 'saved' && 'Saved!'}
            {status === 'error' && 'Failed to save'}
          </button>
        </form>
      </div>
    </div>
  );
};
