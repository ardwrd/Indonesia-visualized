import json, pathlib, statistics, unittest
P = pathlib.Path(__file__).parent
class DataTests(unittest.TestCase):
  @classmethod
  def setUpClass(cls): cls.data=json.loads((P/'data/poverty-2025.json').read_text())
  def test_38_unique_provinces(self):
    p=self.data['provinces']
    self.assertEqual(len(p),38)
    self.assertEqual(len({i['name'].lower() for i in p}),38)
    self.assertEqual(len({i['code'] for i in p}),38)
  def test_positive_values(self):
    for row in self.data['provinces']:
      for metric in ('poverty_rate','poor_population_thousand','poverty_gap','poverty_severity','poverty_line'):
        self.assertGreater(row[metric],0)
  def test_known_source_values(self):
    index={row['name']:row for row in self.data['provinces']}
    self.assertEqual(index['Jawa Tengah']['poverty_rate'],9.48)
    self.assertEqual(index['Papua Pegunungan']['poverty_rate'],30.03)
    self.assertEqual(index['Bali']['poverty_rate'],3.72)
    self.assertEqual(index['Papua Pegunungan']['poverty_line'],1132178)
  def test_median_province_not_national(self):
    median=statistics.median(r['poverty_rate'] for r in self.data['provinces'])
    self.assertGreater(median,0)
    self.assertLess(median,30.03)
if __name__=='__main__':unittest.main()