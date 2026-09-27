import React from 'react';
import { X, BookOpen, Sparkles, Cpu, GitBranch, Database, ShieldCheck } from 'lucide-react';

export default function MethodologyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0b1120] border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Scientific Methodology & Architecture</h2>
              <p className="text-xs text-slate-400">Operational Subseasonal Guidance for the Commonwealth of Kentucky</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-slate-300 max-h-[70vh] overflow-y-auto pr-2">
          {/* Aircast S2S Section */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
              <Sparkles size={16} />
              <span>Aircast S2S · Deep Atmospheric Neural Foundation Model</span>
            </div>
            <p className="leading-relaxed">
              <strong>Aircast S2S</strong> is an experimental AI-driven subseasonal forecasting system trained on multi-decadal reanalyses (ERA5). Operating on a 0.25° (~25km) global grid, it autoregressively projects mid-tropospheric circulation (Z500, U/V850), surface temperatures, and multi-day precipitation accumulation out to 42 lead days.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 font-mono text-[11px]">
              <li>Initial Conditions: Operational NCEP GFS 00Z Analysis & Short-Range States</li>
              <li>Ensemble Generation: 100-member stochastic atmospheric perturbation ensemble</li>
              <li>Lead Window: Weeks 1–4 (Days 1 to 28) subseasonal outlooks</li>
            </ul>
          </div>

          {/* ECMWF IFS S2S Section */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-pink-500/20 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-pink-400">
              <Cpu size={16} />
              <span>ECMWF IFS S2S · Physics-Based Benchmark Ensemble</span>
            </div>
            <p className="leading-relaxed">
              The <strong>ECMWF Integrated Forecasting System (IFS) Subseasonal Ensemble</strong> provides world-class physics-based numerical weather prediction. It resolves ocean-atmosphere-land surface coupling across a 51-member ensemble issued twice weekly.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 font-mono text-[11px]">
              <li>Resolution: 0.25°/0.4° coupled atmospheric-oceanic model</li>
              <li>Ensemble Size: 51 coupled perturbed members</li>
              <li>Re-forecast Calibration: 20-year on-the-fly hindcast climatology</li>
            </ul>
          </div>

          {/* Anomaly & Hindcast Calibration */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
              <Database size={16} />
              <span>Hindcast Calibration & Tercile Categorization</span>
            </div>
            <p className="leading-relaxed">
              All weekly anomalies are calculated with reference to a 20-year historical baseline (2004–2023) sampled at the exact calendar issue week. Raw model biases are corrected by subtracting the model's own hindcast mean state:
            </p>
            <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-[11px] text-cyan-300 border border-slate-800">
              Anomaly(Week_n) = Forecast_Ensemble_Mean(Week_n) - Hindcast_Climatology(Week_n)
            </div>
            <p className="leading-relaxed text-slate-400">
              Tercile probabilities (Above, Near, Below Normal) are derived by calculating the percentage of ensemble members exceeding the 67th and 33rd percentiles of the climatological distribution.
            </p>
          </div>

          {/* Kentucky Regionalization */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
              <ShieldCheck size={16} />
              <span>Kentucky Regional Adaptation & Mesonet Alignment</span>
            </div>
            <p className="leading-relaxed">
              Outputs are dynamically downscaled and aggregated across NOAA Kentucky Climate Divisions (Western, Central, Bluegrass, Eastern) and verified against key automated station nodes across the Commonwealth.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
