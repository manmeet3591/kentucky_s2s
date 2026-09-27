import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { LineChart, Calendar, CloudRain, Thermometer } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MeteogramChart({ timelineData, locationName = "Kentucky Central / Bluegrass", unit = "imperial" }) {
  if (!timelineData || timelineData.length === 0) return null;

  const labels = timelineData.map(d => `Day ${d.lead_day} (${d.date.slice(5)})`);
  
  const tempMeans = timelineData.map(d => {
    return unit === 'imperial' ? d.temp_mean_f : ((d.temp_mean_f - 32) * 5/9);
  });

  const tempMaxs = timelineData.map(d => {
    return unit === 'imperial' ? d.temp_max_f : ((d.temp_max_f - 32) * 5/9);
  });

  const tempMins = timelineData.map(d => {
    return unit === 'imperial' ? d.temp_min_f : ((d.temp_min_f - 32) * 5/9);
  });

  const precipValues = timelineData.map(d => {
    return unit === 'imperial' ? d.precip_inches : (d.precip_inches * 25.4);
  });

  const tempChartData = {
    labels,
    datasets: [
      {
        label: 'Upper Spread (90th percentile)',
        data: tempMaxs,
        borderColor: 'transparent',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        pointRadius: 0,
        fill: '+1'
      },
      {
        label: 'Lower Spread (10th percentile)',
        data: tempMins,
        borderColor: 'transparent',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        pointRadius: 0,
        fill: false
      },
      {
        label: `Ensemble Mean Temp (°${unit === 'imperial' ? 'F' : 'C'})`,
        data: tempMeans,
        borderColor: '#38bdf8',
        backgroundColor: '#0284c7',
        borderWidth: 2.5,
        pointBackgroundColor: '#38bdf8',
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.3
      }
    ]
  };

  const precipChartData = {
    labels,
    datasets: [
      {
        label: `Daily Precip (${unit === 'imperial' ? 'inches' : 'mm'})`,
        data: precipValues,
        backgroundColor: 'rgba(52, 211, 153, 0.65)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11 },
          filter: (item) => !item.text.includes('Spread')
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 }, maxRotation: 45 }
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
      }
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <LineChart size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              28-Day Subseasonal Meteogram ({locationName})
            </h3>
            <p className="text-xs text-slate-400">Daily ensemble trajectory and forecast uncertainty plume</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Week 1: Days 1-7</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Week 2: Days 8-14</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Week 3: Days 15-21</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Week 4: Days 22-28</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temperature Plume */}
        <div className="lg:col-span-2 h-64 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <Line data={tempChartData} options={chartOptions} />
        </div>

        {/* Daily Precipitation Accumulation */}
        <div className="h-64 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <Bar data={precipChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
