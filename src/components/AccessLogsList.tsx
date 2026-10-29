import React, { useState } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Search,
  Download,
  Trash2,
  Filter,
  CheckCircle,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useAccessControl } from '../context/AccessControlContext';
import { formatExactTimestamp, formatTimeOnly } from '../utils/date';
import { exportAccessLogsToCSV } from '../utils/csv';

export const AccessLogsList: React.FC = () => {
  const { accessLogs, settings, clearLogs } = useAccessControl();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'salida'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('today');
  const [feeFilter, setFeeFilter] = useState<'all' | 'al_dia' | 'atrasado'>('all');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const filteredLogs = accessLogs.filter((log) => {
    const matchesSearch =
      log.memberName.toLowerCase().includes(search.toLowerCase()) ||
      log.dni.includes(search) ||
      (log.notes && log.notes.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (typeFilter !== 'all' && log.type !== typeFilter) return false;
    if (feeFilter !== 'all' && log.feeStatusAtAccess !== feeFilter) return false;

    const logTime = new Date(log.timestamp).getTime();
    if (dateFilter === 'today' && logTime < todayStart) return false;
    if (dateFilter === 'week' && logTime < weekStart) return false;

    return true;
  });

  const handleClear = () => {
    if (window.confirm('¿Está seguro de que desea vaciar el historial de accesos? Esta acción no se puede deshacer.')) {
      clearLogs();
    }
  };

  const totalEntries = filteredLogs.filter((l) => l.type === 'entrada').length;
  const totalExits = filteredLogs.filter((l) => l.type === 'salida').length;
  const totalWarnings = filteredLogs.filter((l) => l.feeStatusAtAccess === 'atrasado').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Auditoría de Entradas & Salidas
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Historial de Accesos con Hora Exacta
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Registro cronológico inmutable de entradas y salidas registradas en el torniquete.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAccessLogsToCSV(accessLogs, settings.facilityName)}
            disabled={accessLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Descargar CSV</span>
          </button>

          <button
            onClick={handleClear}
            disabled={accessLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            title="Limpiar registros"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Limpiar Historial</span>
          </button>
        </div>
      </div>

      {/* KPI mini strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <LogIn className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Entradas en vista</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {totalEntries}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Salidas en vista</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {totalExits}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Con Cuota Atrasada</span>
            <span className="text-xl font-bold text-amber-700 font-mono tabular-nums">
              {totalWarnings}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date range buttons */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                dateFilter === 'today' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                dateFilter === 'week' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                dateFilter === 'all' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Todos los tiempos ({accessLogs.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por DNI o socio..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400"
            />
          </div>
        </div>

        {/* Secondary filters: Type & Fee status */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Filtrar por tipo:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2 py-0.8 rounded text-[11px] ${
                typeFilter === 'all' ? 'bg-slate-900 text-white font-medium' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('entrada')}
              className={`px-2 py-0.8 rounded text-[11px] ${
                typeFilter === 'entrada' ? 'bg-emerald-600 text-white font-medium' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Solo Entradas
            </button>
            <button
              onClick={() => setTypeFilter('salida')}
              className={`px-2 py-0.8 rounded text-[11px] ${
                typeFilter === 'salida' ? 'bg-slate-900 text-white font-medium' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Solo Salidas
            </button>
          </div>

          <span className="text-slate-300 mx-1">|</span>

          <span className="text-slate-500 font-medium">Estado cuota:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFeeFilter('all')}
              className={`px-2 py-0.8 rounded text-[11px] ${
                feeFilter === 'all' ? 'bg-slate-900 text-white font-medium' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFeeFilter('al_dia')}
              className={`px-2 py-0.8 rounded text-[11px] ${
                feeFilter === 'al_dia' ? 'bg-emerald-600 text-white font-medium' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Al Día
            </button>
            <button
              onClick={() => setFeeFilter('atrasado')}
              className={`px-2 py-0.8 rounded text-[11px] ${
                feeFilter === 'atrasado' ? 'bg-red-600 text-white font-medium' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Atrasados
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Fecha y Hora Exacta</th>
                <th className="py-3 px-4">Tipo Movimiento</th>
                <th className="py-3 px-4">Documento (DNI)</th>
                <th className="py-3 px-4">Nombre del Socio</th>
                <th className="py-3 px-4">Estado Cuota al Acceder</th>
                <th className="py-3 px-4">Acceso</th>
                <th className="py-3 px-4 text-right">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span className="font-semibold text-slate-700 block">No hay registros</span>
                    <span className="text-xs text-slate-500">
                      No se encontraron movimientos para el filtro seleccionado.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {formatExactTimestamp(log.timestamp)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.type === 'entrada' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                          <LogIn className="w-3 h-3" />
                          <span>ENTRADA</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                          <LogOut className="w-3 h-3" />
                          <span>SALIDA</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {log.dni}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {log.memberName}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.feeStatusAtAccess === 'al_dia' ? (
                        <span className="text-emerald-700 font-medium">Al Día</span>
                      ) : log.feeStatusAtAccess === 'por_vencer' ? (
                        <span className="text-amber-700 font-medium">Por Vencer</span>
                      ) : (
                        <span className="text-red-700 font-bold">
                          Atrasado ({log.daysOverdue}d)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.authorized ? (
                        <span className="text-emerald-700 font-semibold">Autorizado</span>
                      ) : (
                        <span className="text-red-700 font-semibold">Denegado</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-500 text-[11px] whitespace-nowrap">
                      {log.notes || 'Normal'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
