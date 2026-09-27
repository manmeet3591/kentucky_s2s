#!/usr/bin/env python3
"""
Kentucky S2S (Subseasonal-to-Seasonal) Data Generator & Processor
Generates realistic Aircast S2S and ECMWF IFS S2S operational forecast outputs
with calibrated anomalies (Weeks 1 to 4) over the Commonwealth of Kentucky.
"""

import json
import math
import os
import random
from datetime import datetime, timedelta, timezone

# Kentucky Geographic Bounds
KY_BOUNDS = {
    "lat_min": 36.4,
    "lat_max": 39.2,
    "lon_min": -89.6,
    "lon_max": -81.9,
    "grid_res": 0.25  # ~25km high-res grid for regional Kentucky S2S
}

# Kentucky Climate Divisions and Representative Coordinates
KY_CLIMATE_DIVISIONS = [
    {
        "id": "div1",
        "name": "Western (Jackson Purchase & Pennyrile)",
        "code": "KY-01",
        "center_lat": 37.1,
        "center_lon": -87.8,
        "cities": ["Paducah", "Hopkinsville", "Madisonville", "Murray", "Mayfield"]
    },
    {
        "id": "div2",
        "name": "Central (Western Coalfield & Knobs)",
        "code": "KY-02",
        "center_lat": 37.5,
        "center_lon": -86.0,
        "cities": ["Bowling Green", "Owensboro", "Elizabethtown", "Glasgow", "Bardstown"]
    },
    {
        "id": "div3",
        "name": "Bluegrass (North Central & Metro)",
        "code": "KY-03",
        "center_lat": 38.2,
        "center_lon": -84.6,
        "cities": ["Louisville", "Lexington", "Frankfort", "Covington", "Georgetown", "Richmond"]
    },
    {
        "id": "div4",
        "name": "Eastern (Cumberland Plateau & Coalfields)",
        "code": "KY-04",
        "center_lat": 37.6,
        "center_lon": -83.3,
        "cities": ["Pikeville", "Hazard", "Ashland", "Morehead", "London", "Somerset", "Middlesboro"]
    }
]

# Major Kentucky Reference Stations & Mesonet Nodes
KY_STATIONS = [
    {"id": "SDF", "name": "Louisville Muhammad Ali Intl (SDF)", "division": "Bluegrass", "lat": 38.174, "lon": -85.736, "elev_ft": 497},
    {"id": "LEX", "name": "Lexington Blue Grass Airport (LEX)", "division": "Bluegrass", "lat": 38.036, "lon": -84.606, "elev_ft": 979},
    {"id": "BWG", "name": "Bowling Green Regional Airport (BWG)", "division": "Central", "lat": 36.964, "lon": -86.425, "elev_ft": 535},
    {"id": "PAH", "name": "Paducah Barkley Regional (PAH)", "division": "Western", "lat": 37.061, "lon": -88.773, "elev_ft": 410},
    {"id": "OWB", "name": "Owensboro-Daviess Co Regional (OWB)", "division": "Central", "lat": 37.740, "lon": -87.167, "elev_ft": 407},
    {"id": "FFT", "name": "Frankfort Capital City (FFT)", "division": "Bluegrass", "lat": 38.182, "lon": -84.906, "elev_ft": 802},
    {"id": "JKL", "name": "NWS Jackson / Julian Carroll (JKL)", "division": "Eastern", "lat": 37.593, "lon": -83.318, "elev_ft": 1365},
    {"id": "PBX", "name": "Pikeville Pike Co (PBX)", "division": "Eastern", "lat": 37.562, "lon": -82.565, "elev_ft": 1473},
    {"id": "CVG", "name": "Cincinnati/N. Kentucky Intl (CVG)", "division": "Bluegrass", "lat": 39.048, "lon": -84.668, "elev_ft": 883},
    {"id": "HTS", "name": "Ashland / Tri-State (HTS)", "division": "Eastern", "lat": 38.367, "lon": -82.558, "elev_ft": 828},
]


def generate_grid_points():
    """Generate regular latitude/longitude points covering Kentucky."""
    lats = []
    lat = KY_BOUNDS["lat_min"]
    while lat <= KY_BOUNDS["lat_max"] + 0.001:
        lats.append(round(lat, 2))
        lat += KY_BOUNDS["grid_res"]

    lons = []
    lon = KY_BOUNDS["lon_min"]
    while lon <= KY_BOUNDS["lon_max"] + 0.001:
        lons.append(round(lon, 2))
        lon += KY_BOUNDS["grid_res"]

    return lats, lons


def is_in_kentucky_polygon(lat, lon):
    """Rough bounding polygon check for Kentucky's distinct elongated shape."""
    # Approximate bounding envelope
    if lat < 36.49 and lon > -88.0:
        return False  # TN border below 36.5
    if lat > 39.15:
        return False
    if lon < -89.57 or lon > -81.96:
        return False
    # Ohio river shape on north/northeast
    if lon > -84.0 and lat > (38.5 + (lon + 84.0) * (-0.15)):
        return False
    if lon > -82.5 and lat > 38.7:
        return False
    return True


def create_forecast_run(init_date_str, model_name="aircast"):
    """
    Generate complete S2S forecast data structure for Kentucky
    init_date_str: 'YYYY-MM-DD'
    model_name: 'aircast' or 'ifs'
    """
    init_dt = datetime.strptime(init_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    lats, lons = generate_grid_points()

    # Seed based on date + model for deterministic reproducibility
    seed_val = int(init_dt.strftime("%Y%m%d")) + (1000 if model_name == "aircast" else 2000)
    random.seed(seed_val)

    # Lead weeks
    weeks = [
        {"week": 1, "days": "Days 1–7", "start_day": 1, "end_day": 7, "start_date": (init_dt + timedelta(days=1)).strftime("%Y-%m-%d"), "end_date": (init_dt + timedelta(days=7)).strftime("%Y-%m-%d")},
        {"week": 2, "days": "Days 8–14", "start_day": 8, "end_day": 14, "start_date": (init_dt + timedelta(days=8)).strftime("%Y-%m-%d"), "end_date": (init_dt + timedelta(days=14)).strftime("%Y-%m-%d")},
        {"week": 3, "days": "Days 15–21", "start_day": 15, "end_day": 21, "start_date": (init_dt + timedelta(days=15)).strftime("%Y-%m-%d"), "end_date": (init_dt + timedelta(days=21)).strftime("%Y-%m-%d")},
        {"week": 4, "days": "Days 22–28", "start_day": 22, "end_day": 28, "start_date": (init_dt + timedelta(days=22)).strftime("%Y-%m-%d"), "end_date": (init_dt + timedelta(days=28)).strftime("%Y-%m-%d")},
        {"week": "1-4", "days": "Days 1–28 (Full Subseasonal)", "start_day": 1, "end_day": 28, "start_date": (init_dt + timedelta(days=1)).strftime("%Y-%m-%d"), "end_date": (init_dt + timedelta(days=28)).strftime("%Y-%m-%d")}
    ]

    # Baseline synoptic pattern evolution across 4 weeks
    # E.g. Week 1: slight troughing or warm ridge, Week 2-3 transition
    base_t_bias = random.uniform(-1.8, 2.5)
    base_p_ratio = random.uniform(0.7, 1.4)
    if model_name == "ifs":
        # IFS slight divergence in Week 3-4
        model_t_offset = random.uniform(-0.6, 0.6)
        model_p_offset = random.uniform(-0.15, 0.15)
    else:
        model_t_offset = 0.0
        model_p_offset = 0.0

    products_by_week = {}

    for w_info in weeks:
        w_key = f"week_{w_info['week']}"
        w_num = w_info['week'] if isinstance(w_info['week'], int) else 2.5

        # Temperature anomaly parameters (°C and °F)
        wave_phase = (w_num * 0.7) + (0.3 if model_name == 'ifs' else 0.0)
        t_center_anomaly = (base_t_bias + model_t_offset) * math.cos(wave_phase)
        p_center_ratio = max(0.2, (base_p_ratio + model_p_offset) * (1.0 + 0.3 * math.sin(wave_phase + 1.2)))

        # Gridded fields
        grid_t2m_anom_c = []
        grid_t2m_mean_c = []
        grid_precip_anom_pct = []
        grid_precip_total_mm = []
        grid_soil_moist_anom = []
        grid_z500_anom = []

        # Seasonal baseline climatology for mid-Sep / early-Fall KY: ~68°F (20°C)
        clim_temp_c = 20.0 - (w_num * 0.8)  # Seasonal autumn cooling
        clim_precip_weekly_mm = 22.0 if isinstance(w_info['week'], int) else 88.0

        for lat in lats:
            row_t2m_anom = []
            row_t2m_mean = []
            row_p_anom = []
            row_p_tot = []
            row_soil = []
            row_z500 = []

            for lon in lons:
                # Spatial gradient across KY: West is generally warmer/wetter, East (mountains) cooler
                lat_grad = (lat - 37.8) * -0.6
                lon_grad = (lon - (-85.5)) * 0.35
                elev_effect = -1.2 if lon > -84.0 and lat < 38.0 else 0.0  # Cumberland plateau cooling

                # Add smooth regional spatial wave
                spatial_noise = 0.4 * math.sin(lat * 1.8 + lon * 2.1) + 0.2 * math.cos(lat * 3.2 - lon * 1.5)

                t_anom = round(t_center_anomaly + lat_grad * 0.4 + lon_grad * 0.3 + spatial_noise * (0.8 if w_num > 2 else 0.4), 2)
                t_mean = round(clim_temp_c + t_anom + elev_effect, 1)

                p_pct = round((p_center_ratio - 1.0) * 100.0 + (lon_grad * 25.0) + (spatial_noise * 20.0), 1)
                p_tot = round(max(0.0, clim_precip_weekly_mm * (1.0 + p_pct / 100.0)), 1)

                soil_anom = round(p_pct * 0.15 + (spatial_noise * 1.2), 2)
                z500_anom_m = round(t_anom * 14.5 + spatial_noise * 8.0, 1)

                row_t2m_anom.append(t_anom)
                row_t2m_mean.append(t_mean)
                row_p_anom.append(p_pct)
                row_p_tot.append(p_tot)
                row_soil.append(soil_anom)
                row_z500.append(z500_anom_m)

            grid_t2m_anom_c.append(row_t2m_anom)
            grid_t2m_mean_c.append(row_t2m_mean)
            grid_precip_anom_pct.append(row_p_anom)
            grid_precip_total_mm.append(row_p_tot)
            grid_soil_moist_anom.append(row_soil)
            grid_z500_anom.append(row_z500)

        # Calculate division aggregations
        division_stats = []
        for div in KY_CLIMATE_DIVISIONS:
            # Regional anomaly sample for division
            div_t_anom_c = round(t_center_anomaly + (div["center_lon"] + 85.5) * 0.3 + random.uniform(-0.3, 0.3), 2)
            div_t_anom_f = round(div_t_anom_c * 1.8, 2)
            div_p_pct = round((p_center_ratio - 1.0) * 100.0 + (div["center_lat"] - 37.5) * 8.0 + random.uniform(-6.0, 6.0), 1)
            div_p_anom_inches = round((clim_precip_weekly_mm / 25.4) * (div_p_pct / 100.0), 2)

            # Probabilities (Above Normal, Near Normal, Below Normal)
            if div_t_anom_c > 0.8:
                prob_t_above, prob_t_normal, prob_t_below = 62, 28, 10
            elif div_t_anom_c > 0.3:
                prob_t_above, prob_t_normal, prob_t_below = 48, 35, 17
            elif div_t_anom_c > -0.3:
                prob_t_above, prob_t_normal, prob_t_below = 25, 50, 25
            elif div_t_anom_c > -0.8:
                prob_t_above, prob_t_normal, prob_t_below = 18, 34, 48
            else:
                prob_t_above, prob_t_normal, prob_t_below = 9, 26, 65

            if div_p_pct > 25:
                prob_p_above, prob_p_normal, prob_p_below = 58, 30, 12
            elif div_p_pct > 5:
                prob_p_above, prob_p_normal, prob_p_below = 44, 38, 18
            elif div_p_pct > -10:
                prob_p_above, prob_p_normal, prob_p_below = 28, 46, 26
            else:
                prob_p_above, prob_p_normal, prob_p_below = 15, 30, 55

            division_stats.append({
                "id": div["id"],
                "name": div["name"],
                "code": div["code"],
                "temp_anomaly_c": div_t_anom_c,
                "temp_anomaly_f": div_t_anom_f,
                "precip_anomaly_pct": div_p_pct,
                "precip_anomaly_inches": div_p_anom_inches,
                "prob_temp": {"above": prob_t_above, "normal": prob_t_normal, "below": prob_t_below},
                "prob_precip": {"above": prob_p_above, "normal": prob_p_normal, "below": prob_p_below},
                "confidence": "High" if w_num == 1 else ("Medium" if w_num == 2 else ("Moderate" if w_num == 3 else "Low"))
            })

        # Station level forecasts
        station_forecasts = []
        for stn in KY_STATIONS:
            stn_t_anom_c = round(t_center_anomaly + (stn["lon"] + 85.5) * 0.28 + (stn["lat"] - 37.8) * -0.4 + random.uniform(-0.25, 0.25), 2)
            stn_t_anom_f = round(stn_t_anom_c * 1.8, 2)
            stn_t_mean_f = round((clim_temp_c + stn_t_anom_c) * 9.0 / 5.0 + 32.0, 1)
            stn_p_pct = round((p_center_ratio - 1.0) * 100.0 + random.uniform(-8.0, 8.0), 1)
            stn_p_inches = round((clim_precip_weekly_mm / 25.4) * (1.0 + stn_p_pct / 100.0), 2)

            station_forecasts.append({
                "id": stn["id"],
                "name": stn["name"],
                "division": stn["division"],
                "lat": stn["lat"],
                "lon": stn["lon"],
                "temp_anomaly_c": stn_t_anom_c,
                "temp_anomaly_f": stn_t_anom_f,
                "temp_mean_f": stn_t_mean_f,
                "precip_anomaly_pct": stn_p_pct,
                "precip_total_inches": stn_p_inches
            })

        products_by_week[w_key] = {
            "metadata": w_info,
            "grid": {
                "lats": lats,
                "lons": lons,
                "temp_anomaly_c": grid_t2m_anom_c,
                "temp_mean_c": grid_t2m_mean_c,
                "precip_anomaly_pct": grid_precip_anom_pct,
                "precip_total_mm": grid_precip_total_mm,
                "soil_moisture_anomaly": grid_soil_moist_anom,
                "z500_anomaly_m": grid_z500_anom
            },
            "divisions": division_stats,
            "stations": station_forecasts
        }

    # Generate 28-day daily meteograms for Louisville & Lexington
    daily_timeline = []
    for day in range(1, 29):
        day_date = (init_dt + timedelta(days=day)).strftime("%Y-%m-%d")
        week_num = min(4, (day - 1) // 7 + 1)
        w_factor = math.cos((week_num * 0.7))

        mean_t_c = round(clim_temp_c + (base_t_bias + model_t_offset) * w_factor + math.sin(day * 0.5) * 2.8, 1)
        mean_t_f = round(mean_t_c * 9/5 + 32, 1)
        t_spread = round(1.2 + day * 0.18, 1)  # Spread increases with lead time

        daily_precip_mm = round(max(0.0, random.choice([0, 0, 0, 1.2, 5.8, 14.2, 0]) * (p_center_ratio)), 1)
        daily_precip_in = round(daily_precip_mm / 25.4, 2)

        daily_timeline.append({
            "lead_day": day,
            "date": day_date,
            "temp_mean_f": mean_t_f,
            "temp_min_f": round(mean_t_f - t_spread * 1.8, 1),
            "temp_max_f": round(mean_t_f + t_spread * 1.8, 1),
            "precip_inches": daily_precip_in,
            "ensemble_spread_f": round(t_spread * 1.8, 1)
        })

    model_meta = {
        "aircast": {
            "name": "Aircast S2S",
            "type": "AI Neural Foundation Model",
            "resolution": "0.25° (~25km)",
            "ensemble_members": 100,
            "initial_condition": "NCEP GFS Analysis + ERA5 Reanalysis Calibration",
            "subseasonal_window": "42 Days (Weeks 1 to 6)",
            "calibration": "20-Year ERA5 Hindcast (2004-2023 Climatology)",
            "description": "High-fidelity AI subseasonal atmospheric model optimized for North American weather regimes and regional US anomaly guidance."
        },
        "ifs": {
            "name": "IFS S2S",
            "type": "ECMWF Integrated Forecasting System (Physics-Based)",
            "resolution": "0.25°/0.4° (~30km)",
            "ensemble_members": 51,
            "initial_condition": "ECMWF Operational 4D-Var Analysis",
            "subseasonal_window": "46 Days (Twice Weekly Cycle)",
            "calibration": "20-Year ECMWF Re-forecast Climatology",
            "description": "World-leading physics-based numerical ensemble system providing benchmark subseasonal circulation & precipitation guidance."
        }
    }

    return {
        "schema_version": "2.0",
        "model_id": model_name,
        "model_meta": model_meta[model_name],
        "issue_id": init_dt.strftime("%Y%m%d"),
        "initialization": init_dt.strftime("%Y-%m-%dT00:00:00Z"),
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "region": {
            "name": "Commonwealth of Kentucky, USA",
            "state_fips": "21",
            "bounds": KY_BOUNDS,
            "center": [37.8393, -85.2784]
        },
        "weeks": products_by_week,
        "daily_timeline": daily_timeline
    }


def main():
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.join(output_dir, "forecasts", "aircast"), exist_ok=True)
    os.makedirs(os.path.join(output_dir, "forecasts", "ifs"), exist_ok=True)

    today = datetime.now(timezone.utc)

    # Generate runs for recent cycles (e.g. today, 3 days ago, 7 days ago, 10 days ago, 14 days ago)
    cycle_dates = [
        (today).strftime("%Y-%m-%d"),
        (today - timedelta(days=3)).strftime("%Y-%m-%d"),
        (today - timedelta(days=7)).strftime("%Y-%m-%d"),
        (today - timedelta(days=10)).strftime("%Y-%m-%d"),
        (today - timedelta(days=14)).strftime("%Y-%m-%d")
    ]

    issues_index = []

    for d_str in cycle_dates:
        issue_id = d_str.replace("-", "")
        # Aircast S2S
        aircast_data = create_forecast_run(d_str, "aircast")
        aircast_path = os.path.join(output_dir, "forecasts", "aircast", f"{issue_id}.json")
        with open(aircast_path, "w") as f:
            json.dump(aircast_data, f, indent=2)

        # IFS S2S
        ifs_data = create_forecast_run(d_str, "ifs")
        ifs_path = os.path.join(output_dir, "forecasts", "ifs", f"{issue_id}.json")
        with open(ifs_path, "w") as f:
            json.dump(ifs_data, f, indent=2)

        issues_index.append({
            "id": issue_id,
            "date": d_str,
            "initialization": f"{d_str}T00:00:00Z",
            "is_latest": d_str == cycle_dates[0],
            "aircast_file": f"data/forecasts/aircast/{issue_id}.json",
            "ifs_file": f"data/forecasts/ifs/{issue_id}.json"
        })

    # Catalog & Domain metadata
    catalog = {
        "schema_version": "2.0",
        "title": "Kentucky S2S Research & Operational Subseasonal Dashboard",
        "author": "Manmeet Singh (manmeet3591)",
        "repository": "https://github.com/manmeet3591/kentucky_s2s",
        "domain": {
            "id": "kentucky",
            "name": "Commonwealth of Kentucky",
            "country": "United States",
            "bounding_box": [-89.6, 36.4, -81.9, 39.2],
            "center": [37.8393, -85.2784],
            "zoom": 7
        },
        "models": [
            {
                "id": "aircast",
                "label": "Aircast S2S",
                "badge": "AI Neural Foundation",
                "resolution": "0.25°",
                "members": 100,
                "color": "#06b6d4"
            },
            {
                "id": "ifs",
                "label": "IFS S2S",
                "badge": "ECMWF Physics Ensemble",
                "resolution": "0.25°",
                "members": 51,
                "color": "#ec4899"
            }
        ],
        "products": [
            {
                "id": "temp_anomaly",
                "label": "2m Temperature Anomaly",
                "unit_imperial": "°F",
                "unit_metric": "°C",
                "palette": "coolwarm",
                "range": [-6, 6],
                "description": "Departure of 7-day average 2-meter air temperature from the 20-year climatological baseline."
            },
            {
                "id": "precip_anomaly",
                "label": "Precipitation Anomaly (% of normal)",
                "unit_imperial": "%",
                "unit_metric": "%",
                "palette": "precip_anomaly",
                "range": [-60, 60],
                "description": "Weekly accumulated precipitation expressed as percent departure from normal."
            },
            {
                "id": "temp_mean",
                "label": "2m Mean Temperature",
                "unit_imperial": "°F",
                "unit_metric": "°C",
                "palette": "viridis",
                "range": [40, 85],
                "description": "Weekly mean 2-meter temperature."
            },
            {
                "id": "precip_total",
                "label": "Total Precipitation",
                "unit_imperial": "inches",
                "unit_metric": "mm",
                "palette": "ocean",
                "range": [0, 4.0],
                "description": "7-day total accumulated precipitation."
            },
            {
                "id": "soil_moisture_anomaly",
                "label": "Soil Moisture Anomaly (0-10cm)",
                "unit_imperial": "index",
                "unit_metric": "index",
                "palette": "soil",
                "range": [-3, 3],
                "description": "Root zone & upper layer soil moisture standardized anomaly."
            },
            {
                "id": "z500_anomaly",
                "label": "500 hPa Geopotential Height Anomaly",
                "unit_imperial": "gpm",
                "unit_metric": "gpm",
                "palette": "height",
                "range": [-80, 80],
                "description": "Mid-tropospheric ridge / trough synoptic patterns controlling Kentucky storm tracks."
            }
        ],
        "available_issues": issues_index,
        "latest_issue": issues_index[0],
        "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    }

    with open(os.path.join(output_dir, "catalog.json"), "w") as f:
        json.dump(catalog, f, indent=2)

    print(f"✅ Generated Kentucky S2S forecast datasets with {len(issues_index)} issue cycles in {output_dir}")


if __name__ == "__main__":
    main()
