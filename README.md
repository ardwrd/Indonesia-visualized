# Indonesia Visualized

Visualisasi interaktif data statistik publik Indonesia. **Situs independen, bukan layanan resmi BPS.**

**GitHub Pages:** https://ardwrd.github.io/Indonesia-visualized/

## Versi pertama: kemiskinan Maret 2025

- Peta interaktif **38 provinsi**, bisa diklik/sentuh untuk menampilkan data wilayah, zoom in/out/reset, dan pan saat zoom.
- Lima indikator: persentase penduduk miskin (P0), jumlah penduduk miskin (ribu jiwa), indeks kedalaman (P1), indeks keparahan (P2), dan garis kemiskinan (Rp/kapita/bulan).
- Detail nilai dan peringkat provinsi, maksimum/minimum, median antarprovinsi, daftar peringkat, pencarian, dan ekspor CSV.
- Mobile-first: peta tetap muat dalam layar HP, tersedia dropdown provinsi sebagai alternatif untuk pulau/provinsi kecil.
- **Vanilla HTML/CSS/JavaScript tanpa framework, D3, Web API key, Google Fonts, analytics, atau backend.** Data dan GeoJSON di-host langsung dalam repo supaya render tidak bergantung pada CDN.

## Sumber data

Dataset Maret 2025 berasal dari BPS yang disajikan ulang oleh Pusdatin Kementerian Pertanian, lalu disimpan sebagai snapshot CSV + JSON yang dapat diperiksa di `data/`.

| Indikator | Tabel sumber |
| --- | --- |
| Persentase penduduk miskin (P0) | https://siperditan.pertanian.go.id/kemiskinan/persentase_bps.php |
| Jumlah penduduk miskin | https://siperditan.pertanian.go.id/kemiskinan/kemiskinan_bps.php |
| Indeks kedalaman kemiskinan (P1) | https://siperditan.pertanian.go.id/kemiskinan/indeks_kedalaman_bps.php |
| Indeks keparahan kemiskinan (P2) | https://siperditan.pertanian.go.id/kemiskinan/indeks_keparahan_bps.php |
| Garis kemiskinan | https://siperditan.pertanian.go.id/kemiskinan/garis_kemiskinan_bps.php |

**Konteks:** [BPS — Jumlah dan Persentase Penduduk Miskin Menurut Provinsi](https://www.bps.go.id/id/statistics-table/3/UkVkWGJVZFNWakl6VWxKVFQwWjVWeTlSZDNabVFUMDkjMw%3D%3D/jumlah-dan-persentase-penduduk-miskin-menurut-provinsi--2024.html?year=2025).

Data tidak otomatis berubah mengikuti rilis BPS. Setiap pembaruan harus diverifikasi lebih dahulu. **Median dari 38 provinsi bukan angka nasional**. Angka jumlah miskin berbeda makna dari persentase miskin.

## Sumber geometri

Peta menggunakan `data/indonesia-38-provinces.geojson` dari proyek [Indonesia GeoJSON / TopoJSON — 38 Provinces](https://github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces) (lisensi **CC BY 4.0**, atribusi tambahan di `data/GEODATA-LICENSE.md`).

Beberapa `KODE_PROV` untuk provinsi pemekaran Papua tidak unik, sehingga relasi ke data dibuat dari **nama provinsi yang dinormalisasi**. Batas dari proyek pihak ketiga belum tentu sama persis dengan versi administrasi yang dipakai BPS.

**Mengapa renderer SVG sendiri?** Peta sebelumnya menggunakan `d3.geoMercator().fitExtent()` atas GeoJSON dengan exterior ring counterclockwise. D3 menafsirkan exterior tersebut sebagai komplemen permukaan bumi, sehingga Indonesia menjadi titik kecil. Renderer sekarang memproyeksikan pasangan `[longitude, latitude]` masing-masing ring ke viewBox 1000×445 (dan memakai `fill-rule="evenodd"`), tanpa asumsi arah ring. Rentang geografis dipakai untuk fit gambar ke viewport, kemudian SVG diskalakan dengan rasio tetap di mobile. Tidak ada permintaan peta ke server pihak ketiga saat runtime.

## Jalankan lokal

```bash
python -m http.server 8080
```

Buka `http://localhost:8080/`. Jangan buka lewat `file://`, karena browser membatasi pemanggilan `fetch()` dari file lokal.

## Pengujian

```bash
node --check app.js
python -m unittest test_data test_map_geometry
```

`test_map_geometry.py` memastikan 38 nama cocok, koordinat masih di area Indonesia, dan proyeksi berada dalam viewBox.

## Deploy GitHub Pages

Setelah PR digabung, masuk **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**. Semua path asset relatif sehingga aman untuk URL repo GitHub Pages.

## Roadmap

- Tambahkan rentang tahun hanya setelah tiap tahun sumbernya terverifikasi.
- Pilihan topik pendidikan, ekonomi, demografi, ketenagakerjaan, kesehatan.
- Rincian kabupaten/kota setelah batas wilayah dan kode administratif seragam.
- Pipeline pembaruan data dari BPS dengan verifikasi dan GitHub Actions (token API hanya lewat secrets).

## Lisensi

Kode situs menggunakan MIT (lihat `LICENSE`). Geometri peta dari kontributor pihak ketiga menggunakan CC BY 4.0 dan tidak otomatis menjadi MIT. Data statistik tetap diatribusikan ke BPS dan Pusdatin Kementerian Pertanian. Tidak ada afiliasi resmi dengan kedua instansi tersebut.