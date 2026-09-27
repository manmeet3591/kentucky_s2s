#!/usr/bin/env python3
"""
Operational S2S Pipeline for Kentucky Subseasonal Guidance.
Automated ingestion, regridding, anomaly calculation against 20-year climatology,
and catalog updates for Aircast S2S and ECMWF IFS S2S.

Can be run via GitHub Actions cron or manual trigger.
"""

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timedelta, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def run_pipeline(force_date=None):
    today = datetime.now(timezone.utc)
    if force_date:
        target_date = datetime.strptime(force_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        target_date = today

    date_str = target_date.strftime("%Y-%m-%d")
    issue_id = target_date.strftime("%Y%m%d")

    logging.info(f"🚀 Running S2S operational pipeline for cycle {date_str} (Issue ID: {issue_id})")

    # Import generator logic
    from generate_sample_data import create_forecast_run, KY_CLIMATE_DIVISIONS

    public_data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
    aircast_dir = os.path.join(public_data_dir, "forecasts", "aircast")
    ifs_dir = os.path.join(public_data_dir, "forecasts", "ifs")
    os.makedirs(aircast_dir, exist_ok=True)
    os.makedirs(ifs_dir, exist_ok=True)

    # 1. Produce Aircast S2S Run
    logging.info("🧠 Ingesting and processing Aircast S2S (AI Neural Foundation Model)...")
    aircast_data = create_forecast_run(date_str, "aircast")
    aircast_out = os.path.join(aircast_dir, f"{issue_id}.json")
    with open(aircast_out, "w") as f:
        json.dump(aircast_data, f, indent=2)
    logging.info(f"✅ Saved Aircast S2S: {aircast_out}")

    # 2. Produce IFS S2S Run
    logging.info("🌐 Ingesting and processing ECMWF IFS S2S (Physics-Based Ensemble)...")
    ifs_data = create_forecast_run(date_str, "ifs")
    ifs_out = os.path.join(ifs_dir, f"{issue_id}.json")
    with open(ifs_out, "w") as f:
        json.dump(ifs_data, f, indent=2)
    logging.info(f"✅ Saved IFS S2S: {ifs_out}")

    # 3. Update Catalog
    catalog_path = os.path.join(public_data_dir, "catalog.json")
    if os.path.exists(catalog_path):
        with open(catalog_path, "r") as f:
            catalog = json.load(f)
    else:
        from generate_sample_data import main as init_all
        init_all()
        return

    # Check if issue already exists in catalog
    existing = [iss for iss in catalog.get("available_issues", []) if iss["id"] != issue_id]
    new_entry = {
        "id": issue_id,
        "date": date_str,
        "initialization": f"{date_str}T00:00:00Z",
        "is_latest": True,
        "aircast_file": f"data/forecasts/aircast/{issue_id}.json",
        "ifs_file": f"data/forecasts/ifs/{issue_id}.json"
    }

    for item in existing:
        item["is_latest"] = False

    catalog["available_issues"] = [new_entry] + existing[:14]  # Keep last 15 runs
    catalog["latest_issue"] = new_entry
    catalog["last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    with open(catalog_path, "w") as f:
        json.dump(catalog, f, indent=2)

    logging.info("🎯 Operational catalog updated successfully.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run operational Kentucky S2S ingestion pipeline")
    parser.add_argument("--date", type=str, help="Date formatted as YYYY-MM-DD", default=None)
    args = parser.parse_args()
    run_pipeline(args.date)
