import React from 'react';
import { getColorForProduct } from '../utils/colormaps';
import { ArrowRightLeft, Sparkles, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ModelComparisonView({
  aircastData,
  ifsData,
  selectedWeek,
  selectedProduct,
  unit
}) {
  const aircastWeek = aircastData?.weeks?.[`week_${selectedWeek}`];
  const ifsWeek = ifsData?.weeks?.[`week_${selectedWeek}`];

  if (!aircastWeek || !ifsWeek) {
    return (
      <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
        Loading multi-model ensemble comparison data...
      </div>
    );
  }

  // Calculate average Kentucky anomaly across models
  const aircastAvgTemp = aircastWeek.divisions.reduce((acc, d) => acc + (unit === 'imperial' ? d.temp_anomaly_f : d.temp_anomaly_c), 0) / 4;
  const ifsAvgTemp = ifsWeek.divisions.reduce((acc, d) => acc + (unit === 'imperial' ? d.temp_anomaly_f : d.temp_anomaly_c), 0) / 4;
  
  const aircastAvgPrecip = aircastWeek.divisions.reduce((acc, d) => acc + d.precip_anomaly_pct, 0) / 4;
  const ifsAvgPrecip = ifsWeek.divisions.reduce((acc, d) => acc + d.precip_anomaly_pct, 0) / 4;

  const tempDiff = Math.abs(aircastAvgTemp - ifsAvgTemp);
  const isHighAgreement = tempDiff < 1.0;

  return (
    <div className="space-y-6">
      {/* Model Consensus Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-pink-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Aircast S2S (AI) vs ECMWF IFS S2S (Physics) Consensus</span>
              <span className={`px-2 py-0.5 text-[11px] rounded-full border font-mono ${
                isHighAgreement 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {isHighAgreement ? 'High Model Agreement' : 'Moderate Model Spread'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Comparison across 4 Kentucky Climate Divisions for Week {selectedWeek}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300">Aircast: </span>
            <span className="font-bold text-cyan-300">{aircastAvgTemp > 0 ? '+' : ''}{aircastAvgTemp.toFixed(1)}°</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-400"></span>
            <span className="text-slate-300">IFS: </span>
            <span className="font-bold text-pink-300">{ifsAvgTemp > 0 ? '+' : ''}{ifsAvgTemp.toFixed(1)}°</span>
          </div>
          <div className="text-slate-400 border-l border-slate-700 pl-3">
            Δ Diff: <span className="font-bold text-white">{tempDiff.toFixed(1)}°{unit === 'imperial' ? 'F' : 'C'}</span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Model Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aircast S2S Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  Aircast S2S
                  <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                    AI Neural Foundation
                  </span>
                </h3>
                <p className="text-xs text-slate-400">100 Ensemble Members · GFS / ERA5 Calibration</p>
              </div>
            </div>
          </div>

          {/* Division Breakdown for Aircast */}
          <div className="space-y-3">
            {aircastWeek.divisions.map((div) => {
              const valTemp = unit === 'imperial' ? div.temp_anomaly_f : div.temp_anomaly_c;
              const signTemp = valTemp > 0 ? '+' : '';
              const signPrecip = div.precip_anomaly_pct > 0 ? '+' : '';

              return (
                <div key={div.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{div.name}</div>
                    <div className="text-[11px] text-slate-400">{div.code}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={`px-2 py-1 rounded font-bold ${valTemp > 0 ? 'bg-amber-500/10 text-amber-300' : 'bg-cyan-500/10 text-cyan-300'}`}>
                      {signTemp}{valTemp.toFixed(1)}°{unit === 'imperial' ? 'F' : 'C'}
                    </span>
                    <span className={`px-2 py-1 rounded font-bold ${div.precip_anomaly_pct > 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-700/10 text-amber-400'}`}>
                      {signPrecip}{div.precip_anomaly_pct.toFixed(0)}% Precip
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ECMWF IFS S2S Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-pink-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Cpu size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                  ECMWF IFS S2S
                  <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-pink-500/20 text-pink-300 rounded border border-pink-500/30">
                    Physics Ensemble
                  </span>
                </h3>
                <p className="text-xs text-slate-400">51 Ensemble Members · Cy48r1 / 20-Yr Re-forecast</p>
              </div>
            </div>
          </div>

          {/* Division Breakdown for IFS */}
          <div className="space-y-3">
            {ifsWeek.divisions.map((div) => {
              const valTemp = unit === 'imperial' ? div.temp_anomaly_f : div.temp_anomaly_c;
              const signTemp = valTemp > 0 ? '+' : '';
              const signPrecip = div.precip_anomaly_pct > 0 ? '+' : '';

              return (
                <div key={div.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{div.name}</div>
                    <div className="text-[11px] text-slate-400">{div.code}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={`px-2 py-1 rounded font-bold ${valTemp > 0 ? 'bg-amber-500/10 text-amber-300' : 'bg-cyan-500/10 text-cyan-300'}`}>
                      {signTemp}{valTemp.toFixed(1)}°{unit === 'imperial' ? 'F' : 'C'}
                    </span>
                    <span className={`px-2 py-1 rounded font-bold ${div.precip_anomaly_pct > 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-700/10 text-amber-400'}`}>
                      {signPrecip}{div.precip_anomaly_pct.toFixed(0)}% Precip
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
