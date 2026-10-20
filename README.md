# Indonesia Visualized

Eksplorasi statistik **38 provinsi** Indonesia secara interaktif dari sumber data BPS. Website statis, tanpa backend, tracker, atau API key; siap GitHub Pages.

## Cakupan data

7 kategori dan 16 indikator (5 kemiskinan lama + 11 indikator baru):

| Kategori | Indikator | Periode snapshot |
|---|---|---|
| Kependudukan | Jumlah penduduk (proyeksi, ribu jiwa) | 2024, 2025 |
| Kemiskinan | Persentase miskin, jumlah miskin, P1, P2, garis kemiskinan | Maret 2025 |
| Pembangunan manusia | IPM (seri hasil LF SP2020) | 2024, 2025 |
| Ketenagakerjaan | TPT Februari & Agustus, TPAK Februari & Agustus | 2025 |
| Pendidikan | Rata-rata lama sekolah penduduk **usia 15+** | 2025 |
| Kesehatan | Umur harapan hidup saat lahir menurut jenis kelamin | 2025 |
| Ekonomi | PDRB harga berlaku | 2024, 2025 |
| Ekonomi | PDRB per kapita harga berlaku | 2025 |

Tahun hanya ditawarkan jika seri resmi tersedia dan telah dimasukkan ke katalog. Tabel dan peta menggunakan nilai yang sama; CSV menyertakan nama indikator, satuan, periode, dan URL sumber. Angka tertinggi/terendah dan median adalah **statistik antarprovinsi**, bukan statistik nasional.

> **Perhatian metodologi:** Seri IPM menggunakan metodologi IPM dengan UHH berbasis Long Form SP2020. Data proyeksi penduduk bukan sensus baru, rata-rata lama sekolah usia 15+ bukan komponen RLS usia 25+ untuk IPM. PDRB nominal tidak menunjukkan pertumbuhan ekonomi riil. Nilai PDRB 2024 ditandai sementara (`*`), 2025 sangat sementara (`**`) menurut BPS.

## Sumber

Metadata lengkap ada di `data/catalog-2024-2025.json` (`source` per indikator) dan transkripsi setiap indikator ada di `scripts/build_catalog.py` (`SOURCE`). Tautan utama:

- [BPS — Penduduk dan indikator demografi menurut provinsi](https://www.bps.go.id/id/statistics-table/3/V1ZSbFRUY3lTbFpEYTNsVWNGcDZjek53YkhsNFFUMDkjMw%3D%3D/penduduk-laju-pertumbuhan-penduduk-distribusi-persentase-penduduk-kepadatan-penduduk-rasio-jenis-kelamin-penduduk-menurut-provinsi.html?year=2025)
- [BPS — Indeks Pembangunan Manusia](https://www.bps.go.id/id/statistics-table/3/V25GaFNHaExaMnhITm1sWmRrUlJZelJzYUc1SGR6MDkjMw%3D%3D/indeks-pembangunan-manusia-menurut-provinsi--2014.html)
- [BPS — TPT dan TPAK per provinsi](https://www.bps.go.id/id/statistics-table/3/V2pOVWJWcHJURGg0U2pONFJYaExhVXB0TUhacVFUMDkjMw%3D%3D/tingkat-pengangguran-terbuka--tpt--dan-tingkat-partisipasi-angkatan-kerja--tpak--menurut-provinsi--2017.html)
- [BPS — Rata-rata Lama Sekolah penduduk 15+](https://www.bps.go.id/id/statistics-table/2/MTQyOSMy/penerimaan-daerah-menurut-sumber.html)
- [BPS — Umur Harapan Hidup menurut jenis kelamin](https://www.bps.go.id/id/statistics-table/2/MjI3MyMy/angka-harapan-hidup--ahh--menurut-provinsi-dan-jenis-kelamin--menggunakan-uhh-hasilsp2020lf-.html)
- [BPS — PDRB atas dasar harga berlaku](https://www.bps.go.id/id/statistics-table/3/WkdVMWRYVnBkMnBvVEhKSVkyWXhNblZtTjJSbmR6MDkjMw%3D%3D/produk-domestik-regional-bruto-atas-dasar-harga-berlaku---menurut-provinsi--miliar-rupiah---2023.html)
- [BPS — PDRB per kapita](https://www.bps.go.id/id/statistics-table/3/YWtoQlRVZzNiMU5qU1VOSlRFeFZiRTR4VDJOTVVUMDkjMw%3D%3D/produk-domestik-regional-bruto-per-kapita-atas-dasar-harga-berlaku-menurut-provinsi--ribu-rupiah---2018.html)
- Dataset kemiskinan Maret 2025 dari BPS via [Pusdatin Kementan](https://siperditan.pertanian.go.id/kemiskinan/persentase_bps.php), beserta keterangan pada `data/poverty-2025.json`.

GeoJSON provinsi berasal dari [denyherianto/indonesia-geojson-topojson-maps-with-38-provinces](https://github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces) (**CC BY 4.0**); atribusi lengkap di `data/GEODATA-LICENSE.md`. Geometri bukan dataset resmi BPS.

## Pengembangan lokal

```bash
python3 -m http.server 8000
# kunjungi http://localhost:8000/
```

Regenerasi data jika sumber BPS sudah diverifikasi ulang:

```bash
python3 scripts/build_catalog.py
python3 -m unittest discover -s tests
python3 test_data.py
node --check app.js
```

Jangan mengisi tahun baru dengan interpolasi, memperlakukan angka rupiah sebagai persen, atau menebak data provinsi. Pertahankan URL sumber asli, catatan metode, dan tanda revisi. `data/catalog-2024-2025.json` adalah **snapshot** yang disimpan di repository, bukan sinkronisasi WebAPI secara langsung. Kelompok tahun untuk setiap indikator dibangun dari seri yang tersedia; pergantian kategori tidak menampilkan angka dari indikator sebelumnya.

## Deployment GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`.

URL: https://ardwrd.github.io/Indonesia-visualized/

Lisensi source code MIT; data geometri tetap mengikuti lisensi CC BY 4.0 milik penyedianya. Proyek ini tidak berafiliasi resmi dengan BPS.
### Penyajian satuan penduduk

Peta, tooltip, tabel, ringkasan, dan detail wilayah menampilkan jumlah penduduk dalam **juta jiwa**, dibulatkan sampai dua desimal (nilai BPS dalam ribu jiwa dibagi 1.000). Dataset `data/catalog-2024-2025.json` serta berkas CSV unduhan tetap mempertahankan angka mentah **ribu jiwa** untuk ketertelusuran. Kolom `Satuan` pada CSV menandai unit tersebut.

### Audit satuan dan keterbacaan (20 Oktober 2026)

Nilai mentah statistik **tidak diubah**. Tampilan browser memakai konversi satuan berikut untuk memudahkan pembaca; ekspor CSV tetap membawa angka **dan satuan asli sumber**.

| Indikator | Satuan asli | Satuan pada peta, tooltip, tabel, dan detail | Perubahan nilai |
|---|---|---|---|
| Jumlah penduduk | ribu jiwa | juta jiwa | ÷1.000 |
| PDRB harga berlaku | miliar rupiah | triliun rupiah | ÷1.000 |
| PDRB per kapita harga berlaku | ribu rupiah/kapita/tahun | juta rupiah/kapita/tahun | ÷1.000 |
| Garis kemiskinan | rupiah/kapita/bulan | rupiah per kapita/bulan | Tetap; prefiks Rp pada nilai |
| Jumlah penduduk miskin | ribu jiwa | ribu jiwa | Tetap |
| Tingkat kemiskinan / TPT / TPAK | % | % | Tetap |
| IPM / indeks kedalaman / indeks keparahan | indeks | indeks | Tetap |
| Rata-rata lama sekolah / umur harapan hidup | tahun | tahun | Tetap |

**Pemeriksaan lintas indikator:** 38 nilai PDRB ADHB 2025 dibandingkan dengan hasil PDRB per kapita × proyeksi penduduk 2025, konsisten dalam batas pembulatan data publik. Contoh DKI Jakarta: PDRB 3.926.153,30 miliar rupiah = 3.926,15 triliun rupiah, sedangkan PDRB per kapita 367.687 ribu rupiah = 367,69 juta rupiah/kapita/tahun.

Ketika mengunduh CSV tahun 2024, kolom sumber memakai URL seri 2024 bila tersedia, bukan URL fallback 2025. Detail informasi asli tetap tersimpan di `data/catalog-2024-2025.json` dan `data/poverty-2025.json`.
