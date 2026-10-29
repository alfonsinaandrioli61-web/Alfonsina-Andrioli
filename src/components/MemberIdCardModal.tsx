import React from 'react';
import { X, Printer, ShieldCheck, QrCode } from 'lucide-react';
import { Member } from '../types';
import { useAccessControl } from '../context/AccessControlContext';
import { formatDate } from '../utils/date';

interface MemberIdCardModalProps {
  member: Member;
  onClose: () => void;
}

export const MemberIdCardModal: React.FC<MemberIdCardModalProps> = ({ member, onClose }) => {
  const { settings } = useAccessControl();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Credencial Digital de Acceso</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg border border-slate-700 relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute right-10 top-4 text-xs font-mono tracking-widest text-emerald-400 font-bold">
              PASE OFICIAL
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-black border border-slate-700 overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                <img
                  src={settings.logoUrl || '/assets/aistudio/image_fec4e5d4.png'}
                  alt={settings.facilityName}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-sm font-extrabold tracking-tight block text-white">
                  {settings.facilityName}
                </span>
                <span className="text-[10px] text-amber-400 font-bold block uppercase tracking-wider">
                  Membresía Oficial Activa
                </span>
              </div>
            </div>

            {/* Body: Photo & Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-700 border-2 border-emerald-400 shrink-0">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white font-bold text-xl">
                    {member.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-white truncate leading-tight">
                  {member.fullName}
                </h4>
                <div className="mt-1 font-mono text-xs text-emerald-300 font-bold">
                  DNI: {member.dni}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  {member.plan}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Vence: {formatDate(member.feeDueDate)}
                </div>
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="mt-6 pt-4 border-t border-slate-700/80 flex flex-col items-center">
              <div className="h-9 w-full flex items-center justify-center gap-0.5 bg-white p-1 rounded">
                {Array.from({ length: 38 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-950 h-full"
                    style={{
                      width: (i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1) + 'px',
                      opacity: (i * 7) % 5 === 0 ? 0.3 : 1,
                    }}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] tracking-widest text-slate-400 mt-1">
                *{member.dni}*
              </span>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Carnet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
