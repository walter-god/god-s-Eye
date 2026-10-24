import React, { useRef, useEffect, useState } from 'react';
import { TargetProfile, SensorNode } from '../types';
import { GLOBAL_HUBS } from '../data/mockData';
import { Globe, Crosshair, RefreshCw, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { playKeyClick, playRadarPing } from '../utils/soundEffects';

interface GlobalGlobeViewProps {
  activeTarget: TargetProfile;
  sensorNodes: SensorNode[];
  onSelectCityHub: (cityName: string, coords: [number, number]) => void;
}

export const GlobalGlobeView: React.FC<GlobalGlobeViewProps> = ({
  activeTarget,
  sensorNodes,
  onSelectCityHub,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotXRef = useRef<number>(0.25);
  const rotYRef = useRef<number>(1.2);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  isDraggingRef.current = isDragging;

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1.0);
  const zoomRef = useRef<number>(1.0);
  zoomRef.current = zoom;

  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const autoRotateRef = useRef<boolean>(true);
  autoRotateRef.current = autoRotate;

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ORBITAL' | 'TERRESTRIAL'>('ALL');
  const activeFilterRef = useRef<'ALL' | 'ORBITAL' | 'TERRESTRIAL'>('ALL');
  activeFilterRef.current = activeFilter;

  const activeTargetRef = useRef<TargetProfile>(activeTarget);
  activeTargetRef.current = activeTarget;

  // Animation frame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angleOffset = 0;

    const render = () => {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      const currentZoom = zoomRef.current;
      const radius = (Math.min(width, height) / 2 - 30) * currentZoom;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Auto-rotation increment on ref (does not trigger React re-renders)
      if (autoRotateRef.current && !isDraggingRef.current) {
        rotYRef.current += 0.003;
      }
      angleOffset += 0.02;

      // Draw background tactical rings & space grid
      ctx.save();
      ctx.strokeStyle = 'rgba(14, 116, 144, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 25, 0, Math.PI * 2);
      ctx.stroke();

      // Outer dashed tactical perimeter
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Atmospheric glow gradient
      const globeGlow = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      globeGlow.addColorStop(0, 'rgba(8, 47, 73, 0.3)');
      globeGlow.addColorStop(0.85, 'rgba(6, 30, 50, 0.7)');
      globeGlow.addColorStop(1, 'rgba(6, 182, 212, 0.25)');

      ctx.fillStyle = globeGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Coordinate converter helper: lat/lng -> 3D sphere -> 2D projection
      const project = (lat: number, lng: number, rOffset = 0) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180) + rotYRef.current;

        const currentR = radius + rOffset;
        const x3 = -(currentR * Math.sin(phi) * Math.cos(theta));
        const z3 = currentR * Math.sin(phi) * Math.sin(theta);
        const y3 = currentR * Math.cos(phi);

        // Rotate on X axis
        const cosX = Math.cos(rotXRef.current);
        const sinX = Math.sin(rotXRef.current);
        const yRot = y3 * cosX - z3 * sinX;
        const zRot = y3 * sinX + z3 * cosX;

        return {
          x: centerX + x3,
          y: centerY - yRot,
          z: zRot,
          visible: zRot > 0,
        };
      };

      // Draw latitude and longitude grid lines
      ctx.lineWidth = 1;
      const numLatLines = 8;
      for (let i = 1; i < numLatLines; i++) {
        const lat = -90 + (180 / numLatLines) * i;
        ctx.beginPath();
        let first = true;
        for (let lng = -180; lng <= 180; lng += 10) {
          const p = project(lat, lng);
          if (p.visible) {
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
            if (first) {
              ctx.moveTo(p.x, p.y);
              first = false;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      const numLngLines = 12;
      for (let i = 0; i < numLngLines; i++) {
        const lng = -180 + (360 / numLngLines) * i;
        ctx.beginPath();
        let first = true;
        for (let lat = -85; lat <= 85; lat += 5) {
          const p = project(lat, lng);
          if (p.visible) {
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
            if (first) {
              ctx.moveTo(p.x, p.y);
              first = false;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            first = true;
          }
        }
        ctx.stroke();
      }

      // Draw synthetic continent clusters (density point cloud)
      const mockCoastlineDots: [number, number][] = [
        // North America
        [40, -100], [45, -75], [30, -90], [50, -110], [35, -118], [25, -80], [58, -120],
        // South America
        [-10, -55], [-22, -43], [-34, -58], [4, -72], [-15, -70],
        // Europe
        [51, 0], [48, 2], [52, 13], [41, 12], [60, 24], [55, 37],
        // Asia
        [35, 139], [31, 121], [39, 116], [22, 114], [1, 103], [28, 77], [13, 80],
        // Middle East
        [24, 54], [25, 45], [32, 35],
        // Africa
        [0, 20], [-26, 28], [30, 31], [9, 38], [5, 0],
        // Australia
        [-25, 133], [-33, 151], [-31, 115],
      ];

      mockCoastlineDots.forEach(([lat, lng]) => {
        // Add random scatter cluster around major continental anchor
        for (let dx = -4; dx <= 4; dx += 2.5) {
          for (let dy = -4; dy <= 4; dy += 2.5) {
            const p = project(lat + dx, lng + dy);
            if (p.visible) {
              ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
              ctx.fillRect(p.x, p.y, 1.8, 1.8);
            }
          }
        }
      });

      // Draw Global City Sensor Hubs
      if (activeFilterRef.current === 'ALL' || activeFilterRef.current === 'TERRESTRIAL') {
        GLOBAL_HUBS.forEach((hub) => {
          const p = project(hub.coordinates[0], hub.coordinates[1]);
          if (p.visible) {
            // Node point
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Tactical bracket / ring
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillText(hub.name.split(' ')[0], p.x + 9, p.y - 4);
            ctx.fillStyle = '#38bdf8';
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.fillText(hub.cameras, p.x + 9, p.y + 6);
          }
        });
      }

      // Draw Orbital Satellites (Aegis SAR Satellites orbiting around earth)
      if (activeFilterRef.current === 'ALL' || activeFilterRef.current === 'ORBITAL') {
        const satOrbits = [
          { inclination: 65, radiusOffset: 28, speed: 0.8, color: '#f59e0b', label: 'AEGIS-SAR-01' },
          { inclination: -45, radiusOffset: 38, speed: -0.6, color: '#10b981', label: 'AEGIS-OPT-04' },
          { inclination: 20, radiusOffset: 22, speed: 1.1, color: '#06b6d4', label: 'AEGIS-POLAR-09' },
        ];

        satOrbits.forEach((sat, idx) => {
          const satAngle = angleOffset * sat.speed + idx * 2.1;
          const satLat = Math.sin(satAngle) * sat.inclination;
          const satLng = (satAngle * (180 / Math.PI)) % 360;

          const p = project(satLat, satLng, sat.radiusOffset);

          // Draw satellite icon
          ctx.fillStyle = sat.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();

          // Satellite cross-hairs
          ctx.strokeStyle = sat.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x - 6, p.y);
          ctx.lineTo(p.x + 6, p.y);
          ctx.moveTo(p.x, p.y - 6);
          ctx.lineTo(p.x, p.y + 6);
          ctx.stroke();

          // Beam down to earth if facing camera
          if (p.visible) {
            const groundP = project(satLat, satLng, 0);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(groundP.x, groundP.y);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#cbd5e1';
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.fillText(sat.label, p.x + 8, p.y - 2);
          }
        });
      }

      // Draw ACTIVE TARGET LOCK-ON ON GLOBE!
      const currentTarget = activeTargetRef.current;
      const targetP = project(currentTarget.currentCoordinates[0], currentTarget.currentCoordinates[1]);
      if (targetP.visible) {
        // Concentric pulsing red/amber circles
        const pulseSize = 10 + (Math.sin(angleOffset * 4) + 1) * 6;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(targetP.x, targetP.y, pulseSize, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(targetP.x, targetP.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // High-tech target bracket box
        const bSize = 14;
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.2;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(targetP.x - bSize, targetP.y - bSize + 5);
        ctx.lineTo(targetP.x - bSize, targetP.y - bSize);
        ctx.lineTo(targetP.x - bSize + 5, targetP.y - bSize);
        // Top-right
        ctx.moveTo(targetP.x + bSize - 5, targetP.y - bSize);
        ctx.lineTo(targetP.x + bSize, targetP.y - bSize);
        ctx.lineTo(targetP.x + bSize, targetP.y - bSize + 5);
        // Bottom-left
        ctx.moveTo(targetP.x - bSize, targetP.y + bSize - 5);
        ctx.lineTo(targetP.x - bSize, targetP.y + bSize);
        ctx.lineTo(targetP.x - bSize + 5, targetP.y + bSize);
        // Bottom-right
        ctx.moveTo(targetP.x + bSize - 5, targetP.y + bSize);
        ctx.lineTo(targetP.x + bSize, targetP.y + bSize);
        ctx.lineTo(targetP.x + bSize, targetP.y + bSize - 5);
        ctx.stroke();

        // Target HUD Callout banner
        const tagX = targetP.x + 18;
        const tagY = targetP.y - 14;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(tagX - 4, tagY - 12, 145, 34);
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(tagX - 4, tagY - 12, 145, 34);

        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 9px "Chakra Petch", sans-serif';
        ctx.fillText(`TARGET LOCKED: ${currentTarget.codename}`, tagX, tagY);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText(`CITY: ${currentTarget.currentCity.toUpperCase()}`, tagX, tagY + 11);
        ctx.fillText(`CONFIDENCE: ${currentTarget.biometrics.faceMatchScore}%`, tagX, tagY + 20);

        // Leader line
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(targetP.x + bSize, targetP.y - bSize);
        ctx.lineTo(tagX - 4, tagY - 4);
        ctx.stroke();
      }

      // Compass overlay at top left
      ctx.save();
      const compassX = 35;
      const compassY = 35;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.beginPath();
      ctx.arc(compassX, compassY, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#06b6d4';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('N', compassX - 3, compassY - 8);
      ctx.fillText('S', compassX - 3, compassY + 16);
      ctx.fillText('W', compassX - 16, compassY + 3);
      ctx.fillText('E', compassX + 10, compassY + 3);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Handle drag to rotate
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    rotYRef.current += dx * 0.006;
    rotXRef.current = Math.max(-1.2, Math.min(1.2, rotXRef.current + dy * 0.006));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Center on current target's coordinates
  const handleCenterOnTarget = () => {
    playRadarPing();
    const [lat, lng] = activeTargetRef.current.currentCoordinates;
    // Calculate rotation to face this point
    const targetRotY = -((lng + 180) * (Math.PI / 180));
    const targetRotX = (lat / 90) * 0.4;
    rotYRef.current = targetRotY;
    rotXRef.current = targetRotX;
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-gradient-to-b from-[#070b13] to-[#04060a] border border-cyan-900/40 rounded-lg overflow-hidden flex flex-col">
      {/* Globe Top HUD Info Bar */}
      <div className="px-3 py-2 border-b border-cyan-900/30 bg-slate-900/60 flex items-center justify-between text-xs font-mono-tech z-10">
        <div className="flex items-center gap-2 text-cyan-300">
          <Globe className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span className="font-display-tech font-semibold uppercase tracking-wider text-slate-200">
            ORBITAL GEOSPATIAL RADAR
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
            3D SPHERICAL PROJECTION
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-[10px]">
            <button
              onClick={() => {
                playKeyClick();
                setActiveFilter('ALL');
              }}
              className={`px-2 py-0.5 rounded ${activeFilter === 'ALL' ? 'bg-cyan-900/60 text-cyan-300' : 'text-slate-400'}`}
            >
              ALL
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setActiveFilter('ORBITAL');
              }}
              className={`px-2 py-0.5 rounded ${activeFilter === 'ORBITAL' ? 'bg-cyan-900/60 text-cyan-300' : 'text-slate-400'}`}
            >
              SATELLITES
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setActiveFilter('TERRESTRIAL');
              }}
              className={`px-2 py-0.5 rounded ${activeFilter === 'TERRESTRIAL' ? 'bg-cyan-900/60 text-cyan-300' : 'text-slate-400'}`}
            >
              CITIES
            </button>
          </div>
        </div>
      </div>

      {/* Canvas viewport container */}
      <div className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full block"
        />

        {/* Tactical floating controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleCenterOnTarget}
            className="p-2 rounded bg-slate-900/80 hover:bg-cyan-950 text-cyan-400 border border-cyan-700/50 transition-colors shadow-lg"
            title="Snap to Target Location"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setAutoRotate((prev) => !prev);
            }}
            className={`p-2 rounded border transition-colors shadow-lg ${
              autoRotate ? 'bg-cyan-950 text-cyan-300 border-cyan-600' : 'bg-slate-900/80 text-slate-400 border-slate-700'
            }`}
            title="Toggle Earth Auto-Rotation"
          >
            <RefreshCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setZoom((prev) => Math.min(1.6, prev + 0.15));
            }}
            className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors shadow-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              playKeyClick();
              setZoom((prev) => Math.max(0.65, prev - 0.15));
            }}
            className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors shadow-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Quick City Hub Selector Floating Bar */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1 max-w-[70%] z-10">
          <span className="text-[10px] font-mono-tech text-slate-400 self-center mr-1">
            DEPLOY SECTOR:
          </span>
          {GLOBAL_HUBS.map((hub) => (
            <button
              key={hub.name}
              onClick={() => {
                playKeyClick();
                onSelectCityHub(hub.name, hub.coordinates);
                // Also center rotation on this hub
                const [lat, lng] = hub.coordinates;
                rotYRef.current = -((lng + 180) * (Math.PI / 180));
                rotXRef.current = (lat / 90) * 0.4;
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono-tech border transition-all ${
                activeTarget.currentCity.toLowerCase().includes(hub.name.split(' ')[0].toLowerCase())
                  ? 'bg-red-950/80 border-red-500/60 text-red-300 font-bold'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-700'
              }`}
            >
              {hub.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
