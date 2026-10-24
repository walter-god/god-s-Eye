import React, { useState } from 'react';
import { TelemetryEvent, TargetProfile } from '../types';
import { 
  Terminal, 
  Wifi, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRightLeft, 
  Target, 
  Filter,
  CheckCircle,
  Pause,
  Play
} from 'lucide-react';
import { playKeyClick } from '../utils/soundEffects';

interface TrackingTelemetryStreamProps {
  events: TelemetryEvent[];
  activeTarget: TargetProfile;
  onClearEvents?: () => void;
}

export const TrackingTelemetryStream: React.FC<TrackingTelemetryStreamProps> = ({
  events,
  activeTarget,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [frozenEvents, setFrozenEvents] = useState<TelemetryEvent[] | null>(null);

  const handleTogglePause = () => {
    playKeyClick();
    if (!isPaused) {
      setFrozenEvents(events);
      setIsPaused(true);
    } else {
      setFrozenEvents(null);
      setIsPaused(false);
    }
  };

  const currentEvents = isPaused && frozenEvents ? frozenEvents : events;
  const filtered = currentEvents.filter((evt) => {
    if (filterType === 'ALL') return true;
    return evt.type === filterType;
  });

  const getEventBadge = (type: TelemetryEvent['type']) => {
    switch (type) {
      case 'TARGET_LOCK':
        return (
          <span className="flex items-center gap-1 text-red-400 bg-red-950/70 border border-red-800/80 px-1.5 py-0.5 rounded text-[9px] font-bold">
            <Target className="w-3 h-3" />
            <span>LOCK-ON</span>
          </span>
        );
      case 'SENSOR_HANDOFF':
        return (
          <span className="flex items-center gap-1 text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-1.5 py-0.5 rounded text-[9px] font-bold">
            <ArrowRightLeft className="w-3 h-3" />
            <span>HANDOFF</span>
          </span>
        );
      case 'BIOMETRIC_MATCH':
        return (
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded text-[9px] font-bold">
            <CheckCircle className="w-3 h-3" />
            <span>MATCH</span>
          </span>
        );
      case 'PRIVACY_SHIELD':
        return (
          <span className="flex items-center gap-1 text-purple-400 bg-purple-950/70 border border-purple-800/80 px-1.5 py-0.5 rounded text-[9px] font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span>PRIVACY</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-slate-300 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[9px]">
            <Activity className="w-3 h-3" />
            <span>TELEMETRY</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-[#070a12] border border-cyan-900/40 rounded-lg overflow-hidden flex flex-col font-mono-tech select-none">
      {/* Stream Header */}
      <div className="px-3 py-2 border-b border-cyan-900/40 bg-slate-900/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-display-tech font-bold text-slate-200 uppercase tracking-wider">
            CONTINUOUS TELEMETRY & SENSOR HOP FEED
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Resume Ticker */}
          <button
            onClick={handleTogglePause}
            className={`p-1 rounded border transition-colors ${
              isPaused ? 'bg-amber-950 border-amber-600 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={isPaused ? 'Resume live feed' : 'Pause feed scrolling'}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>

          {/* Type Filter */}
          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-[9px]">
            {['ALL', 'TARGET_LOCK', 'SENSOR_HANDOFF', 'PRIVACY_SHIELD'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  playKeyClick();
                  setFilterType(f);
                }}
                className={`px-1.5 py-0.5 rounded ${
                  filterType === f ? 'bg-cyan-900/80 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Ticker Metrics Subbar */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-850 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
        <div>
          STREAMING SOURCE:{' '}
          <span className="text-cyan-300 font-semibold">{activeTarget.lastConfirmedNode}</span>
        </div>
        <div>
          VELOCITY:{' '}
          <span className="text-amber-300 font-semibold">{activeTarget.movementSpeedKmh} KM/H</span>
        </div>
        <div>
          BEARING:{' '}
          <span className="text-slate-200 font-semibold">{activeTarget.headingDegrees}°</span>
        </div>
        <div>
          CHAIN-OF-CUSTODY:{' '}
          <span className="text-emerald-400 font-semibold">VERIFIED HASH</span>
        </div>
      </div>

      {/* Events Scroll Area */}
      <div className="h-48 overflow-y-auto p-2 flex flex-col gap-1.5 bg-[#05070e]">
        {filtered.map((evt) => (
          <div
            key={evt.id}
            className="p-1.5 rounded bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-800/40 text-[11px] flex items-start justify-between gap-2 transition-colors"
          >
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-slate-500 text-[10px] whitespace-nowrap mt-0.5">
                {evt.timestamp}
              </span>
              {getEventBadge(evt.type)}
              <span className="text-slate-300 leading-tight break-words">
                {evt.message}
              </span>
            </div>

            <span className="text-[10px] text-slate-500 whitespace-nowrap hidden sm:inline">
              {evt.sensorId}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
