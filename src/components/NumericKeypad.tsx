import React from 'react';
import { Delete, CornerDownLeft, X } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface NumericKeypadProps {
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
  soundEnabled?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onKeyPress,
  onBackspace,
  onClear,
  onSubmit,
  soundEnabled = true,
}) => {
  const handleKey = (digit: string) => {
    if (soundEnabled) soundManager.playKeypadClick();
    onKeyPress(digit);
  };

  const handleBackspace = () => {
    if (soundEnabled) soundManager.playKeypadClick();
    onBackspace();
  };

  const handleClear = () => {
    if (soundEnabled) soundManager.playKeypadClick();
    onClear();
  };

  const handleSubmit = () => {
    onSubmit();
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200 shadow-xs max-w-xs mx-auto">
      {keys.map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => handleKey(num)}
          className="h-12 text-lg font-semibold text-slate-800 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 active:bg-slate-200 transition-all shadow-2xs font-mono tabular-nums flex items-center justify-center cursor-pointer select-none"
        >
          {num}
        </button>
      ))}

      <button
        type="button"
        onClick={handleClear}
        className="h-12 text-xs font-medium text-slate-600 bg-slate-200/80 rounded-lg hover:bg-slate-300 active:bg-slate-400 transition-all flex flex-col items-center justify-center cursor-pointer select-none"
        title="Limpiar"
      >
        <X className="w-4 h-4 text-slate-600 mb-0.5" />
        <span>BORRAR</span>
      </button>

      <button
        type="button"
        onClick={() => handleKey('0')}
        className="h-12 text-lg font-semibold text-slate-800 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 active:bg-slate-200 transition-all shadow-2xs font-mono tabular-nums flex items-center justify-center cursor-pointer select-none"
      >
        0
      </button>

      <button
        type="button"
        onClick={handleBackspace}
        className="h-12 text-slate-600 bg-slate-200/80 rounded-lg hover:bg-slate-300 active:bg-slate-400 transition-all flex items-center justify-center cursor-pointer select-none"
        title="Retroceso"
      >
        <Delete className="w-5 h-5 text-slate-700" />
      </button>

      <button
        type="button"
        onClick={handleSubmit}
        className="col-span-3 h-12 mt-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer select-none"
      >
        <CornerDownLeft className="w-4 h-4" />
        <span>INGRESAR / REGISTRAR</span>
      </button>
    </div>
  );
};
