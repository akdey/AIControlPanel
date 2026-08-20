import React from 'react';
import { Users } from 'lucide-react';

export const ObservabilityUsersView: React.FC = () => {
  return (
    <div className="p-6 max-w-[1600px] mx-auto text-zinc-100 min-h-[500px] flex flex-col justify-center items-center">
      <div className="text-center space-y-3 bg-[#18181b] border border-[#27272a] p-12 rounded-xl max-w-md">
        <Users className="w-10 h-10 text-blue-500 mx-auto" />
        <h2 className="text-base font-bold text-white">Observability — Users</h2>
        <p className="text-xs text-zinc-400">
          Clean end-user analytics development canvas. Ready for user behavior tracking.
        </p>
      </div>
    </div>
  );
};
