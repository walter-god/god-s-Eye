import React, { useState } from 'react';
import { CameraFeed, TargetProfile } from '../types';
import { 
  Maximize2, 
  Video, 
  Eye, 
  EyeOff, 
  Scan, 
  ShieldCheck, 
  Layers, 
  Thermometer, 
  Camera, 
  Sliders, 
  X,
  Crosshair,
  CheckCircle2
} from 'lucide-react';
import { playKeyClick, playTargetLock } from '../utils/soundEffects';

interface ComputerVisionFeedGridProps {
  feeds: CameraFeed[];
  activeTarget: TargetProfile;
  privacyShieldActive: boolean;
}

export const ComputerVisionFeedGrid: React.FC<ComputerVisionFeedGridProps> = ({
  feeds,
  activeTarget,
  privacyShieldActive,
}) => {
  const [selectedFeed, setSelectedFeed] = useState<CameraFeed | null>(null);
  const [activeFilter, setActiveFilter] = useState<'STANDARD' | 'THERMAL' | 'NIGHT_VISION' | 'EDGE_NEURAL'>('STANDARD');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [capturedSnaps, setCapturedSnaps] = useState<string[]>([]);
  const [showSnapToast, setShowSnapToast] = useState<boolean>(false);

  const handleCaptureSnapshot = () => {
    playTargetLock();
    const snapId = `FRAME-${Date.now().toString().slice(-6)}`;
    setCapturedSnaps((prev) => [snapId, ...prev]);
    setShowSnapToast(true);
    setTimeout(() => setShowSnapToast(false), 2400);
  };

  // Helper to get simulated visual background per feed type & filter
  const getFeedStyle = (filterMode: string) => {
    switch (filterMode) {
      case 'THERMAL':
        return 'bg-gradient-to-tr from-purple-950 via-red-950 to-amber-900 filter saturate-150 contrast-125';
      case 'NIGHT_VISION':
        return 'bg-gradient-to-b from-emerald-950 via-[#032014] to-black text-emerald-300 filter contrast-125';
      case 'EDGE_NEURAL':
        return 'bg-[#050b14] border border-cyan-500/40 text-cyan-300';
      default:
        return 'bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-[#040810]';
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Feed Grid Header */}
      <div className="flex items-center justify-between px-1 text-xs font-mono-tech">
        <div className="flex items-center gap-2 text-cyan-300">
          <Scan className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-display-tech font-bold uppercase tracking-wider text-slate-200">
            NEURAL OPTICAL TRIAGE GRID
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            LIVE MULTI-ANGLE SENSORS
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {privacyShieldActive ? (
            <span className="flex items-center gap-1 text-emerald-400 font-mono-tech">
              <ShieldCheck className="w-3.5 h-3.5" />
              NON-TARGET FACES MASKED
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400/90 font-mono-tech">
              <Eye className="w-3.5 h-3.5" />
              RAW INGESTION MODE
            </span>
          )}
        </div>
      </div>

      {/* 4-Up Video Feed Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {feeds.map((feed) => {
          const effectiveFilter = feed.filterMode || 'STANDARD';

          return (
            <div
              key={feed.id}
              className={`relative rounded-lg overflow-hidden border transition-all group ${
                feed.hasTargetLock
                  ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-slate-950'
                  : 'border-slate-800 hover:border-cyan-700/50 bg-slate-950'
              }`}
            >
              {/* Camera Header Bar */}
              <div className="px-2.5 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono-tech z-10">
                <div className="flex items-center gap-1.5 truncate">
                  <div className={`w-2 h-2 rounded-full ${feed.hasTargetLock ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></div>
                  <span className="text-slate-200 font-semibold truncate">{feed.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{feed.streamFps} FPS</span>
                  <button
                    onClick={() => {
                      playKeyClick();
                      setSelectedFeed(feed);
                      setActiveFilter(feed.filterMode || 'STANDARD');
                      setZoomLevel(1);
                    }}
                    className="p-1 rounded hover:bg-cyan-950 text-cyan-400 transition-colors"
                    title="Maximize & Deep Optical Analysis"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Feed Viewport Canvas / Stage */}
              <div className={`relative h-44 w-full overflow-hidden ${getFeedStyle(effectiveFilter)} flex items-center justify-center`}>
                {/* Background optical simulation noise & horizon */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

                {/* Perspective road / avenue perspective lines */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                  <line x1="10%" y1="90%" x2="45%" y2="40%" stroke="#06b6d4" strokeWidth="1" />
                  <line x1="90%" y1="90%" x2="55%" y2="40%" stroke="#06b6d4" strokeWidth="1" />
                  <line x1="30%" y1="90%" x2="48%" y2="40%" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="70%" y1="90%" x2="52%" y2="40%" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="3 3" />
                </svg>

                {/* Target Avatar Visual Representation in Feed */}
                {feed.hasTargetLock && (
                  <div 
                    className="absolute z-10"
                    style={{
                      left: '42%',
                      top: '26%',
                      width: '74px',
                      height: '92px',
                    }}
                  >
                    {/* Target Photo representation */}
                    <div className="relative w-full h-full rounded overflow-hidden border border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.4)]">
                      <img
                        src={activeTarget.avatarUrl}
                        alt={activeTarget.name}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover ${
                          effectiveFilter === 'THERMAL'
                            ? 'filter hue-rotate-90 saturate-200 contrast-150'
                            : effectiveFilter === 'NIGHT_VISION'
                            ? 'filter grayscale contrast-150 brightness-110'
                            : ''
                        }`}
                      />

                      {/* 68-Point Facial Landmark Mesh Overlay */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-85">
                        {/* Eye landmarks */}
                        <circle cx="26" cy="38" r="1.8" fill="#38bdf8" />
                        <circle cx="48" cy="38" r="1.8" fill="#38bdf8" />
                        <line x1="22" y1="34" x2="30" y2="34" stroke="#38bdf8" strokeWidth="0.8" />
                        <line x1="44" y1="34" x2="52" y2="34" stroke="#38bdf8" strokeWidth="0.8" />
                        {/* Nose bridge */}
                        <line x1="37" y1="36" x2="37" y2="52" stroke="#38bdf8" strokeWidth="0.8" />
                        <circle cx="37" cy="52" r="1.5" fill="#38bdf8" />
                        {/* Mouth landmark */}
                        <ellipse cx="37" cy="65" rx="9" ry="3" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
                        {/* Jawline contour */}
                        <path d="M 16 38 Q 37 86 58 38" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
                      </svg>
                    </div>

                    {/* God's Eye Brackets */}
                    <div className="absolute -inset-2 border-2 border-red-500 pointer-events-none rounded">
                      <span className="absolute -top-4 left-0 bg-red-600 text-white font-mono-tech text-[9px] px-1 font-bold">
                        MATCH: {activeTarget.biometrics.faceMatchScore}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Other simulated detections (civilian faces & vehicles) */}
                {feed.detections.map((det) => {
                  if (det.isTarget) return null; // Handled above

                  return (
                    <div
                      key={det.id}
                      className="absolute border border-cyan-400/50 rounded flex flex-col justify-between"
                      style={{
                        left: `${det.x}%`,
                        top: `${det.y}%`,
                        width: `${det.width}%`,
                        height: `${det.height}%`,
                      }}
                    >
                      {/* Privacy Redaction Shield */}
                      {privacyShieldActive ? (
                        <div className="w-full h-full bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-0.5 border border-emerald-500/40">
                          <EyeOff className="w-3 h-3 text-emerald-400 mb-0.5" />
                          <span className="text-[7px] text-emerald-300 font-mono-tech leading-none uppercase">
                            REDACTED
                          </span>
                          <span className="text-[6px] text-slate-400 font-mono-tech leading-none mt-0.5">
                            CIVILIAN
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="bg-slate-950/80 text-cyan-300 text-[8px] font-mono-tech px-1 self-start truncate">
                            {det.label}
                          </span>
                          <span className="bg-slate-950/80 text-slate-400 text-[7px] font-mono-tech px-1 self-end">
                            {det.confidence}%
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Tactical HUD Corner Crosshairs */}
                <div className="absolute top-2 left-2 text-[9px] font-mono-tech text-cyan-400/80">
                  REC // {feed.resolution}
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono-tech text-slate-400">
                  LATENCY: 1.1ms
                </div>
              </div>

              {/* Feed Location Footer */}
              <div className="px-2 py-1 bg-slate-900/60 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono-tech text-slate-400">
                <span className="truncate">{feed.location}</span>
                <span className="text-cyan-400/90 font-semibold">{effectiveFilter}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Modal for Detailed Deep Optical Analysis */}
      {selectedFeed && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-[#090e18] border border-cyan-500/60 rounded-xl overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Topbar */}
            <div className="px-4 py-3 bg-slate-900 border-b border-cyan-900/60 flex items-center justify-between font-mono-tech text-xs">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                <span className="font-display-tech font-bold text-slate-100 text-sm">
                  {selectedFeed.name} // HIGH-RES FORENSIC VIEW
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-[11px]">
                  {selectedFeed.resolution}
                </span>
              </div>

              <button
                onClick={() => {
                  playKeyClick();
                  setSelectedFeed(null);
                }}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Main Screen */}
            <div className="relative h-[420px] w-full bg-black overflow-hidden flex items-center justify-center">
              <div 
                className={`relative w-full h-full ${getFeedStyle(activeFilter)} flex items-center justify-center transition-all`}
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Target Detailed Close-Up if locked */}
                {selectedFeed.hasTargetLock ? (
                  <div className="relative w-64 h-80 rounded-lg overflow-hidden border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                    <img
                      src={activeTarget.avatarUrl}
                      alt={activeTarget.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />

                    {/* Detailed 68-Point Vector Mesh */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {/* Iris scan circles */}
                      <circle cx="95" cy="120" r="12" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                      <circle cx="160" cy="120" r="12" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                      <circle cx="95" cy="120" r="4" fill="#06b6d4" />
                      <circle cx="160" cy="120" r="4" fill="#06b6d4" />

                      {/* Nasal & Jaw Mesh */}
                      <path d="M 95 120 L 128 160 L 160 120" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" />
                      <path d="M 128 160 L 128 200" fill="none" stroke="#22d3ee" strokeWidth="1" />
                      <ellipse cx="128" cy="215" rx="24" ry="8" fill="none" stroke="#22d3ee" strokeWidth="1.2" />
                      <path d="M 60 120 Q 128 290 195 120" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                    </svg>

                    {/* Lock-on HUD Overlays */}
                    <div className="absolute top-2 left-2 bg-red-950/90 border border-red-500 text-red-200 px-2 py-1 rounded text-[10px] font-mono-tech font-bold">
                      TARGET: {activeTarget.name.toUpperCase()}
                    </div>
                    <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-slate-700 text-cyan-300 px-2 py-1 rounded text-[10px] font-mono-tech">
                      VECTOR MATCH: {activeTarget.biometrics.faceMatchScore}% // IRIS: VERIFIED
                    </div>
                  </div>
                ) : (
                  <div className="text-center font-mono-tech text-slate-400">
                    <Crosshair className="w-12 h-12 text-cyan-500/50 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm">ACTIVE MONITORING FEED // AREA PATROL</p>
                    <p className="text-xs text-slate-500 mt-1">{selectedFeed.location}</p>
                  </div>
                )}
              </div>

              {/* Snapshot Captured Toast */}
              {showSnapToast && (
                <div className="absolute top-4 right-4 bg-emerald-950/90 border border-emerald-500 text-emerald-200 px-3 py-1.5 rounded text-xs font-mono-tech flex items-center gap-2 shadow-lg animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>FORENSIC FRAME ARCHIVED TO WARRANT RECORD</span>
                </div>
              )}
            </div>

            {/* Modal Bottom Controls */}
            <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-tech">
              {/* Shader / Optical Filter Modes */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 mr-1">OPTICAL FILTER:</span>
                {(['STANDARD', 'THERMAL', 'NIGHT_VISION', 'EDGE_NEURAL'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      playKeyClick();
                      setActiveFilter(filter);
                    }}
                    className={`px-2.5 py-1 rounded border transition-colors ${
                      activeFilter === filter
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Digital PTZ Zoom Controls */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400">DIGITAL ZOOM:</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.2"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                  className="w-24 accent-cyan-400 cursor-pointer"
                />
                <span className="text-cyan-300 w-8">{zoomLevel}x</span>

                <button
                  onClick={handleCaptureSnapshot}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-colors ml-2"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>SAVE FORENSIC FRAME</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
