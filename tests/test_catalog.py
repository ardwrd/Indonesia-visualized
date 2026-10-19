"""Dataset integrity, metadata, and known values from linked official BPS tables."""
import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
class CatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data=json.loads((ROOT/'data/catalog-2024-2025.json').read_text(encoding='utf-8'))
        cls.ind=cls.data['indicators']

    def test_coverage(self):
        self.assertEqual(len(self.ind),11)
        for key,ind in self.ind.items():
            self.assertIn(ind['category'],self.data['categories'])
            self.assertTrue(ind['source'].startswith('https://www.bps.go.id/'),key)
            for year,period in ind['periods'].items():
                self.assertEqual(int(year),period['year'])
                self.assertEqual(len(period['values']),38,(key,year))
                self.assertEqual(len(set(period['values'])),38)
                self.assertTrue(all(isinstance(v,(float,int)) for v in period['values'].values()))
                self.assertFalse(any(v is None for v in period['values'].values()))

    def test_known_numbers(self):
        self.assertEqual(self.ind['population_total']['periods']['2025']['values']['33'],38233.9)
        self.assertEqual(self.ind['human_development_index']['periods']['2025']['values']['31'],85.05)
        self.assertEqual(self.ind['human_development_index']['periods']['2024']['values']['97'],54.43)
        self.assertEqual(self.ind['unemployment_aug']['periods']['2025']['values']['32'],6.77)
        self.assertEqual(self.ind['participation_aug']['periods']['2025']['values']['97'],90.66)
        self.assertEqual(self.ind['mean_school_years']['periods']['2025']['values']['97'],4.76)
        self.assertEqual(self.ind['life_expectancy_male']['periods']['2025']['values']['97'],65.62)
        self.assertEqual(self.ind['grdp_current']['periods']['2025']['values']['31'],3926153.30)
        self.assertEqual(self.ind['grdp_per_capita']['periods']['2025']['values']['31'],367687)

    def test_year_specificity(self):
        self.assertEqual(set(self.ind['grdp_current']['periods']),{'2024','2025'})
        self.assertEqual(set(self.ind['mean_school_years']['periods']),{'2025'})
        self.assertEqual(set(self.ind['unemployment_feb']['periods']),{'2025'})
        self.assertEqual(sum(len(v['periods']) for v in self.ind.values()),14)

    def test_source_metadata(self):
        self.assertIn('tidak setara',self.ind['grdp_per_capita']['description'].lower())
        self.assertIn('Sakernas',self.ind['unemployment_aug']['description'])
        self.assertIn('15',self.ind['mean_school_years']['label'])
        self.assertIn('sangat sementara',self.ind['grdp_current']['notes'])

if __name__=='__main__':unittest.main()