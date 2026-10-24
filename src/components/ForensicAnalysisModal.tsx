import React from 'react';
import { ForensicReport, TargetProfile } from '../types';
import { 
  Sparkles, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  Activity, 
  FileText, 
  CheckCircle2, 
  Lock,
  Route
} from 'lucide-react';
import { playKeyClick } from '../utils/soundEffects';

interface ForensicAnalysisModalProps {
  report: ForensicReport | null;
  target: TargetProfile;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ForensicAnalysisModal: React.FC<ForensicAnalysisModalProps> = ({
  report,
  target,
  isOpen,
  onClose,
  isLoading,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono-tech select-none">
      <div className="relative w-full max-w-2xl bg-[#090d16] border border-cyan-500/60 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Topbar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-cyan-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-display-tech font-bold text-slate-100 text-sm">
              AI FORENSIC SITUATION & TRAJECTORY DOSSIER
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-[10px]">
              AEGIS AI REASONING KERNEL
            </span>
          </div>

          <button
            onClick={() => {
              playKeyClick();
              onClose();
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 text-xs">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-cyan-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-display-tech font-bold text-sm tracking-widest uppercase">
                ANALYZING 1024-D EMBEDDINGS & PREDICTIVE ROUTE NODES...
              </p>
              <p className="text-slate-500 text-xs">Cross-referencing transit schedules, ALPR checkpoints & historical telemetry</p>
            </div>
          ) : report ? (
            <>
              {/* Target & Threat Level Bar */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400">SUBJECT UNDER ANALYSIS:</span>
                  <h3 className="text-base font-display-tech font-bold text-slate-100">
                    {target.name} ({target.codename})
                  </h3>
                  <p className="text-slate-400 text-[11px]">
                    Current Sector: <strong className="text-cyan-300">{target.currentCity}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">TACTICAL THREAT LEVEL</span>
                  <span className="inline-block px-2.5 py-1 rounded bg-red-950 text-red-300 border border-red-600 font-display-tech font-bold text-sm">
                    {report.threatLevel}
                  </span>
                </div>
              </div>

              {/* Tactical Summary */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-cyan-900/40">
                <div className="text-[10px] text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CENTRAL FORENSIC SUMMARY</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{report.summary}</p>
              </div>

              {/* Biometric Vector Breakdown */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>BIOMETRIC VECTOR SIGNATURE</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">FACIAL MATCH</span>
                    <span className="text-emerald-400 font-bold">{report.biometricSignature.facialVectorConfidence}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">GAIT ANALYSIS</span>
                    <span className="text-slate-200 font-bold">{report.biometricSignature.gaitAnalysisMatch}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">IRIS STATUS</span>
                    <span className="text-cyan-300 font-bold">{report.biometricSignature.irisScanStatus}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">THERMAL VARIANCE</span>
                    <span className="text-amber-300 font-bold">{report.biometricSignature.thermalVariance}</span>
                  </div>
                </div>
              </div>

              {/* AI Predicted Trajectory */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PREDICTIVE TRAJECTORY ROUTE HEATMAP</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400">
                        <th className="pb-1.5 font-semibold">EST. ARRIVAL</th>
                        <th className="pb-1.5 font-semibold">PROBABLE LOCATION</th>
                        <th className="pb-1.5 font-semibold">TRANSIT METHOD</th>
                        <th className="pb-1.5 font-semibold text-right">CONFIDENCE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-[11px]">
                      {report.predictedTrajectory.map((pt, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="py-2 text-amber-300 font-semibold">+{pt.etaMinutes} MIN</td>
                          <td className="py-2 text-slate-200">{pt.probableLocation}</td>
                          <td className="py-2 text-slate-400">{pt.transitMethod}</td>
                          <td className="py-2 text-right text-emerald-400 font-bold">{pt.probability}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tactical Recommendations */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LAWFUL INTERCEPT PROTOCOL RECOMMENDATIONS</span>
                </div>
                <ul className="list-disc list-inside flex flex-col gap-1 text-slate-300 text-[11px] leading-relaxed">
                  {report.tacticalRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Legal & Privacy Compliance Footnote */}
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/40 flex items-start gap-2 text-[10px] text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">LEGAL OVERSIGHT & FOURTH AMENDMENT SAFEGUARD:</span>
                  <p className="text-slate-300 mt-0.5">{report.lawfulComplianceNote}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              playKeyClick();
              onRefresh();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>RE-EVALUATE NEURAL PREDICTION</span>
          </button>

          <button
            onClick={() => {
              playKeyClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
