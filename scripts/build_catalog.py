"""Reproducible source transcriptions of 38-province BPS tables, validated on build.

Entries are ordered according to PROVINCES below. Decimal separator in this script is '.'.
Never infer values across years, regions, or units.
"""
from pathlib import Path
import json

PROVINCES = [
 ('11','Aceh'),('12','Sumatera Utara'),('13','Sumatera Barat'),('14','Riau'),('15','Jambi'),('16','Sumatera Selatan'),('17','Bengkulu'),('18','Lampung'),('19','Kepulauan Bangka Belitung'),('21','Kepulauan Riau'),('31','DKI Jakarta'),('32','Jawa Barat'),('33','Jawa Tengah'),('34','DI Yogyakarta'),('35','Jawa Timur'),('36','Banten'),('51','Bali'),('52','Nusa Tenggara Barat'),('53','Nusa Tenggara Timur'),('61','Kalimantan Barat'),('62','Kalimantan Tengah'),('63','Kalimantan Selatan'),('64','Kalimantan Timur'),('65','Kalimantan Utara'),('71','Sulawesi Utara'),('72','Sulawesi Tengah'),('73','Sulawesi Selatan'),('74','Sulawesi Tenggara'),('75','Gorontalo'),('76','Sulawesi Barat'),('81','Maluku'),('82','Maluku Utara'),('91','Papua Barat'),('92','Papua Barat Daya'),('94','Papua'),('95','Papua Selatan'),('96','Papua Tengah'),('97','Papua Pegunungan')
]
assert len(PROVINCES)==38 and len({code for code,_ in PROVINCES})==38

# Values transcribed from the linked BPS statistics tables, in province order.
# Population unit: thousand people; 2025 based on BPS 2025 projection.
POP_2024='5554.8 15588.5 5836.2 6728.1 3724.3 8837.3 2112.2 9419.6 1531.5 2183.3 10684.9 50345.2 37892.3 3759.5 41814.5 12431.4 4433.3 5646.0 5656.0 5695.5 2809.7 4273.4 4045.9 739.8 2701.8 3121.8 9463.4 2793.1 1227.8 1503.2 1945.6 1355.6 578.7 627.1 1060.6 542.1 1472.9 1467.0'
POP_2025='5626.0 15785.8 5914.3 6811.2 3768.5 8928.5 2138.0 9522.9 1550.8 2213.5 10678.0 50759.0 38233.9 3781.5 42089.3 12537.4 4461.3 5731.1 5742.6 5766.0 2845.0 4323.3 4267.6 749.4 2721.4 3156.1 9563.1 2836.7 1242.2 1525.3 1970.6 1373.8 587.6 636.4 1073.6 549.7 1492.3 1484.9'

IPM_2024='75.36 75.76 76.43 75.67 74.36 73.84 74.91 73.13 74.55 79.89 84.15 74.92 73.87 81.62 75.35 76.35 78.63 73.10 69.14 71.19 74.28 75.19 78.79 73.41 75.68 72.24 75.18 73.62 72.01 70.46 73.40 71.84 67.69 69.65 73.83 68.86 60.25 54.43'
IPM_2025='76.23 76.47 77.27 76.31 75.13 74.76 75.68 73.98 75.26 80.53 85.05 75.90 74.77 82.48 76.13 77.25 79.37 73.97 69.89 72.09 74.86 76.10 79.39 74.04 76.32 72.82 75.92 74.25 72.62 71.16 74.09 72.52 68.48 70.55 74.69 69.54 60.64 54.91'

# Sakernas 2025, February / August TPT, February / August TPAK.
TPT_FEB_2025='5.50 5.05 5.69 4.12 4.48 3.89 3.24 4.07 4.17 6.89 6.18 6.74 4.33 3.18 3.61 6.64 1.58 3.22 3.23 4.23 3.47 3.94 5.33 3.90 6.03 3.02 4.96 3.27 3.12 3.17 5.95 4.26 4.21 6.61 6.92 4.90 3.55 1.68'
TPT_AUG_2025='5.64 5.32 5.62 4.16 4.26 3.69 3.41 4.21 4.45 6.45 6.05 6.77 4.66 3.46 3.88 6.69 1.49 3.06 3.31 4.82 3.97 4.16 5.18 3.85 5.99 2.92 4.21 3.31 3.42 2.86 6.27 4.55 4.55 6.85 6.96 4.04 3.62 1.68'
TPAK_FEB_2025='65.63 70.13 70.95 64.68 67.11 70.56 71.50 71.16 67.67 66.84 65.40 68.91 73.17 73.73 74.25 65.82 77.40 76.50 75.81 67.64 69.90 70.41 66.40 69.19 65.30 70.51 65.99 69.77 67.52 71.81 67.56 68.99 71.45 68.14 70.38 68.15 78.97 88.27'
TPAK_AUG_2025='65.32 72.29 71.34 66.55 68.37 69.88 71.78 70.44 69.38 68.23 64.75 66.99 74.36 74.74 73.98 64.66 77.31 76.11 75.55 70.90 68.40 69.93 66.58 69.55 67.21 72.40 67.65 71.67 69.29 74.25 66.66 69.57 69.55 68.10 63.98 67.37 73.89 90.66'

RLS_2025='10.42 10.29 10.03 9.80 9.32 9.28 9.71 9.00 9.09 10.78 11.58 9.46 8.62 10.58 8.81 9.82 10.07 8.87 8.88 8.54 9.36 9.17 10.30 9.69 10.10 9.38 9.38 9.90 8.78 8.91 10.63 9.78 9.90 10.60 10.65 8.87 6.27 4.76'

UHH_MALE_2025='71.32 71.78 72.10 72.13 71.91 72.03 71.39 72.12 71.96 72.73 73.39 72.78 73.36 73.73 72.64 72.62 72.72 70.64 70.21 71.84 71.67 71.97 73.44 71.45 71.94 69.17 71.75 70.10 69.13 69.50 69.10 69.53 66.82 68.39 68.85 66.78 66.44 65.62'
UHH_FEMALE_2025='75.75 76.72 77.40 77.47 77.00 77.25 75.90 77.43 77.10 78.33 79.29 78.42 78.07 78.54 78.21 78.18 78.33 74.66 74.21 76.84 76.48 77.13 77.35 76.02 77.06 73.13 76.66 74.11 73.09 73.47 73.05 73.50 70.79 72.32 72.79 70.75 70.42 69.59'

PDRB_2024='243202.15 1146919.76 333145.84 1112481.62 323174.33 663961.72 103991.93 484042.52 107503.18 352436.43 3679708.72 2823451.79 1817710.82 193561.94 3168295.58 873626.25 298439.56 182265.62 137458.48 300166.89 222864.50 286840.06 858193.71 146976.70 187374.29 376950.32 696252.76 189481.75 54559.65 64214.65 62647.51 96949.45 76177.48 37040.34 85914.33 33403.64 174942.95 26561.43'
PDRB_2025='257502.43 1236193.57 352189.40 1201383.76 349662.60 720205.22 111829.42 523846.54 116811.75 381729.88 3926153.30 3038667.95 1943187.66 208133.80 3403166.85 936203.98 324148.94 192951.54 148373.38 328569.51 241055.70 305126.93 889072.55 156025.74 204747.14 415477.22 753077.16 204333.57 58977.51 71162.44 66313.12 133620.32 81807.57 39219.64 90513.18 35687.86 160519.15 28377.77'
PDRB_CAP_2025='45770 78310 59549 176385 92786 80663 52305 55009 75323 172459 367687 59865 50824 55039 80856 74673 72658 33667 25837 56984 84730 70577 208331 208210 75235 131643 78748 72031 47477 46654 33652 97262 139213 61624 84305 64928 107566 19111'

SOURCE={
 'population':'https://www.bps.go.id/id/statistics-table/3/V1ZSbFRUY3lTbFpEYTNsVWNGcDZjek53YkhsNFFUMDkjMw%3D%3D/penduduk-laju-pertumbuhan-penduduk-distribusi-persentase-penduduk-kepadatan-penduduk-rasio-jenis-kelamin-penduduk-menurut-provinsi.html?year=2025',
 'ipm':'https://www.bps.go.id/id/statistics-table/3/V25GaFNHaExaMnhITm1sWmRrUlJZelJzYUc1SGR6MDkjMw%3D%3D/indeks-pembangunan-manusia-menurut-provinsi--2014.html',
 'labor':'https://www.bps.go.id/id/statistics-table/3/V2pOVWJWcHJURGg0U2pONFJYaExhVXB0TUhacVFUMDkjMw%3D%3D/tingkat-pengangguran-terbuka--tpt--dan-tingkat-partisipasi-angkatan-kerja--tpak--menurut-provinsi--2017.html',
 'school':'https://www.bps.go.id/id/statistics-table/2/MTQyOSMy/penerimaan-daerah-menurut-sumber.html',
 'life':'https://www.bps.go.id/id/statistics-table/2/MjI3MyMy/angka-harapan-hidup--ahh--menurut-provinsi-dan-jenis-kelamin--menggunakan-uhh-hasilsp2020lf-.html',
 'pdrb':'https://www.bps.go.id/id/statistics-table/3/WkdVMWRYVnBkMnBvVEhKSVkyWXhNblZtTjJSbmR6MDkjMw%3D%3D/produk-domestik-regional-bruto-atas-dasar-harga-berlaku---menurut-provinsi--miliar-rupiah---2023.html',
 'pdrb_cap':'https://www.bps.go.id/id/statistics-table/3/YWtoQlRVZzNiMU5qU1VOSlRFeFZiRTR4VDJOTVVUMDkjMw%3D%3D/produk-domestik-regional-bruto-per-kapita-atas-dasar-harga-berlaku-menurut-provinsi--ribu-rupiah---2018.html',
}

def entries(values, label):
    vals=[float(x) for x in values.split()]
    if len(vals)!=38:raise ValueError(f'{label}: expected 38 values, got {len(vals)}')
    if any(not (0<=v<10000000) for v in vals):raise ValueError(f'{label}: unexpected numeric range')
    return dict(zip((p[0] for p in PROVINCES), vals))

def metric(category,label,unit,description,source,periods,notes=''):
    return dict(category=category,label=label,unit=unit,description=description,source=SOURCE[source],periods=periods,notes=notes)

def period(values, year, label, source=None):
    row={'year':year,'label':label,'values':entries(values,label)}
    if source:row['source']=source
    return row

CATEGORIES={
    'poverty':'Kemiskinan','population':'Kependudukan','human':'Pembangunan manusia',
    'labor':'Ketenagakerjaan','education':'Pendidikan','health':'Kesehatan','economy':'Ekonomi'
}
CATALOG={
 'population_total':metric('population','Jumlah penduduk','ribu jiwa','Proyeksi jumlah penduduk menurut provinsi; satuan ribu jiwa.','population',{'2024':period(POP_2024,2024,'2024',SOURCE['population'].replace('year=2025','year=2024')),'2025':period(POP_2025,2025,'2025')},
    'Proyeksi penduduk, bukan hasil sensus langsung.'),
 'human_development_index':metric('human','Indeks Pembangunan Manusia (IPM)','indeks','Indeks komposit kesehatan, pendidikan, dan standar hidup layak.','ipm',{'2024':period(IPM_2024,2024,'2024',SOURCE['ipm']+'?year=2024'),'2025':period(IPM_2025,2025,'2025')},
    'Gunakan seri baru dengan UHH hasil Long Form SP2020, bukan seri IPM metode lama.'),
 'unemployment_feb':metric('labor','Tingkat pengangguran terbuka — Februari','%','Persentase penganggur dalam angkatan kerja; Sakernas Februari.','labor',{'2025':period(TPT_FEB_2025,2025,'Februari 2025')}),
 'unemployment_aug':metric('labor','Tingkat pengangguran terbuka — Agustus','%','Persentase penganggur dalam angkatan kerja; Sakernas Agustus.','labor',{'2025':period(TPT_AUG_2025,2025,'Agustus 2025')}),
 'participation_feb':metric('labor','Tingkat partisipasi angkatan kerja — Februari','%','Persentase penduduk usia kerja dalam angkatan kerja; Sakernas Februari.','labor',{'2025':period(TPAK_FEB_2025,2025,'Februari 2025')}),
 'participation_aug':metric('labor','Tingkat partisipasi angkatan kerja — Agustus','%','Persentase penduduk usia kerja dalam angkatan kerja; Sakernas Agustus.','labor',{'2025':period(TPAK_AUG_2025,2025,'Agustus 2025')}),
 'mean_school_years':metric('education','Rata-rata lama sekolah (usia 15+)','tahun','Rata-rata tahun sekolah formal yang telah ditempuh penduduk usia 15 tahun ke atas.','school',{'2025':period(RLS_2025,2025,'2025')},'BPS Susenas; bukan RLS penduduk usia 25+ yang digunakan dalam IPM.'),
 'life_expectancy_male':metric('health','Umur harapan hidup — laki-laki','tahun','Umur harapan hidup saat lahir untuk laki-laki, hasil Long Form SP2020.','life',{'2025':period(UHH_MALE_2025,2025,'2025')}),
 'life_expectancy_female':metric('health','Umur harapan hidup — perempuan','tahun','Umur harapan hidup saat lahir untuk perempuan, hasil Long Form SP2020.','life',{'2025':period(UHH_FEMALE_2025,2025,'2025')}),
 'grdp_current':metric('economy','PDRB atas dasar harga berlaku','miliar Rp','Nilai tambah barang dan jasa menurut harga berlaku. Bukan indikator pertumbuhan riil.','pdrb',{'2024':period(PDRB_2024,2024,'2024',SOURCE['pdrb']+'?year=2024'),'2025':period(PDRB_2025,2025,'2025')},'2024 angka sementara (*) dan 2025 angka sangat sementara (**).'),
 'grdp_per_capita':metric('economy','PDRB per kapita harga berlaku','ribu Rp','PDRB harga berlaku dibagi jumlah penduduk; tidak setara dengan pendapatan bersih individu.','pdrb_cap',{'2025':period(PDRB_CAP_2025,2025,'2025')},'Angka sangat sementara (**) menurut BPS.')
}

def main():
    output={'version':'2026-10-19','sources':'BPS tabel statistik','coverage':'38 provinsi','categories':CATEGORIES,'indicators':CATALOG}
    path=Path(__file__).resolve().parent.parent/'data'/'catalog-2024-2025.json'
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'{path}: {len(CATALOG)} indikator, {sum(len(x["periods"]) for x in CATALOG.values())} seri (38 provinsi per seri)')
if __name__=='__main__':main()