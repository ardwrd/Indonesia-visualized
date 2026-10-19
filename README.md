# Indonesia Visualized

> **Jelajahi Indonesia melalui data.** Aplikasi peta interaktif yang menyajikan statistik publik Indonesia secara sederhana, transparan, dan mudah dibandingkan.

**Live site (setelah GitHub Pages diaktifkan):** https://ardwrd.github.io/Indonesia-visualized/

## MVP — Data kemiskinan BPS

- Choropleth **38 provinsi**. Klik wilayah pada peta untuk melihat nilai indikator dan peringkat provinsinya.
- **Lima indikator**: persentase penduduk miskin (P0), jumlah penduduk miskin (ribu jiwa), indeks kedalaman (P1), indeks keparahan (P2), dan garis kemiskinan (Rp/kapita/bulan).
- Data snapshot **Maret 2025** (bukan live), dengan sumber dan definisi yang disebutkan secara eksplisit.
- Ringkasan provinsi tertinggi/terendah dan **median antarprovinsi** (bukan statistik nasional), daftar peringkat, pencarian dan unduh CSV.
- Vanilla JavaScript + D3.js, tanpa backend, login, analytics, maupun API key di frontend. Cocok untuk GitHub Pages.

## Asal data

Data BPS disajikan ulang di situs Pusdatin Kementerian Pertanian, kemudian dibekukan sebagai snapshot CSV dan JSON dalam folder `data/` agar website stabil, transparan, dan tidak perlu meminta kunci API kepada pengunjung.

| Indikator | Sumber | 
| --- | --- |
| Persentase penduduk miskin (P0) | https://siperditan.pertanian.go.id/kemiskinan/persentase_bps.php |
| Jumlah penduduk miskin | https://siperditan.pertanian.go.id/kemiskinan/kemiskinan_bps.php |
| Indeks kedalaman kemiskinan (P1) | https://siperditan.pertanian.go.id/kemiskinan/indeks_kedalaman_bps.php |
| Indeks keparahan kemiskinan (P2) | https://siperditan.pertanian.go.id/kemiskinan/indeks_keparahan_bps.php |
| Garis kemiskinan | https://siperditan.pertanian.go.id/kemiskinan/garis_kemiskinan_bps.php |
| Tabel resmi BPS | https://www.bps.go.id/id/statistics-table/3/UkVkWGJVZFNWakl6VWxKVFQwWjVWeTlSZDNabVFUMDkjMw%3D%3D/jumlah-dan-persentase-penduduk-miskin-menurut-provinsi--2024.html?year=2025 |

**Penting**: Sumber data adalah publikasi dan tabel pemerintah; repo ini bukan situs resmi BPS, dan nilai bisa direvisi oleh instansi sumber. Frekuensi rilis dan cakupan berbeda menurut indikator. Jangan menghitung angka kemiskinan nasional sebagai rata-rata sederhana 38 provinsi.

## Geometri provinsi

GeoJSON peta 38 provinsi tersimpan lokal di `data/indonesia-38-provinces.geojson` dan berasal dari proyek [Indonesia GeoJSON & TopoJSON 38 Provinces](https://github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces) (lisensi **CC BY 4.0**). UI mengutamakan geometri lokal, lalu memiliki fallback CDN dan GitHub raw. Versi yang disimpan di repo ini dibulatkan ke presisi lima angka desimal pada koordinat. Kode geometri beberapa provinsi Papua belum unik, jadi pencocokan menggunakan nama provinsi yang dinormalisasi. Layer geografis tersebut mungkin tidak identik dengan batas administrasi dalam rilis BPS.

## Jalankan lokal

```bash
python -m http.server 8080
```

Buka `http://localhost:8080/`. Jangan buka HTML via `file://` karena JSON memerlukan HTTP untuk `fetch()`.

## Deploy GitHub Pages

1. Merge pull request ke branch `main`.
2. Buka **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Pilih branch `main` dan folder `/ (root)`, lalu **Save**.
4. Lihat website di https://ardwrd.github.io/Indonesia-visualized/ setelah GitHub Pages menyelesaikan deployment.

Seluruh URL asset menggunakan path relatif sehingga kompatibel dengan GitHub Pages project subpath. Internet tetap diperlukan untuk D3 dan Google Fonts. GeoJSON lokal dipakai untuk memperkecil ketergantungan CDN.

## Quality check

```bash
python test_data.py
node --check app.js
```

Script `make_data.py` meregenerasi snapshot 2025 dari tabel yang sudah ditranskripsi. Jangan gunakan angka baru sebelum cross-check ulang dengan sumbernya.

## Roadmap

- [x] Menghosting GeoJSON secara lokal agar peta tidak bergantung pada sumber eksternal.
- [ ] Menyediakan multi-tahun hanya setelah tiap dataset diverifikasi dengan BPS.
- [ ] Menambah kategori demografi, pendidikan, ekonomi, pekerjaan, kesehatan.
- [ ] Menambah kabupaten/kota dengan sinkronisasi kode wilayah.
- [ ] Menyiapkan pembaruan data terkontrol melalui GitHub Actions dan WebAPI BPS (API key hanya di GitHub Secrets, tidak di frontend).

## Lisensi dan atribusi

Kode aplikasi mengikuti lisensi MIT di `LICENSE` repository. Dataset merupakan data publik yang tetap perlu atribusi BPS/Pusdatin dan sumber publikasi. **Geometri** pihak ketiga tunduk pada CC BY 4.0 dan harus tetap diberi kredit sebagaimana dicantumkan di atas.

Proyek ini independen, terpisah dari PetaSuara dan bukan bagian dari layanan resmi BPS.