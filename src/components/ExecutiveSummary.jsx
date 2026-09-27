import React from 'react';
import { Wheat, Zap, Waves, Compass, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function ExecutiveSummary({ forecastData, selectedWeek, unit }) {
  const currentWeek = forecastData?.weeks?.[`week_${selectedWeek}`];
  if (!currentWeek) return null;

  // Derive summary metrics from week data
  const avgTempAnom = currentWeek.divisions.reduce((a, b) => a + (unit === 'imperial' ? b.temp_anomaly_f : b.temp_anomaly_c), 0) / 4;
  const avgPrecipAnom = currentWeek.divisions.reduce((a, b) => a + b.precip_anomaly_pct, 0) / 4;

  const isWarm = avgTempAnom > 1.0;
  const isCool = avgTempAnom < -1.0;
  const isWet = avgPrecipAnom > 15;
  const isDry = avgPrecipAnom < -15;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Compass size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">
            Kentucky Subseasonal Outlook & Sector Impacts · Week {selectedWeek}
          </h3>
          <p className="text-xs text-slate-400">
            Synoptic guidance for {currentWeek.metadata.days} ({currentWeek.metadata.start_date} to {currentWeek.metadata.end_date})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Agriculture Card */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
            <Wheat size={16} />
            <span>Agriculture & Field Operations</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {isWet
              ? 'Elevated rainfall probabilities across Western and Central Kentucky may slow field drying and early grain harvesting. Monitor soil saturation in low-lying Pennyrile basins.'
              : isDry
                ? 'Favorable dry harvest windows across Bluegrass and Western agricultural zones. Good conditions for fieldwork, though topsoil moisture depletion may accelerate.'
                : 'Near-normal moisture profile across Kentucky farm counties. Standard late-season crop development and field access anticipated.'}
          </p>
        </div>

        {/* Energy Card */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
            <Zap size={16} />
            <span>Energy & Utility Load</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {isWarm
              ? `Projected above-average temperatures (+${avgTempAnom.toFixed(1)}°${unit === 'imperial' ? 'F' : 'C'}) indicate above-baseline late-summer Cooling Degree Days (CDD), increasing peak HVAC demand for LG&E and KU grids.`
              : isCool
                ? `Anomalous coolness (${avgTempAnom.toFixed(1)}°${unit === 'imperial' ? 'F' : 'C'}) will accelerate early Heating Degree Day (HDD) requirements across northern Kentucky and the Cumberland Plateau.`
                : 'Temperatures tracking close to seasonal norms. Stable baseline energy demand across residential and commercial sectors in the Commonwealth.'}
          </p>
        </div>

        {/* Water Resources & Hydrology Card */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
            <Waves size={16} />
            <span>Hydrology & River Basins</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {isWet
              ? 'Ohio River, Kentucky River, and Green River tributary inflows projected to trend above seasonal medians. Flood hazard potential remains within manageable thresholds.'
              : isDry
                ? 'Streamflows on eastern Kentucky headwaters and Green River basin projected to stay at or below median levels. No immediate flash drought concerns.'
                : 'Steady streamflows and balanced reservoir storage across Kentucky lake systems (Lake Cumberland, Kentucky Lake, Dale Hollow).'}
          </p>
        </div>
      </div>
    </div>
  );
}
