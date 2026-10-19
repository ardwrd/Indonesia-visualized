"""Check map source coordinates and the statistical province join.

Run after cloning this repo: python -m unittest test_data test_map_geometry
"""
import json
import math
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parent


def normalize(name):
    import re
    name = name.casefold().replace('daerah istimewa yogyakarta', 'di yogyakarta')
    return re.sub(r'[^a-z0-9]', '', name)


def points(coords):
    if coords and isinstance(coords[0], (float, int)):
        yield coords
    else:
        for x in coords:
            yield from points(x)


class MapGeometryTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.geo = json.loads((ROOT / 'data/indonesia-38-provinces.geojson').read_text())
        cls.records = json.loads((ROOT / 'data/poverty-2025.json').read_text())['provinces']

    def test_all_provinces_match(self):
        names = {normalize(p['name']) for p in self.records}
        map_names = [normalize(f['properties']['PROVINSI']) for f in self.geo['features']]
        self.assertEqual(38, len(map_names))
        self.assertEqual(38, len(set(map_names)))
        self.assertEqual(names, set(map_names))

    def test_geometries_within_indonesia_and_valid(self):
        for feature in self.geo['features']:
            geom = feature['geometry']
            self.assertIn(geom['type'], ('Polygon', 'MultiPolygon'))
            flat = list(points(geom['coordinates']))
            self.assertTrue(flat)
            for lon, lat in flat:
                self.assertTrue(math.isfinite(lon) and math.isfinite(lat))
                self.assertTrue(94 < lon < 143 and -12 < lat < 7)

    def test_coordinates_fit_entire_svg(self):
        # Equivalent viewBox fit used by app.js (no D3 winding dependency).
        xy = [p for f in self.geo['features'] for p in points(f['geometry']['coordinates'])]
        west, east = min(x[0] for x in xy), max(x[0] for x in xy)
        south, north = min(x[1] for x in xy), max(x[1] for x in xy)
        scale = min((1000 - 56) / (east - west), (445 - 48) / (north - south))
        left, top = (1000 - (east - west) * scale) / 2, (445 - (north - south) * scale) / 2
        self.assertGreaterEqual(left, 0)
        self.assertGreaterEqual(top, 0)
        self.assertLessEqual(left + (east - west) * scale, 1000)
        self.assertLessEqual(top + (north - south) * scale, 445)


if __name__ == '__main__':
    unittest.main()