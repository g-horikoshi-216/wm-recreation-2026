'use client';

import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';

interface PodiumDisplayProps {
  first: string;
  second: string;
  third: string;
  isResult?: boolean;
}

export function PodiumDisplay({ first, second, third, isResult = false }: PodiumDisplayProps) {
  return (
    <div
      className={`flex items-end justify-center gap-4 p-4 rounded-lg ${
        isResult ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200' : ''
      }`}
    >
      <div className="flex flex-col items-center">
        <LooksTwoIcon style={{ fontSize: 32 }} className="text-gray-400 mb-1" />
        <span className="font-semibold text-gray-800">{second}</span>
        <div className="w-16 h-12 bg-gray-300 rounded-t-lg mt-2" />
      </div>
      <div className="flex flex-col items-center">
        <LooksOneIcon style={{ fontSize: 40 }} className="text-yellow-500 mb-1" />
        <span className="font-bold text-gray-900">{first}</span>
        <div className="w-16 h-16 bg-yellow-400 rounded-t-lg mt-2" />
      </div>
      <div className="flex flex-col items-center">
        <Looks3Icon style={{ fontSize: 32 }} className="text-orange-400 mb-1" />
        <span className="font-semibold text-gray-700">{third}</span>
        <div className="w-16 h-8 bg-orange-300 rounded-t-lg mt-2" />
      </div>
    </div>
  );
}
