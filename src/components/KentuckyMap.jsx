import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getColorForProduct } from '../utils/colormaps';
import { Layers, MapPin, Info, Eye, EyeOff } from 'lucide-react';

export default function KentuckyMap({
  forecastData,
  selectedWeek,
  selectedProduct,
  unit,
  onSelectStation,
  onSelectDivision,
  selectedStation,
  selectedDivision
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const canvasLayerRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [showStations, setShowStations] = useState(true);
  const [showDivisions, setShowDivisions] = useState(true);
  const [cursorVal, setCursorVal] = useState(null);

  const currentWeekData = forecastData?.weeks?.[`week_${selectedWeek}`];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered on Kentucky
    const map = L.map(mapContainerRef.current, {
      center: [37.8393, -85.2784],
      zoom: 7.4,
      minZoom: 6,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    // Dark sleek Esri Dark Gray Canvas basemap (No API key required)
    L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors'
    }).addTo(map);

    // Attribution
    L.control.attribution({
      position: 'bottomright',
      prefix: '<span class="text-xs text-slate-500">Kentucky S2S · Esri · NOAA</span>'
    }).addTo(map);

    // Custom Canvas Overlay for Gridded Data
    const CanvasOverlay = L.Layer.extend({
      onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer');
        this._canvas.style.position = 'absolute';
        this._canvas.style.top = '0';
        this._canvas.style.left = '0';
        this._canvas.style.pointerEvents = 'none';
        this._canvas.style.opacity = '0.82';
        this._canvas.style.mixBlendMode = 'screen';
        
        map.getPanes().overlayPane.appendChild(this._canvas);
        map.on('moveend zoomend resize', this._update, this);
        this._update();
      },
      onRemove: function (map) {
        map.getPanes().overlayPane.removeChild(this._canvas);
        map.off('moveend zoomend resize', this._update, this);
      },
      _update: function () {
        if (!this._map || !this._canvas) return;
        const size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
        
        const topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);

        this.draw();
      },
      draw: function () {
        if (!this._canvas || !this._map || !this._gridData) return;
        const ctx = this._canvas.getContext('2d');
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        const { lats, lons, values, productId, unit } = this._gridData;
        if (!lats || !lons || !values) return;

        const dLat = Math.abs(lats[1] - lats[0]) || 0.25;
        const dLon = Math.abs(lons[1] - lons[0]) || 0.25;

        for (let i = 0; i < lats.length; i++) {
          const lat = lats[i];
          for (let j = 0; j < lons.length; j++) {
            const lon = lons[j];
            const val = values[i]?.[j];
            if (val === undefined || val === null) continue;

            // Rough mask for Kentucky bounding envelope
            if (lat < 36.4 || lat > 39.2 || lon < -89.6 || lon > -81.9) continue;
            if (lon > -84.0 && lat > (38.5 + (lon + 84.0) * (-0.15))) continue;

            const nw = this._map.latLngToContainerPoint([lat + dLat / 2, lon - dLon / 2]);
            const se = this._map.latLngToContainerPoint([lat - dLat / 2, lon + dLon / 2]);

            const width = Math.abs(se.x - nw.x);
            const height = Math.abs(se.y - nw.y);

            let displayVal = val;
            if (productId === 'temp_anomaly' && unit === 'imperial') {
              displayVal = val * 1.8;
            } else if (productId === 'temp_mean' && unit === 'imperial') {
              displayVal = val * 9/5 + 32;
            } else if (productId === 'precip_total' && unit === 'imperial') {
              displayVal = val / 25.4;
            }

            const color = getColorForProduct(displayVal, productId, unit);
            ctx.fillStyle = color;
            ctx.fillRect(Math.min(nw.x, se.x), Math.min(nw.y, se.y), width + 1, height + 1);
          }
        }
      },
      setData: function (gridData) {
        this._gridData = gridData;
        this.draw();
      }
    });

    const canvasLayer = new CanvasOverlay();
    canvasLayer.addTo(map);
    canvasLayerRef.current = canvasLayer;

    // Load Kentucky Climate Divisions GeoJSON
    fetch('./data/geography/kentucky_divisions.geojson')
      .then(res => res.json())
      .then(geojson => {
        const geoLayer = L.geoJSON(geojson, {
          style: (feature) => ({
            color: '#38bdf8',
            weight: 1.5,
            dashArray: '4, 4',
            fillColor: feature.properties.color || '#0284c7',
            fillOpacity: 0.08
          }),
          onEachFeature: (feature, layer) => {
            layer.on({
              mouseover: (e) => {
                const target = e.target;
                target.setStyle({
                  weight: 2.5,
                  dashArray: '',
                  fillOpacity: 0.22,
                  color: '#67e8f9'
                });
              },
              mouseout: (e) => {
                geoLayer.resetStyle(e.target);
              },
              click: () => {
                if (onSelectDivision) onSelectDivision(feature.properties.id);
              }
            });

            layer.bindTooltip(`
              <div class="px-2 py-1 bg-slate-900 border border-slate-700 text-xs rounded shadow-lg">
                <div class="font-bold text-cyan-400">${feature.properties.name} (${feature.properties.code})</div>
                <div class="text-slate-300 text-[11px]">${feature.properties.subregion}</div>
              </div>
            `, { sticky: true, className: 'custom-tooltip' });
          }
        }).addTo(map);
        geojsonLayerRef.current = geoLayer;
      })
      .catch(err => console.error("Error loading GeoJSON", err));

    // Marker Layer Group
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Map mouse move inspection
    map.on('mousemove', (e) => {
      const { lat, lng } = e.latlng;
      if (lat >= 36.4 && lat <= 39.2 && lng >= -89.6 && lng <= -81.9) {
        setCursorVal({ lat: lat.toFixed(2), lon: lng.toFixed(2) });
      } else {
        setCursorVal(null);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Gridded Canvas Overlay whenever product, week, or data changes
  useEffect(() => {
    if (!canvasLayerRef.current || !currentWeekData?.grid) return;

    let values;
    if (selectedProduct === 'temp_anomaly') {
      values = currentWeekData.grid.temp_anomaly_c;
    } else if (selectedProduct === 'precip_anomaly') {
      values = currentWeekData.grid.precip_anomaly_pct;
    } else if (selectedProduct === 'temp_mean') {
      values = currentWeekData.grid.temp_mean_c;
    } else if (selectedProduct === 'precip_total') {
      values = currentWeekData.grid.precip_total_mm;
    } else if (selectedProduct === 'soil_moisture_anomaly') {
      values = currentWeekData.grid.soil_moisture_anomaly;
    } else if (selectedProduct === 'z500_anomaly') {
      values = currentWeekData.grid.z500_anomaly_m;
    }

    canvasLayerRef.current.setData({
      lats: currentWeekData.grid.lats,
      lons: currentWeekData.grid.lons,
      values: values,
      productId: selectedProduct,
      unit: unit
    });
  }, [currentWeekData, selectedProduct, unit]);

  // Update Station Markers
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    if (!showStations || !currentWeekData?.stations) return;

    currentWeekData.stations.forEach(stn => {
      let valStr = '';
      if (selectedProduct === 'temp_anomaly') {
        const val = unit === 'imperial' ? stn.temp_anomaly_f : stn.temp_anomaly_c;
        const sign = val > 0 ? '+' : '';
        valStr = `${sign}${val.toFixed(1)}°${unit === 'imperial' ? 'F' : 'C'}`;
      } else if (selectedProduct === 'precip_anomaly') {
        const sign = stn.precip_anomaly_pct > 0 ? '+' : '';
        valStr = `${sign}${stn.precip_anomaly_pct.toFixed(0)}%`;
      } else if (selectedProduct === 'temp_mean') {
        const val = unit === 'imperial' ? stn.temp_mean_f : ((stn.temp_mean_f - 32) * 5/9);
        valStr = `${val.toFixed(1)}°${unit === 'imperial' ? 'F' : 'C'}`;
      } else {
        valStr = `${stn.precip_total_inches.toFixed(2)}"`;
      }

      const isSelected = selectedStation?.id === stn.id;

      const customIcon = L.divIcon({
        className: 'custom-station-icon',
        html: `
          <div class="relative group cursor-pointer">
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-mono font-bold shadow-md transition-all ${
              isSelected 
                ? 'bg-cyan-500 text-black border-white ring-2 ring-cyan-300 scale-110' 
                : 'bg-slate-900/90 text-slate-100 border-slate-600 hover:border-cyan-400'
            }">
              <span class="w-1.5 h-1.5 rounded-full ${stn.temp_anomaly_f > 0 ? 'bg-amber-400' : 'bg-cyan-400'}"></span>
              <span>${stn.id}</span>
              <span class="text-[10px] opacity-85">${valStr}</span>
            </div>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });

      const marker = L.marker([stn.lat, stn.lon], { icon: customIcon });

      marker.on('click', () => {
        if (onSelectStation) onSelectStation(stn);
      });

      marker.bindTooltip(`
        <div class="p-2 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg shadow-xl text-xs">
          <div class="font-bold text-cyan-400 text-sm">${stn.name}</div>
          <div class="text-slate-400 text-[11px] mb-1.5">Division: ${stn.division} · Lat: ${stn.lat}, Lon: ${stn.lon}</div>
          <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-800/80 p-1.5 rounded border border-slate-700/50">
            <div>Temp Anomaly: <span class="font-bold ${stn.temp_anomaly_f > 0 ? 'text-amber-400' : 'text-cyan-400'}">${stn.temp_anomaly_f > 0 ? '+' : ''}${stn.temp_anomaly_f}°F</span></div>
            <div>Precip Anom: <span class="font-bold text-emerald-400">${stn.precip_anomaly_pct > 0 ? '+' : ''}${stn.precip_anomaly_pct}%</span></div>
          </div>
        </div>
      `, { offset: [0, -10] });

      markersLayerRef.current.addLayer(marker);
    });
  }, [currentWeekData, selectedProduct, unit, showStations, selectedStation]);

  // Toggle GeoJSON layer
  useEffect(() => {
    if (!geojsonLayerRef.current || !mapInstanceRef.current) return;
    if (showDivisions) {
      if (!mapInstanceRef.current.hasLayer(geojsonLayerRef.current)) {
        geojsonLayerRef.current.addTo(mapInstanceRef.current);
      }
    } else {
      if (mapInstanceRef.current.hasLayer(geojsonLayerRef.current)) {
        geojsonLayerRef.current.remove();
      }
    }
  }, [showDivisions]);

  return (
    <div className="relative w-full h-[540px] lg:h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-[#080d1a] shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Control Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl text-xs">
          <button
            onClick={() => setShowStations(!showStations)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              showStations
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {showStations ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>Mesonet Stations</span>
          </button>

          <button
            onClick={() => setShowDivisions(!showDivisions)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              showDivisions
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>Climate Divisions</span>
          </button>
        </div>
      </div>

      {/* Coordinates cursor indicator */}
      {cursorVal && (
        <div className="absolute top-4 right-4 z-[1000] px-3 py-1 bg-slate-900/90 backdrop-blur border border-slate-700/60 rounded-lg text-xs font-mono text-slate-300 shadow-lg">
          <span className="text-cyan-400">KY Grid:</span> {cursorVal.lat}°N, {Math.abs(cursorVal.lon)}°W
        </div>
      )}

      {/* Colorbar Legend */}
      <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-[1000] p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-semibold text-slate-200">
            {selectedProduct === 'temp_anomaly' && `2m Temperature Anomaly (${unit === 'imperial' ? '°F' : '°C'})`}
            {selectedProduct === 'precip_anomaly' && 'Precipitation Anomaly (% of Normal)'}
            {selectedProduct === 'temp_mean' && `2m Mean Temperature (${unit === 'imperial' ? '°F' : '°C'})`}
            {selectedProduct === 'precip_total' && `Total Precipitation (${unit === 'imperial' ? 'in' : 'mm'})`}
            {selectedProduct === 'soil_moisture_anomaly' && 'Soil Moisture Standardized Anomaly'}
            {selectedProduct === 'z500_anomaly' && '500 hPa Height Anomaly (gpm)'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">20-Yr ERA5 Climatology</span>
        </div>

        {/* Gradient bar */}
        {selectedProduct === 'temp_anomaly' && (
          <div>
            <div className="h-3.5 rounded-md w-full bg-gradient-to-r from-[#173189] via-[#64b4f6] via-white via-[#fb923c] to-[#9f1239] border border-slate-600/50" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>{unit === 'imperial' ? '-10.8°F' : '-6.0°C'}</span>
              <span>-3.6°</span>
              <span>0.0 (Normal)</span>
              <span>+3.6°</span>
              <span>{unit === 'imperial' ? '+10.8°F' : '+6.0°C'}</span>
            </div>
          </div>
        )}

        {selectedProduct === 'precip_anomaly' && (
          <div>
            <div className="h-3.5 rounded-md w-full bg-gradient-to-r from-[#78350f] via-[#f59e0b] via-white via-[#34d399] to-[#0d9488] border border-slate-600/50" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span className="text-amber-400">-60% (Dry)</span>
              <span>-30%</span>
              <span>0% (Avg)</span>
              <span>+30%</span>
              <span className="text-emerald-400">+60% (Wet)</span>
            </div>
          </div>
        )}

        {selectedProduct === 'temp_mean' && (
          <div>
            <div className="h-3.5 rounded-md w-full bg-gradient-to-r from-[#311278] via-[#21918c] via-[#5ac864] to-[#f0641e] border border-slate-600/50" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>{unit === 'imperial' ? '35°F' : '2°C'}</span>
              <span>{unit === 'imperial' ? '50°F' : '10°C'}</span>
              <span>{unit === 'imperial' ? '65°F' : '18°C'}</span>
              <span>{unit === 'imperial' ? '85°F' : '29°C'}</span>
            </div>
          </div>
        )}

        {selectedProduct === 'precip_total' && (
          <div>
            <div className="h-3.5 rounded-md w-full bg-gradient-to-r from-[#f8fafc] via-[#38bdf8] via-[#0284c7] to-[#4c1d95] border border-slate-600/50" />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>0.0"</span>
              <span>0.5"</span>
              <span>1.5"</span>
              <span>3.0"+</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
