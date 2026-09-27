import React, { useState, useEffect } from 'react';
import KentuckyMap from './components/KentuckyMap';
import ModelComparisonView from './components/ModelComparisonView';
import DivisionTable from './components/DivisionTable';
import MeteogramChart from './components/MeteogramChart';
import ExecutiveSummary from './components/ExecutiveSummary';
import MethodologyModal from './components/MethodologyModal';
import {
  CloudSun,
  Sparkles,
  Cpu,
  Layers,
  Calendar,
  Thermometer,
  CloudRain,
  Info,
  Download,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Globe,
  Sliders,
  Scale,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [activeModel, setActiveModel] = useState('aircast'); // 'aircast', 'ifs', 'comparison'
  const [selectedWeek, setSelectedWeek] = useState('1'); // '1', '2', '3', '4', '1-4'
  const [selectedProduct, setSelectedProduct] = useState('temp_anomaly'); // 'temp_anomaly', 'precip_anomaly', 'temp_mean', 'precip_total', 'soil_moisture_anomaly', 'z500_anomaly'
  const [unit, setUnit] = useState('imperial'); // 'imperial' or 'metric'
  
  const [aircastData, setAircastData] = useState(null);
  const [ifsData, setIfsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMethodology, setShowMethodology] = useState(false);
  
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState(null);

  // 1. Load Catalog
  useEffect(() => {
    fetch('./data/catalog.json')
      .then(res => res.json())
      .then(data => {
        setCatalog(data);
        if (data.available_issues && data.available_issues.length > 0) {
          setSelectedIssueId(data.available_issues[0].id);
        }
      })
      .catch(err => {
        console.error("Failed to load catalog.json", err);
        setLoading(false);
      });
  }, []);

  // 2. Load Forecast Data for Selected Issue
  useEffect(() => {
    if (!selectedIssueId) return;
    setLoading(true);

    Promise.all([
      fetch(`./data/forecasts/aircast/${selectedIssueId}.json`).then(r => r.json()),
      fetch(`./data/forecasts/ifs/${selectedIssueId}.json`).then(r => r.json())
    ])
      .then(([aircast, ifs]) => {
        setAircastData(aircast);
        setIfsData(ifs);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading forecast data", err);
        setLoading(false);
      });
  }, [selectedIssueId]);

  const currentForecastData = activeModel === 'ifs' ? ifsData : aircastData;
  const currentWeekData = currentForecastData?.weeks?.[`week_${selectedWeek}`];

  const handleDownloadJSON = () => {
    if (!currentForecastData) return;
    const blob = new Blob([JSON.stringify(currentForecastData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kentucky_s2s_${activeModel}_${selectedIssueId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation / Brand Header */}
      <header className="sticky top-0 z-50 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
              <CloudSun size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base lg:text-lg font-extrabold tracking-tight text-white">
                  Kentucky S2S
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Aircast AI + IFS Guidance
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Commonwealth of Kentucky Subseasonal-to-Seasonal Operational Forecast System
              </p>
            </div>
          </div>

          {/* Controls & Quick Links */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Cycle Selector */}
            {catalog && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 rounded-xl shadow-inner">
                <Calendar size={14} className="text-cyan-400" />
                <span className="text-slate-400 text-[11px]">Run:</span>
                <select
                  value={selectedIssueId || ''}
                  onChange={(e) => setSelectedIssueId(e.target.value)}
                  className="bg-transparent text-slate-100 font-mono font-medium focus:outline-none cursor-pointer text-xs"
                >
                  {catalog.available_issues?.map(issue => (
                    <option key={issue.id} value={issue.id} className="bg-slate-900 text-slate-100">
                      {issue.date} {issue.is_latest ? '(Latest 00Z)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Units Toggle */}
            <div className="flex items-center p-0.5 bg-slate-900 border border-slate-700/80 rounded-xl">
              <button
                onClick={() => setUnit('imperial')}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all ${
                  unit === 'imperial'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °F / in
              </button>
              <button
                onClick={() => setUnit('metric')}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all ${
                  unit === 'metric'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °C / mm
              </button>
            </div>

            {/* Methodology Modal Trigger */}
            <button
              onClick={() => setShowMethodology(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-colors"
            >
              <Info size={14} className="text-cyan-400" />
              <span>Methodology</span>
            </button>

            {/* GitHub Repo */}
            <a
              href="https://github.com/manmeet3591/kentucky_s2s"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-colors"
            >
              <Globe size={14} className="text-slate-400" />
              <span>manmeet3591</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        {/* Model Selection & Week Ribbon */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          {/* Model Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 mr-1">
              Forecasting Model:
            </span>

            <button
              onClick={() => setActiveModel('aircast')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeModel === 'aircast'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-bold shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Sparkles size={15} />
              <span>Aircast S2S</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeModel === 'aircast' ? 'bg-black/20 text-slate-900' : 'bg-cyan-500/20 text-cyan-300'}`}>
                AI Neural
              </span>
            </button>

            <button
              onClick={() => setActiveModel('ifs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeModel === 'ifs'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold shadow-lg shadow-pink-500/25 ring-1 ring-pink-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Cpu size={15} />
              <span>IFS S2S</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeModel === 'ifs' ? 'bg-black/20 text-white' : 'bg-pink-500/20 text-pink-300'}`}>
                ECMWF Physics
              </span>
            </button>

            <button
              onClick={() => setActiveModel('comparison')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeModel === 'comparison'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-purple-500/25 ring-1 ring-indigo-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              <Scale size={15} />
              <span>Model Comparison</span>
            </button>
          </div>

          {/* Lead Week Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            {[
              { id: '1', label: 'Week 1', sub: 'Days 1–7' },
              { id: '2', label: 'Week 2', sub: 'Days 8–14' },
              { id: '3', label: 'Week 3', sub: 'Days 15–21' },
              { id: '4', label: 'Week 4', sub: 'Days 22–28' },
              { id: '1-4', label: 'Weeks 1–4', sub: '28-Day Outlook' }
            ].map(wk => (
              <button
                key={wk.id}
                onClick={() => setSelectedWeek(wk.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedWeek === wk.id
                    ? 'bg-cyan-500 text-black font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>{wk.label}</div>
                <div className="text-[10px] font-mono opacity-80">{wk.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Product / Meteorological Variable Ribbon */}
        <div className="flex flex-wrap items-center gap-2 pb-1 overflow-x-auto">
          {[
            { id: 'temp_anomaly', label: '2m Temp Anomaly', icon: Thermometer, color: 'text-amber-400' },
            { id: 'precip_anomaly', label: 'Precipitation Anomaly', icon: CloudRain, color: 'text-emerald-400' },
            { id: 'temp_mean', label: '2m Mean Temperature', icon: Thermometer, color: 'text-cyan-400' },
            { id: 'precip_total', label: 'Total Precipitation', icon: CloudRain, color: 'text-blue-400' },
            { id: 'soil_moisture_anomaly', label: 'Soil Moisture Anomaly', icon: Layers, color: 'text-teal-400' },
            { id: 'z500_anomaly', label: '500 hPa Height Anomaly', icon: Sliders, color: 'text-purple-400' }
          ].map(prod => {
            const Icon = prod.icon;
            const isActive = selectedProduct === prod.id;
            return (
              <button
                key={prod.id}
                onClick={() => setSelectedProduct(prod.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/50 shadow-md ring-1 ring-cyan-500/20'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon size={14} className={prod.color} />
                <span>{prod.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content: Map + Regional Division Breakdown */}
        {activeModel === 'comparison' ? (
          <ModelComparisonView
            aircastData={aircastData}
            ifsData={ifsData}
            selectedWeek={selectedWeek}
            selectedProduct={selectedProduct}
            unit={unit}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Map Column */}
            <div className="lg:col-span-8 space-y-4">
              <KentuckyMap
                forecastData={currentForecastData}
                selectedWeek={selectedWeek}
                selectedProduct={selectedProduct}
                unit={unit}
                onSelectStation={(stn) => setSelectedStation(stn)}
                onSelectDivision={(divId) => setSelectedDivisionId(divId)}
                selectedStation={selectedStation}
                selectedDivision={selectedDivisionId}
              />
            </div>

            {/* Side Analytics Column */}
            <div className="lg:col-span-4 space-y-4">
              {/* Selected Target Info / Division Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Regional Focus
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Week {selectedWeek} ({currentWeekData?.metadata?.days})
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {selectedStation ? selectedStation.name : "Commonwealth of Kentucky (All Divisions)"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedStation
                      ? `Station ID: ${selectedStation.id} · Division: ${selectedStation.division}`
                      : "Aggregated across 120 Kentucky Counties and 4 NOAA Climate Divisions"}
                  </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400 mb-1">2m Temp Anomaly</div>
                    <div className="text-base font-bold font-mono text-amber-400">
                      {selectedStation
                        ? `${selectedStation.temp_anomaly_f > 0 ? '+' : ''}${selectedStation.temp_anomaly_f}°F`
                        : `${currentWeekData?.divisions?.[0]?.temp_anomaly_f > 0 ? '+' : ''}${currentWeekData?.divisions?.[0]?.temp_anomaly_f}°F`}
                    </div>
                    <div className="text-[10px] text-slate-500">vs 20-Yr Normal</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] text-slate-400 mb-1">Precip Departure</div>
                    <div className="text-base font-bold font-mono text-emerald-400">
                      {selectedStation
                        ? `${selectedStation.precip_anomaly_pct > 0 ? '+' : ''}${selectedStation.precip_anomaly_pct}%`
                        : `${currentWeekData?.divisions?.[0]?.precip_anomaly_pct > 0 ? '+' : ''}${currentWeekData?.divisions?.[0]?.precip_anomaly_pct}%`}
                    </div>
                    <div className="text-[10px] text-slate-500">Weekly Total</div>
                  </div>
                </div>

                {selectedStation && (
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="w-full py-1.5 text-xs text-center text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Reset to State View
                  </button>
                )}
              </div>

              {/* Model Specifications Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
                  <CheckCircle2 size={16} className="text-cyan-400" />
                  <span>{currentForecastData?.model_meta?.name} Parameters</span>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Architecture:</span>
                    <span className="font-mono font-medium text-slate-200">{currentForecastData?.model_meta?.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Resolution:</span>
                    <span className="font-mono text-cyan-300">{currentForecastData?.model_meta?.resolution}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Ensemble Size:</span>
                    <span className="font-mono text-white">{currentForecastData?.model_meta?.ensemble_members} members</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Calibration:</span>
                    <span className="font-mono text-emerald-400">20-Yr ERA5 Baseline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kentucky Climate Divisions Table */}
        {currentWeekData?.divisions && (
          <DivisionTable
            divisions={currentWeekData.divisions}
            unit={unit}
            onSelectDivision={(id) => setSelectedDivisionId(id)}
            selectedDivisionId={selectedDivisionId}
          />
        )}

        {/* 28-Day Meteogram Chart */}
        {currentForecastData?.daily_timeline && (
          <MeteogramChart
            timelineData={currentForecastData.daily_timeline}
            locationName={selectedStation ? selectedStation.name : "Kentucky Statewide Ensemble"}
            unit={unit}
          />
        )}

        {/* Sector Specific Executive Guidance (Agriculture, Energy, Hydrology) */}
        <ExecutiveSummary
          forecastData={currentForecastData}
          selectedWeek={selectedWeek}
          unit={unit}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-[#080d1a] py-8 px-4 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 font-medium">
              Kentucky S2S Subseasonal-to-Seasonal Guidance Dashboard
            </p>
            <p className="mt-1">
              Developed by <a href="https://manmeet3591.github.io" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Manmeet Singh (manmeet3591)</a>. Powered by Aircast S2S AI foundation model & ECMWF IFS S2S.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <Download size={14} className="text-cyan-400" />
              <span>Download Forecast JSON</span>
            </button>
            <a
              href="https://github.com/manmeet3591/kentucky_s2s"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>

      {/* Scientific Methodology Modal */}
      <MethodologyModal
        isOpen={showMethodology}
        onClose={() => setShowMethodology(false)}
      />
    </div>
  );
}
