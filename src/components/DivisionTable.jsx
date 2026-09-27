import React from 'react';
import { ShieldCheck, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function DivisionTable({
  divisions,
  unit,
  onSelectDivision,
  selectedDivisionId
}) {
  if (!divisions || divisions.length === 0) return null;

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Kentucky Climate Division Breakdown</h3>
            <p className="text-xs text-slate-400">Calibrated anomalies and tercile probability distribution</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Climate Division</th>
              <th className="px-4 py-3">Temp Anomaly</th>
              <th className="px-4 py-3">Precip Anomaly</th>
              <th className="px-4 py-3">Tercile Probabilities (Above / Normal / Below)</th>
              <th className="px-4 py-3">Skill Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {divisions.map((div) => {
              const valTemp = unit === 'imperial' ? div.temp_anomaly_f : div.temp_anomaly_c;
              const signTemp = valTemp > 0 ? '+' : '';
              const signPrecip = div.precip_anomaly_pct > 0 ? '+' : '';
              const isSelected = selectedDivisionId === div.id;

              return (
                <tr
                  key={div.id}
                  onClick={() => onSelectDivision && onSelectDivision(div.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/30 text-cyan-200'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span>{div.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                        {div.code}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 font-mono">
                    <span className={`inline-flex items-center gap-1 font-bold ${
                      valTemp > 0 ? 'text-amber-400' : 'text-cyan-400'
                    }`}>
                      {valTemp > 0 ? <TrendingUp size={13} /> : (valTemp < 0 ? <TrendingDown size={13} /> : <Minus size={13} />)}
                      {signTemp}{valTemp.toFixed(1)}°{unit === 'imperial' ? 'F' : 'C'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 font-mono">
                    <span className={`inline-flex items-center gap-1 font-bold ${
                      div.precip_anomaly_pct > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {signPrecip}{div.precip_anomaly_pct.toFixed(0)}%
                      <span className="text-slate-500 font-normal">
                        ({signPrecip}{div.precip_anomaly_inches.toFixed(2)}")
                      </span>
                    </span>
                  </td>

                  {/* Tercile Probabilities (Above Normal, Near Normal, Below Normal) */}
                  <td className="px-4 py-3.5 min-w-[200px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="w-10 text-amber-400">T: {div.prob_temp.above}%</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-800 flex">
                          <div style={{ width: `${div.prob_temp.above}%` }} className="bg-amber-500" title={`Above: ${div.prob_temp.above}%`} />
                          <div style={{ width: `${div.prob_temp.normal}%` }} className="bg-slate-400" title={`Normal: ${div.prob_temp.normal}%`} />
                          <div style={{ width: `${div.prob_temp.below}%` }} className="bg-cyan-500" title={`Below: ${div.prob_temp.below}%`} />
                        </div>
                        <span className="w-10 text-cyan-400 text-right">{div.prob_temp.below}%</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="w-10 text-emerald-400">P: {div.prob_precip.above}%</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-800 flex">
                          <div style={{ width: `${div.prob_precip.above}%` }} className="bg-emerald-500" title={`Above: ${div.prob_precip.above}%`} />
                          <div style={{ width: `${div.prob_precip.normal}%` }} className="bg-slate-400" title={`Normal: ${div.prob_precip.normal}%`} />
                          <div style={{ width: `${div.prob_precip.below}%` }} className="bg-amber-700" title={`Below: ${div.prob_precip.below}%`} />
                        </div>
                        <span className="w-10 text-amber-500 text-right">{div.prob_precip.below}%</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      div.confidence === 'High' 
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : (div.confidence === 'Medium' || div.confidence === 'Moderate')
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-slate-700/50 text-slate-400 border-slate-600'
                    }`}>
                      {div.confidence}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
