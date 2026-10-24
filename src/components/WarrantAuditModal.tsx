import React from 'react';
import { ShieldCheck, X, FileText, Lock, Key, Scale, CheckCircle } from 'lucide-react';
import { playKeyClick } from '../utils/soundEffects';

interface WarrantAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WarrantAuditModal: React.FC<WarrantAuditModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const auditRecords = [
    {
      warrantId: 'W-FED-2026-0884-A',
      judge: 'Hon. Justice C. Vance (FISA/Federal Special Court)',
      subject: 'Dominic T. Cross',
      justification: 'High-speed vehicular pursuit of fugitive under international red notice directive.',
      biometricHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      timeIssued: '2026-09-14 22:15:00 UTC',
      status: 'VERIFIED & ACTIVE',
    },
    {
      warrantId: 'W-JUD-2026-9021-S',
      judge: 'Chief Magistrate M. Takahashi (Tokyo District)',
      subject: 'Elena Ramos',
      justification: 'Court-ordered protective corridor monitoring for key judicial witness.',
      biometricHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      timeIssued: '2026-09-15 01:04:18 UTC',
      status: 'VERIFIED & ACTIVE',
    },
    {
      warrantId: 'W-MOD-2026-4412-X',
      judge: 'Lord Justice Sterling (High Court of Justice, UK)',
      subject: 'Deckard Shaw',
      justification: 'Special operational apprehension of military-grade rogue agent.',
      biometricHash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      timeIssued: '2026-09-15 02:40:11 UTC',
      status: 'VERIFIED & ACTIVE',
    },
    {
      warrantId: 'W-FED-2026-0001-A',
      judge: 'Hon. Justice M. Rivera (DC Circuit Special Bench)',
      subject: 'Megan Ramsay',
      justification: 'Emergency search and rescue directive for creator of sovereign defense software.',
      biometricHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      timeIssued: '2026-09-15 03:00:00 UTC',
      status: 'VERIFIED & ACTIVE',
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono-tech select-none">
      <div className="relative w-full max-w-3xl bg-[#080d16] border border-emerald-500/50 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Topbar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-emerald-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <Scale className="w-4 h-4" />
            <span className="font-display-tech font-bold text-slate-100 text-sm">
              IMMUTABLE JUDICIAL WARRANT & PRIVACY LEDGER
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

        {/* Content */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* Statutory Mandate Banner */}
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-700/50 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>STATUTORY COMPLIANCE & LAWFUL RESTRICTION PROTOCOL</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Project Aegis Oculus operates strictly as an authorized, judicial warrant-bound intelligence asset. 
              Mass unrestricted surveillance is prohibited by constitutional protocol. All queries require cryptographically signed warrants issued by a competent judicial magistrate. Non-target civilian visual buffers are protected under the automated Privacy Redaction Shield.
            </p>
          </div>

          {/* Records Table */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>ACTIVE COURT-ORDERED DIRECTIVE LOG</span>
            </h4>

            <div className="flex flex-col gap-2">
              {auditRecords.map((rec) => (
                <div
                  key={rec.warrantId}
                  className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold text-[11px]">
                      {rec.warrantId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      {rec.status}
                    </span>
                  </div>

                  <div className="text-slate-200 font-semibold">
                    Target: <span className="text-cyan-300">{rec.subject}</span>
                  </div>

                  <div className="text-slate-400 text-[11px]">
                    Presiding Authority: <span className="text-slate-300">{rec.judge}</span>
                  </div>

                  <p className="text-slate-300 text-[10px] bg-slate-900/60 p-2 rounded border border-slate-850">
                    <strong>Scope & Justification:</strong> {rec.justification}
                  </p>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
                    <span className="truncate max-w-[70%]">
                      CRYPTO SEAL: {rec.biometricHash}
                    </span>
                    <span>{rec.timeIssued}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              playKeyClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
