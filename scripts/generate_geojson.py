#!/usr/bin/env python3
"""
Build Kentucky boundary GeoJSON layers for the Leaflet map.

Outputs (public/data/geography/):
  kentucky_outline.geojson    - state boundary (dissolved from counties)
  kentucky_counties.geojson   - 120 Kentucky counties
  kentucky_divisions.geojson  - 4 NOAA/NCEI climate divisions, built by
                                dissolving counties so division lines follow
                                county lines exactly

Sources:
  Counties: US Census cartographic boundary counties (plotly/datasets mirror,
            geojson-counties-fips.json)
  Climate divisions: NOAA NCEI GIS.OFFICIAL_CLIM_DIVISIONS shapefile, used only
            to assign each county to its division.

The committed GeoJSON files are static, so by default this script does nothing
when they already exist (the CI workflow calls it every cycle). Pass --rebuild
to regenerate them; that path needs `pip install shapely pyshp`.
"""

import argparse
import json
import os
import sys
import tempfile
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "data", "geography")
OUTPUTS = ["kentucky_outline.geojson", "kentucky_counties.geojson", "kentucky_divisions.geojson"]

COUNTIES_URL = "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json"
CLIMDIV_BASE = ("https://raw.githubusercontent.com/mcrimmins/ENSO_Precip_Explorer/HEAD/data/"
                "GIS.OFFICIAL_CLIM_DIVISIONS")

KY_FIPS = "21"

DIVISION_META = {
    1: {"id": "div1", "code": "KY-01", "name": "Western Kentucky",
        "subregion": "Jackson Purchase & Western Pennyrile",
        "description": "Paducah, Hopkinsville, Mayfield, Murray, Henderson", "color": "#3b82f6"},
    2: {"id": "div2", "code": "KY-02", "name": "Central Kentucky",
        "subregion": "Western Coalfield, Pennyrile & Knobs",
        "description": "Bowling Green, Owensboro, Elizabethtown, Glasgow", "color": "#10b981"},
    3: {"id": "div3", "code": "KY-03", "name": "Bluegrass",
        "subregion": "North Central Metro & Inner Bluegrass",
        "description": "Louisville, Lexington, Frankfort, Covington, Richmond", "color": "#8b5cf6"},
    4: {"id": "div4", "code": "KY-04", "name": "Eastern Kentucky",
        "subregion": "Cumberland Plateau & Eastern Coalfields",
        "description": "Pikeville, Hazard, Ashland, London, Morehead, Somerset", "color": "#f59e0b"},
}

SIMPLIFY_DEG = 0.0015   # ~150 m; keeps files small with no visible loss at state zoom
DECIMALS = 4


def _round(obj):
    if isinstance(obj, (list, tuple)):
        return [_round(o) for o in obj]
    return round(obj, DECIMALS)


def _feature(geom, props):
    from shapely.geometry import mapping
    g = mapping(geom)
    return {"type": "Feature", "properties": props,
            "geometry": {"type": g["type"], "coordinates": _round(g["coordinates"])}}


def _download(url, dest):
    with urllib.request.urlopen(url, timeout=120) as r, open(dest, "wb") as f:
        f.write(r.read())


def rebuild():
    import shapefile  # pyshp
    from shapely.geometry import shape
    from shapely.ops import unary_union

    tmp = tempfile.mkdtemp(prefix="ky_geo_")
    counties_path = os.path.join(tmp, "counties.json")
    _download(COUNTIES_URL, counties_path)
    for ext in ("shp", "shx", "dbf"):
        _download(f"{CLIMDIV_BASE}.{ext}", os.path.join(tmp, f"climdiv.{ext}"))

    with open(counties_path) as f:
        all_counties = json.load(f)["features"]
    ky = [c for c in all_counties if c["properties"]["STATE"] == KY_FIPS]

    divisions = {}
    for sr in shapefile.Reader(os.path.join(tmp, "climdiv")).iterShapeRecords():
        rec = sr.record.as_dict()
        if rec["STATE_FIPS"] == KY_FIPS:
            divisions[int(rec["CD_2DIG"])] = shape(sr.shape.__geo_interface__).buffer(0)
    if sorted(divisions) != [1, 2, 3, 4]:
        sys.exit(f"Unexpected Kentucky climate divisions: {sorted(divisions)}")

    county_feats, by_div = [], {d: [] for d in divisions}
    for c in sorted(ky, key=lambda c: c["properties"]["NAME"]):
        geom = shape(c["geometry"]).buffer(0)
        div = max(divisions, key=lambda d: divisions[d].intersection(geom).area)
        by_div[div].append(geom)
        p = c["properties"]
        county_feats.append(_feature(geom.simplify(SIMPLIFY_DEG, preserve_topology=True), {
            "name": f"{p['NAME']} County", "fips": f"{p['STATE']}{p['COUNTY']}",
            "division": DIVISION_META[div]["id"],
        }))

    div_feats = []
    for d in sorted(by_div):
        geom = unary_union(by_div[d]).buffer(0)
        div_feats.append(_feature(geom.simplify(SIMPLIFY_DEG, preserve_topology=True),
                                  {**DIVISION_META[d], "n_counties": len(by_div[d])}))

    state = unary_union([g for gs in by_div.values() for g in gs]).buffer(0)
    outline = [_feature(state.simplify(SIMPLIFY_DEG, preserve_topology=True),
                        {"name": "Kentucky State Boundary", "state": "Kentucky", "fips": KY_FIPS})]

    os.makedirs(OUT_DIR, exist_ok=True)
    for name, feats in zip(OUTPUTS, (outline, county_feats, div_feats)):
        with open(os.path.join(OUT_DIR, name), "w") as f:
            json.dump({"type": "FeatureCollection", "features": feats}, f, separators=(",", ":"))
    print(f"Wrote {len(county_feats)} counties, {len(div_feats)} divisions and state outline to {OUT_DIR}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--rebuild", action="store_true", help="re-download sources and regenerate all layers")
    args = ap.parse_args()

    missing = [n for n in OUTPUTS if not os.path.exists(os.path.join(OUT_DIR, n))]
    if not args.rebuild and not missing:
        print("Kentucky boundary GeoJSON already present; nothing to do (use --rebuild to regenerate).")
        return
    rebuild()


if __name__ == "__main__":
    main()
