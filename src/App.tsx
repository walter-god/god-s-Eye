/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  INITIAL_TARGETS, 
  SENSOR_NODES, 
  INITIAL_CAMERA_FEEDS, 
  INITIAL_EVENTS, 
  GLOBAL_HUBS 
} from './data/mockData';
import { 
  TargetProfile, 
  SensorNode, 
  CameraFeed, 
  TelemetryEvent, 
  ForensicReport 
} from './types';
import { Header } from './components/Header';
import { CesiumGlobeView } from './components/CesiumGlobeView';
import { SectorMapView } from './components/SectorMapView';
import { ComputerVisionFeedGrid } from './components/ComputerVisionFeedGrid';
import { TargetDossierPanel } from './components/TargetDossierPanel';
import { TrackingTelemetryStream } from './components/TrackingTelemetryStream';
import { ForensicAnalysisModal } from './components/ForensicAnalysisModal';
import { NeuralSweepOverlay } from './components/NeuralSweepOverlay';
import { WarrantAuditModal } from './components/WarrantAuditModal';
import { setAudioMuted, playKeyClick, playTargetLock, playNeuralSweep } from './utils/soundEffects';
import { 
  Layers, 
  Globe, 
  Radar, 
  Cpu, 
  ShieldCheck, 
  Eye, 
  Wifi, 
  Activity,
  AlertCircle
} from 'lucide-react';

export default function App() {
  // Primary state
  const [targets, setTargets] = useState<TargetProfile[]>(INITIAL_TARGETS);
  const [activeTarget, setActiveTarget] = useState<TargetProfile>(INITIAL_TARGETS[0]);
  const activeTargetRef = useRef<TargetProfile>(activeTarget);
  activeTargetRef.current = activeTarget;
  const [sensorNodes, setSensorNodes] = useState<SensorNode[]>(SENSOR_NODES);
  const [cameraFeeds, setCameraFeeds] = useState<CameraFeed[]>(INITIAL_CAMERA_FEEDS);
  const [events, setEvents] = useState<TelemetryEvent[]>(INITIAL_EVENTS);

  // UI Modes & Settings
  const [mapDisplayMode, setMapDisplayMode] = useState<'HYBRID' | 'CESIUM' | 'SECTOR'>('HYBRID');
  const [isCesiumExpanded, setIsCesiumExpanded] = useState<boolean>(false);
  const [privacyShieldActive, setPrivacyShieldActive] = useState<boolean>(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(false);
  const [isMuted, setIsMutedState] = useState<boolean>(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorNode>(SENSOR_NODES[0]);

  // Modals & Overlays
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isForensicModalOpen, setIsForensicModalOpen] = useState<boolean>(false);
  const [forensicReport, setForensicReport] = useState<ForensicReport | null>(null);
  const [isLoadingForensic, setIsLoadingForensic] = useState<boolean>(false);

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMutedState(nextMuted);
    setAudioMuted(nextMuted);
  };

  // Switch Active Target with Neural Sweep effect
  const handleSelectTarget = (target: TargetProfile) => {
    setActiveTarget(target);
    // Update camera feed target label
    setCameraFeeds((prev) =>
      prev.map((feed) => {
        if (feed.hasTargetLock) {
          return {
            ...feed,
            location: `Sector ${target.currentCity} - Core Grid`,
            detections: feed.detections.map((d) =>
              d.isTarget
                ? { ...d, label: `TARGET: ${target.name.toUpperCase()}`, confidence: target.biometrics.faceMatchScore }
                : d
            ),
          };
        }
        return feed;
      })
    );
  };

  // Add custom target from user
  const handleAddCustomTarget = (newTarget: TargetProfile) => {
    setTargets((prev) => [newTarget, ...prev]);
    setActiveTarget(newTarget);
    triggerNeuralSweep(newTarget);
  };

  // Execute cinematic God's Eye sweep
  const triggerNeuralSweep = (targetToScan: TargetProfile = activeTarget) => {
    setIsScanning(true);
    playNeuralSweep();

    // Log event
    const sweepEvent: TelemetryEvent = {
      id: `evt-sweep-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 23),
      type: 'TARGET_LOCK',
      message: `Global Neural Sweep initiated for subject ${targetToScan.codename}. Cross-referencing 4.8M optical nodes.`,
      sensorId: 'ORBITAL-SAR-POLAR',
      confidence: targetToScan.biometrics.faceMatchScore,
    };
    setEvents((prev) => [sweepEvent, ...prev.slice(0, 35)]);
  };

  // Handle completion of neural sweep
  const handleSweepComplete = useCallback(() => {
    setIsScanning(false);
    playTargetLock();

    const target = activeTargetRef.current;
    const lockEvent: TelemetryEvent = {
      id: `evt-lock-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 23),
      type: 'TARGET_LOCK',
      message: `Positive optical identification: ${target.name} verified at ${target.currentCity} with ${target.biometrics.faceMatchScore}% confidence.`,
      sensorId: target.lastConfirmedNode,
      confidence: target.biometrics.faceMatchScore,
    };
    setEvents((prev) => [lockEvent, ...prev.slice(0, 35)]);
  }, []);

  // Select city hub from globe
  const handleSelectCityHub = (cityName: string, coords: [number, number]) => {
    setActiveTarget((prev) => ({
      ...prev,
      currentCity: cityName.split(' ')[0],
      currentCoordinates: coords,
    }));

    const handoffEvt: TelemetryEvent = {
      id: `evt-city-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 23),
      type: 'SENSOR_HANDOFF',
      message: `Relocated orbital sensor focal cone to ${cityName}. Ingesting local metropolitan sensor arrays.`,
      sensorId: `HUB-${cityName.substring(0, 3).toUpperCase()}`,
      coordinates: coords,
    };
    setEvents((prev) => [handoffEvt, ...prev.slice(0, 35)]);
  };

  // Fetch AI Forensic Analysis from backend (Express / Gemini or synthetic fallback)
  const fetchForensicAnalysis = useCallback(async () => {
    setIsLoadingForensic(true);
    setIsForensicModalOpen(true);

    try {
      const response = await fetch('/api/forensic-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetName: activeTarget.name,
          targetCodename: activeTarget.codename,
          lastKnownCity: activeTarget.currentCity,
          detectedSensors: ['CCTV-TYO-SHIBUYA-402', 'UAV-OVERWATCH-07', 'TRANSIT-BIO-GATE-NYC'],
          confidenceScore: activeTarget.biometrics.faceMatchScore,
          contextNotes: activeTarget.notes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setForensicReport(result.data);
      } else {
        throw new Error('Failed to fetch AI report');
      }
    } catch {
      // Fallback in case of server hitch
      setForensicReport({
        summary: `Target ${activeTarget.name} actively monitored in ${activeTarget.currentCity} sector. Biometric vector match confirmed at ${activeTarget.biometrics.faceMatchScore}%.`,
        threatLevel: activeTarget.priorityLevel === 'CRITICAL' ? 'CRITICAL' : 'ELEVATED',
        biometricSignature: {
          facialVectorConfidence: `${activeTarget.biometrics.faceMatchScore}%`,
          gaitAnalysisMatch: '93.4%',
          irisScanStatus: activeTarget.biometrics.irisVerification,
          thermalVariance: `${activeTarget.biometrics.thermalReadingCelsius}°C`,
        },
        predictedTrajectory: [
          {
            etaMinutes: 5,
            probableLocation: `${activeTarget.currentCity} Rapid Transit Transfer`,
            transitMethod: activeTarget.transitMode,
            probability: '89%',
          },
          {
            etaMinutes: 15,
            probableLocation: `${activeTarget.currentCity} Commercial Skyway Node`,
            transitMethod: 'Vehicle Transfer',
            probability: '74%',
          },
        ],
        tacticalRecommendations: [
          'Maintain multi-spectrum aerial overwatch via drone pod.',
          'Verify authorized judicial seal on outbound perimeter checkpoints.',
          'Activate non-target civilian redaction masks across adjacent cameras.',
        ],
        lawfulComplianceNote: `Authorized under Warrant ${activeTarget.warrantNumber}. Chain-of-custody sealed with SHA-384.`,
      });
    } finally {
      setIsLoadingForensic(false);
    }
  }, [activeTarget]);

  // Simulated live event telemetry generator (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTarget = activeTargetRef.current;
      const randomType = Math.random();
      let newEvt: TelemetryEvent;

      const nowStr = new Date().toISOString().substring(11, 23);

      if (randomType < 0.35) {
        const speedVariance = Math.floor(Math.random() * 8 - 4);
        newEvt = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          type: 'TRAJECTORY_UPDATE',
          message: `Position updated: Velocity ${Math.max(4, currentTarget.movementSpeedKmh + speedVariance)} km/h heading ${(currentTarget.headingDegrees + Math.floor(Math.random() * 10 - 5)) % 360}°.`,
          sensorId: currentTarget.lastConfirmedNode,
        };
      } else if (randomType < 0.65) {
        newEvt = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          type: 'BIOMETRIC_MATCH',
          message: `Facial tensor verification confirmed: ${currentTarget.codename} vector match ${(currentTarget.biometrics.faceMatchScore - Math.random() * 0.4).toFixed(1)}%.`,
          sensorId: 'CCTV-402-CORE',
          confidence: currentTarget.biometrics.faceMatchScore,
        };
      } else if (randomType < 0.85) {
        newEvt = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          type: 'SENSOR_HANDOFF',
          message: `Optical stream handoff: Camera Node [TYO-402] -> Aerial Drone [UAV-07-THERMAL].`,
          sensorId: 'UAV-OVERWATCH-07',
        };
      } else {
        newEvt = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          type: 'PRIVACY_SHIELD',
          message: `Automated Privacy Shield active: 18 non-target faces cryptographically obfuscated.`,
          sensorId: 'CORE-PRIVACY-ENGINE',
        };
      }

      setEvents((prev) => [newEvt, ...prev.slice(0, 40)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen w-full bg-[#05070d] text-slate-200 flex flex-col relative ${scanlinesEnabled ? 'scanlines' : ''}`}>
      {/* Top Lawful & Command Header */}
      <Header
        privacyShieldActive={privacyShieldActive}
        onTogglePrivacyShield={() => setPrivacyShieldActive((prev) => !prev)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        scanlinesEnabled={scanlinesEnabled}
        onToggleScanlines={() => setScanlinesEnabled((prev) => !prev)}
        onOpenAuditLog={() => setIsAuditModalOpen(true)}
        onTriggerGlobalSweep={() => triggerNeuralSweep()}
        isScanning={isScanning}
        activeTargetName={activeTarget.name}
      />

      {/* Main Command Center Layout */}
      <main className="flex-1 p-2 sm:p-3 flex flex-col gap-3 max-w-[1700px] w-full mx-auto">
        {/* Upper Operations Deck: Geospatial Surveillance & Tactical Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left / Center Map Display Arena (8 cols on lg) */}
          <div className="lg:col-span-8 flex flex-col gap-2">
            {/* View Switcher Sub-header */}
            <div className="flex items-center justify-between px-1 text-xs font-mono-tech">
              <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-800">
                <button
                  onClick={() => {
                    playKeyClick();
                    setMapDisplayMode('HYBRID');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                    mapDisplayMode === 'HYBRID' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>DUAL TACTICAL VIEW</span>
                </button>

                <button
                  onClick={() => {
                    playKeyClick();
                    setMapDisplayMode('CESIUM');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                    mapDisplayMode === 'CESIUM' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3D CESIUM GEOSPATIAL</span>
                </button>

                <button
                  onClick={() => {
                    playKeyClick();
                    setMapDisplayMode('SECTOR');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                    mapDisplayMode === 'SECTOR' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radar className="w-3.5 h-3.5" />
                  <span>2D SECTOR STREET GRID</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
                <span>
                  TARGET SECTOR: <strong className="text-cyan-300">{activeTarget.currentCity.toUpperCase()}</strong>
                </span>
                <span>
                  SPEED: <strong className="text-amber-300">{activeTarget.movementSpeedKmh} KM/H</strong>
                </span>
              </div>
            </div>

            {/* Map Area */}
            {mapDisplayMode === 'HYBRID' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[440px]">
                <CesiumGlobeView
                  activeTarget={activeTarget}
                  sensorNodes={sensorNodes}
                  onSelectCityHub={handleSelectCityHub}
                  isExpanded={isCesiumExpanded}
                  onToggleExpand={() => setIsCesiumExpanded((prev) => !prev)}
                />
                <SectorMapView
                  activeTarget={activeTarget}
                  sensorNodes={sensorNodes}
                  onSelectSensor={(sensor) => setSelectedSensor(sensor)}
                  selectedSensorId={selectedSensor.id}
                />
              </div>
            ) : mapDisplayMode === 'CESIUM' ? (
              <div className="h-[480px]">
                <CesiumGlobeView
                  activeTarget={activeTarget}
                  sensorNodes={sensorNodes}
                  onSelectCityHub={handleSelectCityHub}
                  isExpanded={isCesiumExpanded}
                  onToggleExpand={() => setIsCesiumExpanded((prev) => !prev)}
                />
              </div>
            ) : (
              <div className="h-[460px]">
                <SectorMapView
                  activeTarget={activeTarget}
                  sensorNodes={sensorNodes}
                  onSelectSensor={(sensor) => setSelectedSensor(sensor)}
                  selectedSensorId={selectedSensor.id}
                />
              </div>
            )}
          </div>

          {/* Right Column: Biometric Target Dossier Panel (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col">
            <TargetDossierPanel
              targets={targets}
              activeTarget={activeTarget}
              onSelectTarget={handleSelectTarget}
              onAddCustomTarget={handleAddCustomTarget}
              onOpenForensicReport={fetchForensicAnalysis}
              isLoadingAiReport={isLoadingForensic}
            />
          </div>
        </div>

        {/* Lower Operations Deck: Computer Vision Optical Triage Grid & Continuous Telemetry Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Multi-Camera Feeds (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col">
            <ComputerVisionFeedGrid
              feeds={cameraFeeds}
              activeTarget={activeTarget}
              privacyShieldActive={privacyShieldActive}
            />
          </div>

          {/* Live Continuous Telemetry Stream & Sensor Hops (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col">
            <TrackingTelemetryStream
              events={events}
              activeTarget={activeTarget}
            />
          </div>
        </div>
      </main>

      {/* Cinematic God's Eye Neural Sweep Overlay */}
      {isScanning && (
        <NeuralSweepOverlay
          target={activeTarget}
          onComplete={handleSweepComplete}
        />
      )}

      {/* AI Forensic Situation & Trajectory Report Modal */}
      <ForensicAnalysisModal
        report={forensicReport}
        target={activeTarget}
        isOpen={isForensicModalOpen}
        onClose={() => setIsForensicModalOpen(false)}
        isLoading={isLoadingForensic}
        onRefresh={fetchForensicAnalysis}
      />

      {/* Lawful Judicial Warrant & Privacy Audit Ledger Modal */}
      <WarrantAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
