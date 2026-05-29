import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, Bell, Shield, Volume2, Video, VolumeX, Eye, Flame, Trash2, 
  RefreshCw, Check, Sparkles, Sliders, Palette, Zap, Hammer
} from 'lucide-react';

export default function SettingsTab() {
  // Steampunk & General Preferences
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('pref_sound') !== 'false';
  });
  const [autoplayVideo, setAutoplayVideo] = useState(() => {
    return localStorage.getItem('pref_autoplay') !== 'false';
  });
  const [gearSpeed, setGearSpeed] = useState(() => {
    return localStorage.getItem('pref_gear_speed') || 'normal';
  });
  const [brassGlow, setBrassGlow] = useState(() => {
    return localStorage.getItem('pref_brass_glow') !== 'false';
  });

  // Notifications Preferences
  const [notifBids, setNotifBids] = useState(true);
  const [notifSales, setNotifSales] = useState(true);
  const [notifNews, setNotifNews] = useState(false);

  // Security Preferences
  const [incognitoBidding, setIncognitoBidding] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);

  // Visual/Theme Accents
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('pref_accent_color') || 'emerald';
  });

  // Action status/toasts
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  const savePreference = (key: string, value: string) => {
    localStorage.setItem(key, value);
    triggerToast("Preference Saved");
  };

  const triggerToast = (msg: string) => {
    setSavingStatus(msg);
    setTimeout(() => {
      setSavingStatus(null);
    }, 2000);
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to clear your local preferences and history cache? This will reset all personalization settings.")) {
      localStorage.clear();
      setSoundEnabled(true);
      setAutoplayVideo(true);
      setGearSpeed('normal');
      setBrassGlow(true);
      setAccentColor('emerald');
      triggerToast("All settings reset to factory defaults");
    }
  };

  const ACCENTS = [
    { id: 'emerald', label: 'Classic Emerald', color: '#10b981' },
    { id: 'amber', label: 'Steampunk Brass', color: '#b08d2b' },
    { id: 'rose', label: 'Rose Gold', color: '#f43f5e' },
    { id: 'sapphire', label: 'Cyan Quartz', color: '#06b6d4' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar pb-12">
      {/* Action Saved Toast */}
      {savingStatus && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#b08d2b] border border-[#d4af37] text-white px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase flex items-center gap-2 shadow-2xl animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          {savingStatus}
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-end min-h-[120px]">
        <div className="absolute top-4 right-4 text-slate-800 select-none pointer-events-none">
          <Settings className="w-24 h-24 stroke-[0.5] animate-[spin_40s_linear_infinite]" />
        </div>
        <div className="relative z-10">
          <span className="bg-[#b08d2b]/20 border border-[#b08d2b]/30 text-[#b08d2b] text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded">Engine Settings</span>
          <h3 className="text-xl font-black text-white mt-1">Preferences & Calibration</h3>
          <p className="text-xs text-slate-400 mt-1">Configure your viewing panel, alarm meters, and mechanical gears.</p>
        </div>
      </div>

      {/* Accent Color/Theme customization */}
      <section className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Palette className="w-4 h-4 text-[#b08d2b]" />
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">Aesthetic Calibration</h4>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-3">Tune the primary emission filters for controls, buttons, and visual scopes.</p>
          <div className="grid grid-cols-2 gap-2">
            {ACCENTS.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  setAccentColor(acc.id);
                  savePreference('pref_accent_color', acc.id);
                  // Refresh style elements seamlessly by generating a custom attribute
                  document.documentElement.setAttribute('data-accent', acc.id);
                }}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  accentColor === acc.id 
                    ? 'bg-slate-800/80 border-[#b08d2b]' 
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color }} />
                  <span className="text-xs font-bold text-white">{acc.label}</span>
                </div>
                {accentColor === acc.id && (
                  <Check className="w-3.5 h-3.5 text-[#b08d2b]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Steampunk Gearbox Adjustments */}
      <section className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Hammer className="w-4 h-4 text-[#b08d2b]" />
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">Steampunk Engine Valves</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-white">Pressure Valve Glow</h5>
              <p className="text-[10px] text-slate-400 mt-0.5">Toggle the ambient back-glow behind indicator gauges.</p>
            </div>
            <button
              onClick={() => {
                const updated = !brassGlow;
                setBrassGlow(updated);
                savePreference('pref_brass_glow', String(updated));
              }}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${brassGlow ? 'bg-[#b08d2b]' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${brassGlow ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="border-t border-slate-800/40 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h5 className="text-xs font-bold text-white">Gear Rotation Velocity</h5>
                <p className="text-[10px] text-slate-400">Controls the spin speed of background mechanical clocks.</p>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-[#b08d2b] font-mono capitalize font-bold">
                {gearSpeed === 'stop' ? 'Halted' : `${gearSpeed} spin`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['stop', 'slow', 'normal', 'overdrive'] as const).map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    setGearSpeed(speed);
                    savePreference('pref_gear_speed', speed);
                  }}
                  className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition ${
                    gearSpeed === speed 
                      ? 'bg-[#b08d2b]/20 text-[#b08d2b] border-[#b08d2b]' 
                      : 'bg-slate-950/20 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* App Preferences */}
      <section className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-[#b08d2b]" />
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">Acoustic & Media Valves</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-slate-950/40 p-2 rounded-xl text-slate-300">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#b08d2b]" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Acoustic Synthesizer</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">Toggle sound feedback during bids and catalog sweeps.</p>
              </div>
            </div>
            <button
              onClick={() => {
                const newVal = !soundEnabled;
                setSoundEnabled(newVal);
                savePreference('pref_sound', String(newVal));
              }}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-[#b08d2b]' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/40 pt-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-slate-950/40 p-2 rounded-xl text-slate-300">
                <Video className="w-4 h-4 text-[#b08d2b]" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Video Scope Autoplay</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">Automatically stream and loop feed item demonstrations.</p>
              </div>
            </div>
            <button
              onClick={() => {
                const newVal = !autoplayVideo;
                setAutoplayVideo(newVal);
                savePreference('pref_autoplay', String(newVal));
              }}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${autoplayVideo ? 'bg-[#b08d2b]' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoplayVideo ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Notifications tab */}
      <section className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Bell className="w-4 h-4 text-[#b08d2b]" />
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">Alert Telegrams</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-white">Bid & Auction Updates</h5>
              <p className="text-[10px] text-slate-400 mt-0.5">Receive lightning indicators when other buyers bid.</p>
            </div>
            <button
              onClick={() => setNotifBids(!notifBids)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${notifBids ? 'bg-[#b08d2b]' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifBids ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/40 pt-4">
            <div>
              <h5 className="text-xs font-bold text-white">Store Order Dispatches</h5>
              <p className="text-[10px] text-slate-400 mt-0.5">Get telemetry updates on delivery status.</p>
            </div>
            <button
              onClick={() => setNotifSales(!notifSales)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${notifSales ? 'bg-[#b08d2b]' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifSales ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/40 pt-4">
            <div>
              <h5 className="text-xs font-bold text-white">Daily Flash Drops</h5>
              <p className="text-[10px] text-slate-400 mt-0.5">Notify me on rare items newly cataloged in town.</p>
            </div>
            <button
              onClick={() => setNotifNews(!notifNews)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${notifNews ? 'bg-[#b08d2b]' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifNews ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Security tab */}
      <section className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Shield className="w-4 h-4 text-[#b08d2b]" />
          <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">Privacy & Shielding</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Anonymous Bidder Sign</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Hide your email handle in public auction histories.</p>
            </div>
            <button
              onClick={() => setIncognitoBidding(!incognitoBidding)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${incognitoBidding ? 'bg-[#b08d2b]' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${incognitoBidding ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/40 pt-4">
            <div>
              <h4 className="text-xs font-bold text-white">Discoverable Merchant Index</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Allow other patrons to browse your full reviews history.</p>
            </div>
            <button
              onClick={() => setPublicProfile(!publicProfile)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${publicProfile ? 'bg-[#b08d2b]' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${publicProfile ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Data management */}
      <section className="bg-rose-950/10 border border-rose-900/20 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-rose-900/20 pb-3">
          <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
          <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider">De-installation & Clean up</h4>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] text-rose-300/70 leading-relaxed">
            These diagnostic valves erase client buffers, session statistics, and customized calibration states. Use with deliberation.
          </p>
          <div className="flex flex-col gap-2">
            <button 
              onClick={handleResetData}
              className="flex items-center justify-center gap-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition py-2.5 rounded-xl text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" /> Re-calibrate Engine Defaults
            </button>
            <button 
              onClick={() => alert("This system operates offline as a local sandboxed terminal. To request official catalog de-registration, please mail your district coordinator.")}
              className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition py-2.5 rounded-xl text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Terminate Account Signature
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
