import { Shield, ScanLine, Scale, ListChecks, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

const agentPillars = [
  { icon: Shield, label: 'Security' },
  { icon: Scale, label: 'Governance' },
  { icon: ListChecks, label: 'Evaluation' },
  { icon: Activity, label: 'Observability' },
];

export function PageLoader() {
  const [dots, setDots] = useState('');
  const [pillarIndex, setPillarIndex] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    const pillarInterval = setInterval(() => {
      setPillarIndex((prev) => (prev + 1) % agentPillars.length);
    }, 2000); // cycle every 2 seconds

    return () => {
      clearInterval(dotsInterval);
      clearInterval(pillarInterval);
    };
  }, []);

  const ActiveIcon = agentPillars[pillarIndex].icon;
  const activeLabel = agentPillars[pillarIndex].label;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[50vh] space-y-8">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing rings */}
        <div className="absolute w-24 h-24 border border-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute w-32 h-32 border border-blue-400/10 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        
        {/* Core Icon Container */}
        <div className="relative bg-slate-900 p-4 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-500/40 overflow-hidden">
          {/* Animated Icon */}
          <div key={activeLabel} className="animate-fade-in-up">
            <ActiveIcon className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
          </div>
          
          {/* Scanning line effect overlay */}
          <div className="absolute inset-0 rounded-full pointer-events-none">
            <div 
              className="w-full h-[2px] bg-blue-300/80 shadow-[0_0_8px_#60a5fa]" 
              style={{ animation: 'scan 2.5s ease-in-out infinite' }} 
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-2 h-16">
        <h3 className="text-blue-500 font-mono text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
          <ScanLine className="w-4 h-4 animate-spin-slow" />
          Verifying {activeLabel}{dots}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono opacity-80">
          Initializing {import.meta.env.VITE_APP_TITLE || 'Control Panel'}
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-10px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 2s ease-in-out forwards;
        }
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
