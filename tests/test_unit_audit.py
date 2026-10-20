"""Regression checks for audited BPS units and economic cross-series consistency."""
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

class UnitAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads((ROOT / "data/catalog-2024-2025.json").read_text(encoding="utf-8"))
        cls.ind = cls.catalog["indicators"]

    def test_original_bps_units_are_preserved(self):
        expected = {
            "population_total": "ribu jiwa",
            "grdp_current": "miliar Rp",
            "grdp_per_capita": "ribu Rp",
            "human_development_index": "indeks",
            "unemployment_aug": "%",
            "participation_aug": "%",
            "mean_school_years": "tahun",
            "life_expectancy_male": "tahun",
        }
        for key, unit in expected.items():
            with self.subTest(indicator=key):
                self.assertEqual(self.ind[key]["unit"], unit)

    def test_economic_totals_are_consistent_across_all_38_provinces(self):
        population = self.ind["population_total"]["periods"]["2025"]["values"]
        grdp = self.ind["grdp_current"]["periods"]["2025"]["values"]
        per_capita = self.ind["grdp_per_capita"]["periods"]["2025"]["values"]
        self.assertEqual(len(population), len(grdp))
        self.assertEqual(set(population), set(grdp))
        self.assertEqual(set(population), set(per_capita))
        # (miliar Rp / ribu jiwa) * 1000 => ribu Rp per person.
        # Allow a 0.1% tolerance for independently rounded BPS tables.
        for province in population:
            expected = grdp[province] * 1000 / population[province]
            actual = per_capita[province]
            with self.subTest(province=province):
                self.assertLess(abs(expected - actual) / actual, 0.001)

    def test_display_conversion_examples(self):
        jakarta_grdp = self.ind["grdp_current"]["periods"]["2025"]["values"]["31"]
        jakarta_capita = self.ind["grdp_per_capita"]["periods"]["2025"]["values"]["31"]
        west_java_population = self.ind["population_total"]["periods"]["2025"]["values"]["32"]
        self.assertEqual(round(jakarta_grdp / 1000, 2), 3926.15)
        self.assertEqual(round(jakarta_capita / 1000, 2), 367.69)
        self.assertEqual(round(west_java_population / 1000, 2), 50.76)

    def test_source_year_is_not_lost_in_csv_export(self):
        app = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("period.source??d.source", app)
        self.assertIn("number.format(value/1000)", app)
        self.assertIn("'triliun rupiah'", app)
        self.assertIn("'juta rupiah/kapita/tahun'", app)

if __name__ == "__main__":
    unittest.main()
