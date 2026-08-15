import React from 'react';
import { Layers } from 'lucide-react';

export const ObservabilityTracesView: React.FC = () => {
  return (
    <div className="p-6 max-w-[1600px] mx-auto text-zinc-100 min-h-[500px] flex flex-col justify-center items-center">
      <div className="text-center space-y-3 bg-[#18181b] border border-[#27272a] p-12 rounded-xl max-w-md">
        <Layers className="w-10 h-10 text-blue-500 mx-auto" />
        <h2 className="text-base font-bold text-white">Observability — Traces</h2>
        <p className="text-xs text-zinc-400">
          Clean trace span waterfall development canvas. Ready for custom telemetry module integration.
        </p>
      </div>
    </div>
  );
};
