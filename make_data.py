import csv,json, pathlib
root=pathlib.Path(__file__).parent
# Data: Pusdatin Kementerian Pertanian, caching BPS variables 619, 621-624, 2025 (Maret).
# Province order and values transcribed from official government tables, preserving decimal precision.
rows='''11|Aceh|12.33|704.69|1.84|0.42|676247
12|Sumatera Utara|7.36|1140.25|1.13|0.26|666546
13|Sumatera Barat|5.35|312.35|0.74|0.16|729806
14|Riau|6.16|460.96|0.87|0.20|713117
15|Jambi|7.19|270.94|0.98|0.20|664127
16|Sumatera Selatan|10.15|919.60|1.64|0.37|581702
17|Bengkulu|12.08|252.97|1.83|0.38|683820
18|Lampung|10.00|887.02|1.54|0.34|612451
19|Kepulauan Bangka Belitung|5.00|77.71|0.65|0.14|956833
21|Kepulauan Riau|4.44|117.28|0.69|0.18|832410
31|DKI Jakarta|4.28|464.87|0.57|0.11|852768
32|Jawa Barat|7.02|3654.74|1.17|0.29|547752
33|Jawa Tengah|9.48|3366.69|1.56|0.35|537812
34|DI Yogyakarta|10.23|425.82|1.59|0.34|626363
35|Jawa Timur|9.50|3875.88|1.41|0.29|558029
36|Banten|5.63|772.78|0.85|0.21|684232
51|Bali|3.72|173.24|0.56|0.12|607847
52|Nusa Tenggara Barat|11.78|654.57|1.76|0.36|556846
53|Nusa Tenggara Timur|18.60|1088.78|3.35|0.84|549607
61|Kalimantan Barat|6.16|330.95|0.86|0.18|622882
62|Kalimantan Tengah|5.19|147.80|0.83|0.19|654066
63|Kalimantan Selatan|3.84|172.72|0.47|0.10|650675
64|Kalimantan Timur|5.17|199.71|0.88|0.22|866193
65|Kalimantan Utara|5.54|42.57|0.75|0.29|884970
71|Sulawesi Utara|6.71|173.84|1.11|0.26|530304
72|Sulawesi Tengah|10.92|356.19|2.21|0.61|624854
73|Sulawesi Selatan|7.60|698.13|1.40|0.35|477966
74|Sulawesi Tenggara|10.54|304.43|1.89|0.45|488171
75|Gorontalo|13.24|162.74|1.96|0.44|495576
76|Sulawesi Barat|10.41|152.31|1.71|0.41|475488
81|Maluku|15.38|287.76|2.95|0.80|757600
82|Maluku Utara|5.81|77.27|0.95|0.22|662397
91|Papua Barat|20.66|106.90|4.17|1.18|831001
92|Papua Barat Daya|17.95|103.57|4.53|1.72|812630
94|Papua|19.16|171.38|4.58|1.49|714365
95|Papua Selatan|19.71|105.53|4.23|1.14|566052
96|Papua Tengah|28.90|302.31|5.58|1.52|817834
97|Papua Pegunungan|30.03|337.32|5.62|1.44|1132178'''
provinces=[]
for line in rows.splitlines():
  code,name,p0,count,p1,p2,poverty_line=line.split('|')
  provinces.append(dict(code=code,name=name,poverty_rate=float(p0),poor_population_thousand=float(count),poverty_gap=float(p1),poverty_severity=float(p2),poverty_line=int(poverty_line)))
assert len(provinces)==38 and len({p['code'] for p in provinces})==38
payload={
 'title':'Indikator Kemiskinan Menurut Provinsi',
 'year':2025,'period':'Maret 2025','coverage':'38 provinsi',
 'notes':'Snapshot indikator kemiskinan Maret 2025; bukan data real-time. Angka jumlah penduduk miskin dinyatakan dalam ribu jiwa.',
 'sources':{
  'poverty_rate':'https://siperditan.pertanian.go.id/kemiskinan/persentase_bps.php',
  'poor_population_thousand':'https://siperditan.pertanian.go.id/kemiskinan/kemiskinan_bps.php',
  'poverty_gap':'https://siperditan.pertanian.go.id/kemiskinan/indeks_kedalaman_bps.php',
  'poverty_severity':'https://siperditan.pertanian.go.id/kemiskinan/indeks_keparahan_bps.php',
  'poverty_line':'https://siperditan.pertanian.go.id/kemiskinan/garis_kemiskinan_bps.php',
  'bps_original':'https://www.bps.go.id/id/statistics-table/3/UkVkWGJVZFNWakl6VWxKVFQwWjVWeTlSZDNabVFUMDkjMw%3D%3D/jumlah-dan-persentase-penduduk-miskin-menurut-provinsi--2024.html?year=2025',
 },
 'provinces':provinces
}
(root/'data'/'poverty-2025.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
with (root/'data'/'poverty-2025.csv').open('w',encoding='utf-8-sig',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=provinces[0].keys());writer.writeheader();writer.writerows(provinces)
print('Created',len(provinces),'provinces; files:',(root/'data'/'poverty-2025.json').stat().st_size)