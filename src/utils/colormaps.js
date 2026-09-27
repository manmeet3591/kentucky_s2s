/**
 * Meteorological colormaps and interpolation routines for Kentucky S2S
 */

// Diverging Temperature Anomaly Palette (°C / °F): Blue -> Light Blue -> White -> Yellow -> Orange -> Red -> Deep Magenta
export const TEMP_ANOMALY_STOPS = [
  { val: -6.0, color: [23, 49, 137] },    // Deep Blue
  { val: -4.0, color: [43, 114, 214] },   // Cool Blue
  { val: -2.0, color: [100, 180, 246] },  // Light Blue
  { val: -0.5, color: [205, 235, 255] },  // Very Pale Blue
  { val: 0.0,  color: [248, 250, 252] },  // Neutral Near-White
  { val: 0.5,  color: [254, 240, 138] },  // Pale Yellow
  { val: 2.0,  color: [251, 146, 60] },   // Warm Orange
  { val: 4.0,  color: [239, 68, 68] },    // Red
  { val: 6.0,  color: [159, 18, 57] }     // Deep Crimson / Magenta
];

// Precipitation Anomaly (% departure): Brown (Dry) -> Pale Sand -> White (Normal) -> Light Green -> Dark Teal/Blue (Wet)
export const PRECIP_ANOMALY_STOPS = [
  { val: -60.0, color: [120, 53, 15] },   // Dark Brown (Severely Dry)
  { val: -40.0, color: [180, 83, 9] },    // Amber Brown
  { val: -20.0, color: [245, 158, 11] },  // Light Tan / Ochre
  { val: -5.0,  color: [254, 243, 199] }, // Pale Sand
  { val: 0.0,   color: [248, 250, 252] }, // Neutral White
  { val: 5.0,   color: [209, 250, 229] }, // Pale Mint
  { val: 20.0,  color: [52, 211, 153] },  // Light Emerald Green
  { val: 40.0,  color: [16, 185, 129] },  // Deep Emerald Green
  { val: 60.0,  color: [13, 148, 136] }   // Dark Teal (Excessive Wet)
];

// Mean Temperature (Viridis / Plasma style)
export const TEMP_MEAN_STOPS = [
  { val: 35.0, color: [49, 18, 120] },
  { val: 45.0, color: [68, 87, 183] },
  { val: 55.0, color: [33, 145, 140] },
  { val: 65.0, color: [90, 200, 100] },
  { val: 75.0, color: [230, 215, 40] },
  { val: 85.0, color: [240, 100, 30] }
];

// Total Precipitation (Ocean / Blue Palette)
export const PRECIP_TOTAL_STOPS = [
  { val: 0.0, color: [248, 250, 252] },
  { val: 0.5, color: [186, 230, 253] },
  { val: 1.0, color: [56, 189, 248] },
  { val: 2.0, color: [2, 132, 199] },
  { val: 3.0, color: [30, 64, 175] },
  { val: 4.5, color: [76, 29, 149] }
];

// Standard helper to interpolate RGB values along stop scale
export function interpolateColor(val, stops) {
  if (val <= stops[0].val) {
    const c = stops[0].color;
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }
  if (val >= stops[stops.length - 1].val) {
    const c = stops[stops.length - 1].color;
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (val >= s1.val && val <= s2.val) {
      const t = (val - s1.val) / (s2.val - s1.val);
      const r = Math.round(s1.color[0] + t * (s2.color[0] - s1.color[0]));
      const g = Math.round(s1.color[1] + t * (s2.color[1] - s1.color[1]));
      const b = Math.round(s1.color[2] + t * (s2.color[2] - s1.color[2]));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return 'rgb(200, 200, 200)';
}

export function getColorForProduct(val, productId, unit = 'imperial') {
  if (productId === 'temp_anomaly') {
    // If unit is Fahrenheit, normalize appropriately
    const valC = unit === 'imperial' ? val / 1.8 : val;
    return interpolateColor(valC, TEMP_ANOMALY_STOPS);
  } else if (productId === 'precip_anomaly') {
    return interpolateColor(val, PRECIP_ANOMALY_STOPS);
  } else if (productId === 'temp_mean') {
    const valF = unit === 'imperial' ? val : (val * 9/5 + 32);
    return interpolateColor(valF, TEMP_MEAN_STOPS);
  } else if (productId === 'precip_total') {
    const valInches = unit === 'imperial' ? val : (val / 25.4);
    return interpolateColor(valInches, PRECIP_TOTAL_STOPS);
  } else if (productId === 'soil_moisture_anomaly') {
    return interpolateColor(val * 20, PRECIP_ANOMALY_STOPS);
  } else if (productId === 'z500_anomaly') {
    return interpolateColor(val / 15, TEMP_ANOMALY_STOPS);
  }
  return interpolateColor(val, TEMP_ANOMALY_STOPS);
}
