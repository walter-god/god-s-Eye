import React, { useState, useEffect } from 'react';
import { TargetProfile, SensorNode } from '../types';
import { 
  Crosshair, 
  MapPin, 
  Video, 
  Navigation, 
  Play, 
  Pause, 
  FastForward, 
  Radar, 
  Compass,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { playKeyClick, playRadarPing } from '../utils/soundEffects';

interface SectorMapViewProps {
  activeTarget: TargetProfile;
  sensorNodes: SensorNode[];
  onSelectSensor: (sensor: SensorNode) => void;
  selectedSensorId?: string;
  onTargetPositionUpdate?: (newPos: [number, number], speed: number) => void;
}

export const SectorMapView: React.FC<SectorMapViewProps> = ({
  activeTarget,
  sensorNodes,
  onSelectSensor,
  selectedSensorId,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [trackingState, setTrackingState] = useState<{
    targetOffset: { x: number; y: number };
    trail: { x: number; y: number; time: number }[];
  }>({
    targetOffset: { x: 50, y: 50 },
    trail: [],
  });
  const [showFovCones, setShowFovCones] = useState<boolean>(true);
  const [showCoverageHeatmap, setShowCoverageHeatmap] = useState<boolean>(false);

  // Smooth simulated movement along street corridor
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      // Move in an organic trajectory with street corner turns
      const t = Date.now() / (3000 / speedMultiplier);
      // Parametric path representing city blocks
      const newX = 50 + Math.sin(t * 0.7) * 28 + Math.cos(t * 0.3) * 10;
      const newY = 50 + Math.cos(t * 0.6) * 22 + Math.sin(t * 0.9) * 8;

      setTrackingState((prev) => ({
        targetOffset: { x: newX, y: newY },
        trail: [...prev.trail, { x: newX, y: newY, time: Date.now() }].slice(-25),
      }));
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier]);

  const { targetOffset, trail } = trackingState;

  // Sector camera positions normalized to the 2D grid
  const gridCameras = [
    { id: 'cam-01', name: 'CCTV-402 (NORTH JUNCTION)', x: 46, y: 32, fov: 60, angle: 135, type: 'CCTV' },
    { id: 'cam-02', name: 'ALPR-19 (EAST EXPRESSWAY)', x: 74, y: 48, fov: 45, angle: 260, type: 'ALPR' },
    { id: 'cam-03', name: 'UAV-07 (THERMAL OVERFLIGHT)', x: 54, y: 58, fov: 90, angle: 310, type: 'DRONE' },
    { id: 'cam-04', name: 'BIO-GATE 3 (SUBWAY CONCOURSE)', x: 30, y: 64, fov: 70, angle: 45, type: 'BIOMETRIC' },
    { id: 'cam-05', name: 'ATM-88 (COMMERCIAL ARCADE)', x: 62, y: 22, fov: 110, angle: 190, type: 'ATM' },
  ];

  return (
    <div className="relative w-full h-full min-h-[420px] bg-[#050810] border border-cyan-900/40 rounded-lg overflow-hidden flex flex-col select-none">
      {/* Top Header Bar */}
      <div className="px-3 py-2 border-b border-cyan-900/40 bg-slate-900/70 flex items-center justify-between text-xs font-mono-tech z-10">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          <span className="font-display-tech font-bold text-slate-200 uppercase tracking-wider">
            TACTICAL SECTOR MATRIX // {activeTarget.currentCity.toUpperCase()}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
            STREET RESOLUTION: 0.1M
          </span>
        </div>

        {/* Playback & tracking speed controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playKeyClick();
              setIsPlaying((prev) => !prev);
            }}
            className={`p-1.5 rounded border transition-colors ${
              isPlaying ? 'bg-cyan-950 text-cyan-300 border-cyan-600' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={isPlaying ? 'Pause Target Tracking Simulation' : 'Resume Target Tracking Simulation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-[10px]">
            {[1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => {
                  playKeyClick();
                  setSpeedMultiplier(speed);
                }}
                className={`px-1.5 py-0.5 rounded ${speedMultiplier === speed ? 'bg-cyan-900/80 text-cyan-300 font-bold' : 'text-slate-400'}`}
              >
                {speed}X
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              playKeyClick();
              setShowFovCones((prev) => !prev);
            }}
            className={`px-2 py-1 rounded text-[10px] border transition-colors ${
              showFovCones ? 'bg-cyan-950 text-cyan-300 border-cyan-600' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            FOV CONES: {showFovCones ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Tactical SVG Grid Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#040711]">
        <svg className="w-full h-full" viewBox="0 0 1000 700" preserveAspectRatio="none">
          <defs>
            {/* Grid Pattern */}
            <pattern id="tacticalGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(6, 182, 212, 0.07)" strokeWidth="1" />
              <circle cx="50" cy="50" r="1" fill="rgba(6, 182, 212, 0.25)" />
            </pattern>

            {/* Minor Radar Grid */}
            <pattern id="minorGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(6, 182, 212, 0.025)" strokeWidth="0.5" />
            </pattern>

            {/* Target glow filter */}
            <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Camera FOV radial gradient */}
            <radialGradient id="fovConeGrad" cx="0%" cy="0%" r="100%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.35)" />
              <stop offset="60%" stopColor="rgba(6, 182, 212, 0.1)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
            </radialGradient>
          </defs>

          {/* Grid Background */}
          <rect width="1000" height="700" fill="#040711" />
          <rect width="1000" height="700" fill="url(#minorGrid)" />
          <rect width="1000" height="700" fill="url(#tacticalGrid)" />

          {/* City Street Vector Topology */}
          <g stroke="rgba(30, 41, 59, 0.8)" strokeWidth="32" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Primary Avenue West-East */}
            <line x1="80" y1="350" x2="920" y2="350" />
            {/* Secondary Boulevard North-South */}
            <line x1="500" y1="60" x2="500" y2="640" />
            {/* Diagonal Express Corridor */}
            <line x1="120" y1="120" x2="880" y2="580" />
            {/* Cross Street North */}
            <line x1="150" y1="200" x2="850" y2="200" />
            {/* Cross Street South */}
            <line x1="150" y1="500" x2="850" y2="500" />
            {/* West Ring Road */}
            <line x1="280" y1="80" x2="280" y2="620" />
            {/* East Ring Road */}
            <line x1="720" y1="80" x2="720" y2="620" />
          </g>

          {/* Street Centerlines */}
          <g stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1.5" strokeDasharray="6 6" fill="none">
            <line x1="80" y1="350" x2="920" y2="350" />
            <line x1="500" y1="60" x2="500" y2="640" />
            <line x1="120" y1="120" x2="880" y2="580" />
            <line x1="150" y1="200" x2="850" y2="200" />
            <line x1="150" y1="500" x2="850" y2="500" />
            <line x1="280" y1="80" x2="280" y2="620" />
            <line x1="720" y1="80" x2="720" y2="620" />
          </g>

          {/* Building block outlines (tactical zoning) */}
          <g fill="rgba(15, 23, 42, 0.4)" stroke="rgba(51, 65, 85, 0.5)" strokeWidth="1">
            <rect x="305" y="225" width="170" height="100" rx="3" />
            <rect x="525" y="225" width="170" height="100" rx="3" />
            <rect x="305" y="375" width="170" height="100" rx="3" />
            <rect x="525" y="375" width="170" height="100" rx="3" />
            <rect x="100" y="225" width="155" height="100" rx="3" />
            <rect x="745" y="225" width="155" height="100" rx="3" />
            <rect x="100" y="375" width="155" height="100" rx="3" />
            <rect x="745" y="375" width="155" height="100" rx="3" />
          </g>

          {/* Camera Field-of-View (FOV) Cones */}
          {showFovCones &&
            gridCameras.map((cam) => {
              const cx = (cam.x / 100) * 1000;
              const cy = (cam.y / 100) * 700;
              const rad = 140;
              const angleRad = (cam.angle * Math.PI) / 180;
              const fovRad = (cam.fov * Math.PI) / 180;
              const startAngle = angleRad - fovRad / 2;
              const endAngle = angleRad + fovRad / 2;

              const x1 = cx + Math.cos(startAngle) * rad;
              const y1 = cy + Math.sin(startAngle) * rad;
              const x2 = cx + Math.cos(endAngle) * rad;
              const y2 = cy + Math.sin(endAngle) * rad;

              const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${rad} ${rad} 0 0 1 ${x2} ${y2} Z`;

              return (
                <g key={cam.id}>
                  <path d={pathData} fill="url(#fovConeGrad)" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="0.8" />
                  <line x1={cx} y1={cy} x2={cx + Math.cos(angleRad) * rad} y2={cy + Math.sin(angleRad) * rad} stroke="rgba(6, 182, 212, 0.3)" strokeDasharray="3 3" />
                </g>
              );
            })}

          {/* Historical Target Trajectory Breadcrumb Trail */}
          {trail.length > 1 && (
            <polyline
              points={trail.map((pt) => `${(pt.x / 100) * 1000},${(pt.y / 100) * 700}`).join(' ')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          )}

          {/* Trail dots with fading opacity */}
          {trail.map((pt, i) => {
            const opacity = ((i + 1) / trail.length) * 0.9;
            return (
              <circle
                key={i}
                cx={(pt.x / 100) * 1000}
                cy={(pt.y / 100) * 700}
                r={2 + (i / trail.length) * 2}
                fill="#f87171"
                opacity={opacity}
              />
            );
          })}

          {/* Interactive Camera Nodes */}
          {gridCameras.map((cam) => {
            const cx = (cam.x / 100) * 1000;
            const cy = (cam.y / 100) * 700;
            const isSelected = selectedSensorId === cam.id;

            return (
              <g
                key={cam.id}
                className="cursor-pointer"
                onClick={() => {
                  playKeyClick();
                  const matched = sensorNodes.find((s) => s.id === cam.id) || sensorNodes[0];
                  onSelectSensor(matched);
                }}
              >
                {/* Outer ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 14 : 9}
                  fill={isSelected ? 'rgba(6, 182, 212, 0.4)' : 'rgba(15, 23, 42, 0.8)'}
                  stroke={isSelected ? '#22d3ee' : '#0ea5e9'}
                  strokeWidth="1.5"
                />
                {/* Node icon / inner dot */}
                <circle cx={cx} cy={cy} r="3" fill="#38bdf8" />
                {/* Text tag */}
                <rect x={cx + 12} y={cy - 10} width="110" height="18" fill="rgba(8, 12, 20, 0.85)" stroke="rgba(14, 165, 233, 0.4)" rx="2" />
                <text x={cx + 16} y={cy + 3} fill="#94a3b8" fontSize="9" fontFamily="'JetBrains Mono', monospace">
                  {cam.name.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* TARGET POSITION (REAL-TIME LOCATOR & LOCK-ON BRACKETS) */}
          {(() => {
            const tx = (targetOffset.x / 100) * 1000;
            const ty = (targetOffset.y / 100) * 700;

            return (
              <g filter="url(#redGlow)">
                {/* Outer radar ping ring */}
                <circle cx={tx} cy={ty} r="26" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" className="animate-ping-slow" />
                <circle cx={tx} cy={ty} r="16" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="1.8" />
                {/* Center target dot */}
                <circle cx={tx} cy={ty} r="4" fill="#ef4444" />

                {/* High-tech God's Eye target bounding brackets */}
                <g stroke="#f87171" strokeWidth="2" fill="none">
                  {/* Top-Left */}
                  <path d={`M ${tx - 20} ${ty - 10} L ${tx - 20} ${ty - 20} L ${tx - 10} ${ty - 20}`} />
                  {/* Top-Right */}
                  <path d={`M ${tx + 10} ${ty - 20} L ${tx + 20} ${ty - 20} L ${tx + 20} ${ty - 10}`} />
                  {/* Bottom-Left */}
                  <path d={`M ${tx - 20} ${ty + 10} L ${tx - 20} ${ty + 20} L ${tx - 10} ${ty + 20}`} />
                  {/* Bottom-Right */}
                  <path d={`M ${tx + 10} ${ty + 20} L ${tx + 20} ${ty + 20} L ${tx + 20} ${ty + 10}`} />
                </g>

                {/* Tactical Callout Box */}
                <g transform={`translate(${tx + 26}, ${ty - 35})`}>
                  <line x1="-6" y1="35" x2="0" y2="20" stroke="#ef4444" strokeWidth="1.2" />
                  <rect x="0" y="0" width="180" height="52" fill="rgba(10, 15, 26, 0.95)" stroke="#ef4444" strokeWidth="1.2" rx="3" />
                  <text x="8" y="15" fill="#fca5a5" fontSize="10" fontWeight="bold" fontFamily="'Chakra Petch', sans-serif">
                    LOCK: {activeTarget.name.toUpperCase()}
                  </text>
                  <text x="8" y="28" fill="#38bdf8" fontSize="9" fontFamily="'JetBrains Mono', monospace">
                    SPEED: {activeTarget.movementSpeedKmh} KM/H // {activeTarget.transitMode}
                  </text>
                  <text x="8" y="42" fill="#34d399" fontSize="9" fontFamily="'JetBrains Mono', monospace">
                    BIO CONFIRM: {activeTarget.biometrics.faceMatchScore}% [VERIFIED]
                  </text>
                </g>
              </g>
            );
          })()}
        </svg>

        {/* Tactical HUD Overlays in corners */}
        <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded text-[11px] font-mono-tech text-slate-300">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Compass className="w-3.5 h-3.5" />
            <span>HEADING: {activeTarget.headingDegrees}° SSE</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            GRID REF: <span className="text-slate-200">35°39'34"N 139°42'02"E</span>
          </div>
        </div>

        <div className="absolute bottom-3 right-3 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded text-[11px] font-mono-tech text-slate-300">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>CELLULAR TRIANGULATION: LOCKED</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            SECTOR COVERAGE: <span className="text-cyan-300">98.2% CAMERA DENSITY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
