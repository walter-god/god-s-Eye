import React, { useEffect, useState, useRef } from 'react';
import { TargetProfile } from '../types';
import { Radio, Scan, CheckCircle2, ShieldAlert } from 'lucide-react';
import { playTargetLock } from '../utils/soundEffects';

interface NeuralSweepOverlayProps {
  target: TargetProfile;
  onComplete: () => void;
}

export const NeuralSweepOverlay: React.FC<NeuralSweepOverlayProps> = ({
  target,
  onComplete,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stage = progress > 75 ? 4 : progress > 50 ? 3 : progress > 25 ? 2 : 1;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          playTargetLock();
          setTimeout(() => {
            onCompleteRef.current();
          }, 500);
          return 100;
        }

        return prev + 4;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const getStageText = () => {
    switch (stage) {
      case 1:
        return 'CONNECTING TO 4,892,110 DISTRIBUTED CAMERA NODES...';
      case 2:
        return `EXTRACTING 1024-D BIOMETRIC VECTOR FOR [${target.codename}]...`;
      case 3:
        return 'CROSS-REFERENCING ORBITAL SAR SATELLITES & HIGH-SPEED TRANSIT GATES...';
      case 4:
        return `TARGET ACQUIRED: ${target.name.toUpperCase()} (CONFIDENCE: ${target.biometrics.faceMatchScore}%)`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono-tech select-none">
      <div className="relative w-full max-w-lg bg-[#080d18] border-2 border-cyan-500 rounded-xl p-6 flex flex-col items-center gap-5 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
        {/* Animated Radar Pulse Core */}
        <div className="relative w-28 h-28 rounded-full border-2 border-cyan-500 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping-slow"></div>
          <div className="absolute inset-2 rounded-full border border-dashed border-cyan-300 animate-spin-slow"></div>
          <Scan className="w-12 h-12 text-cyan-400 animate-pulse" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        </div>

        {/* Status Text */}
        <div className="text-center">
          <h2 className="text-lg font-display-tech font-bold text-slate-100 tracking-widest uppercase">
            GOD'S EYE // GLOBAL NEURAL SWEEP
          </h2>
          <p className="text-cyan-400 text-xs mt-1 h-5 flex items-center justify-center font-semibold">
            {getStageText()}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-cyan-900">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-75"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>STAGE 0{stage} / 04</span>
            <span className="text-cyan-300 font-bold">{progress}% PROCESSED</span>
          </div>
        </div>

        {/* Lawful Judicial Disclaimer */}
        <div className="text-[10px] text-slate-500 text-center border-t border-slate-800 pt-3 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Judicially sanctioned search protocol active. Non-target data filtered per privacy statute.</span>
        </div>
      </div>
    </div>
  );
};
