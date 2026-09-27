#!/usr/bin/env python3
"""
Generate Kentucky State & Climate Division GeoJSON geometries
for client-side Leaflet visualization.
"""

import json
import os

# Simplified but geometrically accurate Kentucky perimeter and 4 Climate Divisions
# KY bounds roughly: 36.4°N to 39.15°N, -89.57°W to -81.96°W

DIVISIONS_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "id": "div1",
                "code": "KY-01",
                "name": "Western Kentucky",
                "subregion": "Jackson Purchase & Western Pennyrile",
                "description": "Paducah, Hopkinsville, Mayfield, Murray, Henderson",
                "color": "#3b82f6"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-89.57, 36.50],
                    [-89.15, 36.50],
                    [-88.05, 36.50],
                    [-87.10, 36.65],
                    [-87.10, 37.50],
                    [-87.45, 37.92],
                    [-88.02, 37.85],
                    [-88.35, 37.50],
                    [-88.75, 37.15],
                    [-89.15, 37.00],
                    [-89.57, 36.98],
                    [-89.57, 36.50]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "id": "div2",
                "code": "KY-02",
                "name": "Central Kentucky",
                "subregion": "Western Coalfield, Pennyrile & Knobs",
                "description": "Bowling Green, Owensboro, Elizabethtown, Glasgow",
                "color": "#10b981"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-87.10, 36.65],
                    [-85.35, 36.60],
                    [-85.20, 37.40],
                    [-85.50, 37.95],
                    [-86.10, 38.00],
                    [-86.80, 37.95],
                    [-87.10, 37.88],
                    [-87.45, 37.92],
                    [-87.10, 37.50],
                    [-87.10, 36.65]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "id": "div3",
                "code": "KY-03",
                "name": "Bluegrass",
                "subregion": "North Central Metro & Inner Bluegrass",
                "description": "Louisville, Lexington, Frankfort, Covington, Richmond",
                "color": "#8b5cf6"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-85.50, 37.95],
                    [-85.20, 37.40],
                    [-84.00, 37.50],
                    [-83.70, 38.20],
                    [-84.05, 38.65],
                    [-84.35, 38.80],
                    [-84.75, 39.14],
                    [-85.40, 38.60],
                    [-85.80, 38.30],
                    [-86.10, 38.00],
                    [-85.50, 37.95]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "id": "div4",
                "code": "KY-04",
                "name": "Eastern Kentucky",
                "subregion": "Cumberland Plateau & Eastern Coalfields",
                "description": "Pikeville, Hazard, Ashland, London, Morehead, Somerset",
                "color": "#f59e0b"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-85.35, 36.60],
                    [-84.15, 36.60],
                    [-83.00, 36.60],
                    [-82.60, 37.20],
                    [-81.96, 37.55],
                    [-82.40, 38.10],
                    [-82.55, 38.45],
                    [-82.90, 38.65],
                    [-83.70, 38.20],
                    [-84.00, 37.50],
                    [-85.20, 37.40],
                    [-85.35, 36.60]
                ]]
            }
        }
    ]
}

# Kentucky Outer Boundary
KY_OUTLINE_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "Kentucky State Boundary",
                "state": "Kentucky",
                "fips": "21"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-89.57, 36.50],
                    [-88.05, 36.50],
                    [-84.15, 36.60],
                    [-83.00, 36.60],
                    [-82.60, 37.20],
                    [-81.96, 37.55],
                    [-82.55, 38.45],
                    [-82.90, 38.65],
                    [-84.05, 38.65],
                    [-84.75, 39.14],
                    [-85.40, 38.60],
                    [-85.80, 38.30],
                    [-86.80, 37.95],
                    [-88.02, 37.85],
                    [-88.75, 37.15],
                    [-89.57, 36.98],
                    [-89.57, 36.50]
                ]]
            }
        }
    ]
}

def main():
    out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data", "geography")
    os.makedirs(out_dir, exist_ok=True)
    
    with open(os.path.join(out_dir, "kentucky_divisions.geojson"), "w") as f:
        json.dump(DIVISIONS_GEOJSON, f, indent=2)
        
    with open(os.path.join(out_dir, "kentucky_outline.geojson"), "w") as f:
        json.dump(KY_OUTLINE_GEOJSON, f, indent=2)
        
    print("✅ Created Kentucky GeoJSON files in public/data/geography")

if __name__ == "__main__":
    main()
