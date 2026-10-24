import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Activity, 
  Radio, 
  FileText, 
  Tv, 
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';
import { playKeyClick, playNeuralSweep } from '../utils/soundEffects';

interface HeaderProps {
  privacyShieldActive: boolean;
  onTogglePrivacyShield: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  scanlinesEnabled: boolean;
  onToggleScanlines: () => void;
  onOpenAuditLog: () => void;
  onTriggerGlobalSweep: () => void;
  isScanning: boolean;
  activeTargetName: string;
}

export const Header: React.FC<HeaderProps> = ({
  privacyShieldActive,
  onTogglePrivacyShield,
  isMuted,
  onToggleMute,
  scanlinesEnabled,
  onToggleScanlines,
  onOpenAuditLog,
  onTriggerGlobalSweep,
  isScanning,
  activeTargetName,
}) => {
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2);
  });
  const [utcTime, setUtcTime] = useState<string>(() => new Date().toISOString().substring(11, 19) + 'Z');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0').slice(0, 2));
      setUtcTime(now.toISOString().substring(11, 19) + 'Z');
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-[#080d16] border-b border-cyan-900/40 text-slate-200 select-none">
      {/* Lawful Judicial Authorization Notice Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-cyan-950/80 border-b border-emerald-800/40 px-3 py-1 flex items-center justify-between text-xs tracking-wider">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono-tech font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>AUTHORIZED LAWFUL TELEMETRY</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-mono-tech hidden sm:inline">
            JUDICIAL WARRANT MANDATE: <strong className="text-emerald-300">#AEGIS-2026-X-FED</strong>
          </span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">
            RESTRICTED DEFENSE & SEARCH/RESCUE JURISDICTION ONLY
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono-tech text-[11px]">
          <span className="text-cyan-400/90 hidden lg:inline">
            CHAIN-OF-CUSTODY: <span className="text-slate-300">SHA-384 SEALED</span>
          </span>
          <button
            onClick={() => {
              playKeyClick();
              onOpenAuditLog();
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/40 transition-colors text-[11px]"
            title="Inspect Judicial Warrant Ledger & Privacy Verification"
          >
            <FileText className="w-3 h-3" />
            <span>AUDIT LEDGER</span>
          </button>
        </div>
      </div>

      {/* Primary Command Topbar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand and System Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div className="absolute -inset-0.5 rounded-lg border border-cyan-400/20 pointer-events-none animate-ping-slow opacity-40"></div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-display-tech font-bold tracking-widest text-slate-100 uppercase flex items-center gap-1.5">
                <span>AEGIS</span>
                <span className="text-cyan-400">OCULUS</span>
              </h1>
              <span className="text-[10px] uppercase font-mono-tech px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-600/40 tracking-wider">
                GOD'S EYE CORE v4.8
              </span>
            </div>
            <p className="text-[11px] font-mono-tech text-slate-400 tracking-wide">
              GLOBAL NEURAL SENSOR MATRIX // REAL-TIME OPTICAL TRIANGULATION
            </p>
          </div>
        </div>

        {/* Real-Time Telemetry & Status Badges */}
        <div className="hidden xl:flex items-center gap-4 text-xs font-mono-tech">
          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <div>
              <span className="text-slate-400 text-[10px] block leading-none">ACTIVE CAMERAS</span>
              <span className="text-cyan-300 font-semibold">4,892,110 NODES</span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <span className="text-slate-400 text-[10px] block leading-none">INFERENCE LATENCY</span>
              <span className="text-amber-300 font-semibold">1.18 ms / FRAME</span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
            <div>
              <span className="text-slate-400 text-[10px] block leading-none">TARGET ACTIVE</span>
              <span className="text-emerald-300 font-semibold truncate max-w-[130px] block">
                {activeTargetName}
              </span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <div>
              <span className="text-slate-400 text-[10px] block leading-none">GEOSPATIAL ENGINE</span>
              <span className="text-cyan-300 font-semibold">CESIUMJS 3D</span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 text-right">
            <span className="text-slate-400 text-[10px] block leading-none">ZULU TIME (UTC)</span>
            <span className="text-slate-200 font-semibold">{utcTime}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Privacy Redaction Shield */}
          <button
            onClick={() => {
              playKeyClick();
              onTogglePrivacyShield();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono-tech border transition-all ${
              privacyShieldActive
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Privacy Masking (Redacts non-target civilian faces in feeds)"
          >
            {privacyShieldActive ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">PRIVACY SHIELD</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${privacyShieldActive ? 'bg-emerald-800/80 text-emerald-100' : 'bg-slate-800 text-slate-400'}`}>
              {privacyShieldActive ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Scanline CRT FX Toggle */}
          <button
            onClick={() => {
              playKeyClick();
              onToggleScanlines();
            }}
            className={`p-1.5 rounded text-xs border transition-colors ${
              scanlinesEnabled 
                ? 'bg-cyan-950/60 border-cyan-600/50 text-cyan-300' 
                : 'bg-slate-900/80 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle CRT Scanline Overlay Effect"
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Audio Synthesizer Mute Toggle */}
          <button
            onClick={() => {
              onToggleMute();
            }}
            className={`p-1.5 rounded text-xs border transition-colors ${
              !isMuted 
                ? 'bg-cyan-950/60 border-cyan-600/50 text-cyan-300' 
                : 'bg-slate-900/80 border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            title={isMuted ? 'Unmute Tactical Audio Synthesis' : 'Mute Tactical Audio Synthesis'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Global Neural Sweep Trigger Button */}
          <button
            disabled={isScanning}
            onClick={() => {
              playNeuralSweep();
              onTriggerGlobalSweep();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-display-tech font-bold uppercase tracking-wider transition-all border ${
              isScanning
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 animate-pulse'
                : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border-cyan-500/60 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-95'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : 'text-cyan-400'}`} />
            <span>{isScanning ? 'SWEEPING GLOBAL NET...' : 'EXECUTE NEURAL SWEEP'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
