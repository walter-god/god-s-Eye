import React, { useState } from 'react';
import { TargetProfile } from '../types';
import { 
  User, 
  Fingerprint, 
  Eye, 
  Activity, 
  Thermometer, 
  ShieldAlert, 
  Plus, 
  Sparkles, 
  FileText, 
  ChevronRight,
  Crosshair,
  Hash,
  CheckCircle2
} from 'lucide-react';
import { playKeyClick, playTargetLock } from '../utils/soundEffects';

interface TargetDossierPanelProps {
  targets: TargetProfile[];
  activeTarget: TargetProfile;
  onSelectTarget: (target: TargetProfile) => void;
  onAddCustomTarget: (target: TargetProfile) => void;
  onOpenForensicReport: () => void;
  isLoadingAiReport: boolean;
}

export const TargetDossierPanel: React.FC<TargetDossierPanelProps> = ({
  targets,
  activeTarget,
  onSelectTarget,
  onAddCustomTarget,
  onOpenForensicReport,
  isLoadingAiReport,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newCodename, setNewCodename] = useState<string>('');
  const [newCity, setNewCity] = useState<string>('Tokyo');
  const [newCategory, setNewCategory] = useState<TargetProfile['category']>('FUGITIVE_PURSUIT');
  const [newWarrant, setNewWarrant] = useState<string>('W-FED-2026-9921-A');
  const [newNotes, setNewNotes] = useState<string>('Authorized priority target for lawful inter-agency apprehension.');

  const handleCreateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    playTargetLock();

    const created: TargetProfile = {
      id: `target-custom-${Date.now()}`,
      name: newName.trim(),
      codename: newCodename.trim().toUpperCase() || 'ECHO-SUBJECT',
      category: newCategory,
      priorityLevel: 'CRITICAL',
      status: 'TRACKING_ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      facialMeshVectors: 1024,
      currentCity: newCity,
      currentCoordinates: newCity === 'Tokyo' ? [35.6595, 139.7005] : [40.7128, -74.0060],
      lastConfirmedNode: `Node-${newCity.substring(0, 3).toUpperCase()}-Grid01`,
      movementSpeedKmh: 36,
      headingDegrees: 180,
      transitMode: 'FOOT',
      biometrics: {
        faceMatchScore: 97.6,
        irisVerification: 'VERIFIED',
        facialVectorHash: 'c7be1a85e5e6c703b44b82d449dece9cfcf5b2ff0895318d9cb6332155f891b2',
        gaitCadenceBpm: 112,
        thermalReadingCelsius: 36.7,
        voiceHarmonicsMatch: 95.8,
      },
      warrantNumber: newWarrant.trim() || 'W-FED-2026-AUTO',
      authorizingAgency: 'Federal Task Force / Court-Ordered Mandate',
      notes: newNotes.trim(),
    };

    onAddCustomTarget(created);
    setShowAddModal(false);
    setNewName('');
    setNewCodename('');
  };

  return (
    <div className="w-full bg-[#070b14] border border-cyan-900/40 rounded-lg overflow-hidden flex flex-col font-mono-tech select-none">
      {/* Dossier Header */}
      <div className="px-3 py-2 border-b border-cyan-900/40 bg-slate-900/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-cyan-400" />
          <span className="font-display-tech font-bold text-slate-100 uppercase tracking-wider">
            BIOMETRIC TARGET DOSSIER
          </span>
        </div>

        <button
          onClick={() => {
            playKeyClick();
            setShowAddModal(true);
          }}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 text-[11px] transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>NEW DIRECTIVE</span>
        </button>
      </div>

      {/* Target Selection Pills */}
      <div className="p-2 border-b border-slate-800 bg-slate-950/60 flex flex-wrap gap-1.5">
        {targets.map((t) => {
          const isSelected = t.id === activeTarget.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                playTargetLock();
                onSelectTarget(t);
              }}
              className={`px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-red-950/80 border-red-500 text-red-200 font-bold shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-800'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`}></div>
              <span>{t.codename}</span>
            </button>
          );
        })}
      </div>

      {/* Active Target Profile Card */}
      <div className="p-3 flex flex-col gap-3">
        <div className="flex gap-3">
          {/* Target Avatar with God's Eye Brackets */}
          <div className="relative w-20 h-24 rounded-md overflow-hidden shrink-0 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <img
              src={activeTarget.avatarUrl}
              alt={activeTarget.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Corner brackets */}
            <div className="absolute inset-0 border border-red-500/80 pointer-events-none">
              <span className="absolute bottom-0 inset-x-0 bg-red-950/90 text-red-200 text-[8px] text-center font-bold py-0.5">
                {activeTarget.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-400/90 font-bold uppercase tracking-wider">
                {activeTarget.category.replace('_', ' ')}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-700/60 font-bold">
                {activeTarget.priorityLevel}
              </span>
            </div>

            <h2 className="text-base font-display-tech font-bold text-slate-100 truncate mt-0.5">
              {activeTarget.name}
            </h2>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>CODENAME:</span>
              <strong className="text-cyan-300 font-semibold">{activeTarget.codename}</strong>
            </div>

            <div className="text-[11px] text-slate-400 mt-1">
              <span>SECTOR:</span>{' '}
              <strong className="text-slate-200">{activeTarget.currentCity}</strong>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              NODE: <span className="text-cyan-400">{activeTarget.lastConfirmedNode}</span>
            </div>
          </div>
        </div>

        {/* Biometrics Matrix */}
        <div className="bg-slate-950/70 rounded border border-slate-800 p-2.5 flex flex-col gap-2">
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>BIOMETRIC MATCH CONFIDENCE</span>
            <span className="text-emerald-300 font-bold text-xs">{activeTarget.biometrics.faceMatchScore}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
              style={{ width: `${activeTarget.biometrics.faceMatchScore}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] mt-1">
            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80">
              <div className="text-slate-500 flex items-center gap-1">
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>IRIS VERIFICATION</span>
              </div>
              <div className="text-emerald-400 font-semibold mt-0.5">
                {activeTarget.biometrics.irisVerification}
              </div>
            </div>

            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80">
              <div className="text-slate-500 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-amber-400" />
                <span>THERMAL SIGNATURE</span>
              </div>
              <div className="text-amber-300 font-semibold mt-0.5">
                {activeTarget.biometrics.thermalReadingCelsius}°C (NOMINAL)
              </div>
            </div>

            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80">
              <div className="text-slate-500 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>GAIT CADENCE</span>
              </div>
              <div className="text-slate-200 font-semibold mt-0.5">
                {activeTarget.biometrics.gaitCadenceBpm} BPM
              </div>
            </div>

            <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800/80">
              <div className="text-slate-500 flex items-center gap-1">
                <Hash className="w-3 h-3 text-cyan-400" />
                <span>VOICE HARMONICS</span>
              </div>
              <div className="text-slate-200 font-semibold mt-0.5">
                {activeTarget.biometrics.voiceHarmonicsMatch}% MATCH
              </div>
            </div>
          </div>

          {/* Cryptographic Biometric Hash */}
          <div className="text-[9px] text-slate-500 mt-1 truncate">
            VECTOR HASH: <span className="text-slate-400 font-mono-tech">{activeTarget.biometrics.facialVectorHash.substring(0, 24)}...</span>
          </div>
        </div>

        {/* Legal Authorization Details */}
        <div className="bg-slate-900/50 rounded border border-emerald-900/30 p-2 text-[10px] text-slate-400">
          <div className="flex items-center justify-between text-emerald-300 font-semibold mb-1">
            <span>JUDICIAL WARRANT: {activeTarget.warrantNumber}</span>
            <span className="text-[9px] text-emerald-400">AUTHORIZED</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{activeTarget.notes}</p>
        </div>

        {/* Run AI Forensic Situation Analysis Button */}
        <button
          onClick={() => {
            playKeyClick();
            onOpenForensicReport();
          }}
          disabled={isLoadingAiReport}
          className="w-full py-2 px-3 rounded bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 hover:from-cyan-900 hover:to-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-display-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isLoadingAiReport ? 'animate-spin' : 'text-cyan-400'}`} />
          <span>{isLoadingAiReport ? 'COMPUTING FORENSIC TRAJECTORY...' : 'GENERATE AI FORENSIC DOSSIER'}</span>
        </button>
      </div>

      {/* New Authorized Directive Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTarget}
            className="w-full max-w-md bg-[#090e18] border border-cyan-600 rounded-xl p-5 flex flex-col gap-3 font-mono-tech shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-display-tech font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>NEW AUTHORIZED TARGET DIRECTIVE</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Subject Full Name:</label>
              <input
                type="text"
                required
                placeholder="e.g. Han Lue"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Tactical Codename:</label>
              <input
                type="text"
                placeholder="e.g. DRIFT-MASTER"
                value={newCodename}
                onChange={(e) => setNewCodename(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Primary Sector:</label>
                <select
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                >
                  <option value="Tokyo">Tokyo</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="London">London</option>
                  <option value="New York">New York</option>
                  <option value="Berlin">Berlin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Directive Category:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TargetProfile['category'])}
                  className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none"
                >
                  <option value="FUGITIVE_PURSUIT">Fugitive Pursuit</option>
                  <option value="SEARCH_AND_RESCUE">Search & Rescue</option>
                  <option value="PROTECTED_WITNESS">Protected Witness</option>
                  <option value="COUNTER_SURVEILLANCE">Counter Surveillance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Court Warrant Number:</label>
              <input
                type="text"
                value={newWarrant}
                onChange={(e) => setNewWarrant(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Authorized Purpose / Case Notes:</label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Issue Directive & Track
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
