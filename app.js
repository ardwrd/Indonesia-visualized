/* Indonesia Visualized — static GitHub Pages explorer. No API secrets or analytics. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const METRICS = {
    poverty_rate: {
      label:'Persentase penduduk miskin', short:'Persentase miskin', unit:'%',
      explanation:'Persentase penduduk miskin (P0) adalah proporsi penduduk yang pengeluaran per kapitanya berada di bawah garis kemiskinan pada periode pengukuran.'
    },
    poor_population_thousand: {
      label:'Jumlah penduduk miskin', short:'Jumlah penduduk miskin', unit:'ribu jiwa',
      explanation:'Jumlah penduduk miskin adalah estimasi jumlah penduduk dengan pengeluaran per kapita di bawah garis kemiskinan. Satuan data: ribu jiwa.'
    },
    poverty_gap: {
      label:'Indeks kedalaman kemiskinan (P1)', short:'Kedalaman (P1)',unit:'indeks',
      explanation:'Indeks kedalaman kemiskinan (P1) menggambarkan rata-rata jarak pengeluaran penduduk miskin terhadap garis kemiskinan.'
    },
    poverty_severity: {
      label:'Indeks keparahan kemiskinan (P2)', short:'Keparahan (P2)',unit:'indeks',
      explanation:'Indeks keparahan kemiskinan (P2) memberi bobot lebih besar pada kesenjangan pengeluaran yang lebih jauh dari garis kemiskinan.'
    },
    poverty_line: {
      label:'Garis kemiskinan',short:'Garis kemiskinan',unit:'Rp/kapita/bulan',
      explanation:'Garis kemiskinan adalah nilai rupiah per kapita per bulan untuk memenuhi kebutuhan dasar makanan dan bukan makanan menurut metode BPS.'
    }
  };
  const MAP_SOURCES = [
    'data/indonesia-38-provinces.geojson',
    'https://cdn.jsdelivr.net/gh/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces@main/GeoJSON/indonesia-38-provinces.geojson',
    'https://raw.githubusercontent.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces/main/GeoJSON/indonesia-38-provinces.geojson'
  ];
  const fmt = new Intl.NumberFormat('id-ID', {maximumFractionDigits:2,minimumFractionDigits:2});
  const whole = new Intl.NumberFormat('id-ID');
  const normalizeName = name => String(name || '').toLocaleLowerCase('id-ID').normalize('NFKD')
    .replace(/daerah istimewa yogyakarta/g,'di yogyakarta').replace(/d\.?i\.? yogyakarta/g,'di yogyakarta')
    .replace(/[^a-z0-9]/g,'');
  const state = { data:null, metric:'poverty_rate', selected:null, features:null, mapReady:false, zoom:null, search:'' };
  const formatValue = (value,metric=state.metric) => {
    if (!Number.isFinite(value)) return '—';
    if (metric==='poverty_line') return 'Rp '+whole.format(value);
    return fmt.format(value);
  };
  const formatUnit = metric => metric === 'poverty_line' ? '/kapita/bulan' : METRICS[metric].unit;
  const recordMap = new Map();
  function getRanking(){ return [...state.data.provinces].sort((a,b)=>b[state.metric]-a[state.metric]); }
  function selectProvince(code, updateMap=true){
    const record = recordMap.get(String(code));
    if(!record) return;
    state.selected=record.code;
    $('detail-heading').textContent=record.name;
    $('detail-desc').textContent=`Data ${METRICS[state.metric].label.toLocaleLowerCase('id-ID')} untuk provinsi ${record.name} pada Maret 2025.`;
    $('selected-value').textContent=formatValue(record[state.metric]);
    $('selected-unit').textContent=formatUnit(state.metric);
    const rank=getRanking().findIndex(item=>item.code===record.code)+1;
    $('selected-foot').textContent=`Peringkat ${rank} dari 38 provinsi · urutan nilai tertinggi`;
    if (updateMap && state.features) d3.selectAll('#map-geometry path').classed('selected', f => normalizeName(f.properties.PROVINSI) === normalizeName(record.name));
    renderRanking();
  }
  function updateSummary(){
    const sorted=getRanking();
    const first=sorted[0],last=sorted[sorted.length-1];
    $('stat-max').textContent=formatValue(first[state.metric]);
    $('stat-max-name').textContent=first.name;
    $('stat-min').textContent=formatValue(last[state.metric]);
    $('stat-min-name').textContent=last.name;
    const values=sorted.map(p=>p[state.metric]).sort((a,b)=>a-b);
    $('stat-median').textContent=formatValue((values[18]+values[19])/2);
  }
  function renderRanking(){
    const container=$('ranking-list');
    const ranking=getRanking();
    const limit=Math.max(...ranking.map(p=>p[state.metric]));
    const visible=ranking.filter(p=>normalizeName(p.name).includes(normalizeName(state.search)));
    container.replaceChildren();
    if(!visible.length){ const empty=document.createElement('p');empty.className='empty-rank';empty.textContent='Provinsi tidak ditemukan.';container.append(empty);return; }
    const fragment=document.createDocumentFragment();
    visible.forEach(p=>{
      const rank=ranking.findIndex(r=>r.code===p.code)+1;
      const button=document.createElement('button');button.type='button';button.className='rank-item'+(state.selected===p.code?' active':'');
      button.setAttribute('aria-label',`${p.name}, peringkat ${rank}, ${formatValue(p[state.metric])} ${formatUnit(state.metric)}`);
      const loc=document.createElement('span');loc.className='rank-location';
      const n=document.createElement('span');n.className='rank-n';n.textContent=String(rank).padStart(2,'0');
      const name=document.createElement('strong');name.textContent=p.name;
      loc.append(n,name);
      const val=document.createElement('span');val.className='rank-metric';
      const bar=document.createElement('span');bar.className='rank-bar';bar.setAttribute('aria-hidden','true');
      const inner=document.createElement('i');inner.style.width=`${Math.max(2,p[state.metric]/limit*100)}%`;bar.append(inner);
      const text=document.createElement('span');text.textContent=formatValue(p[state.metric]);
      val.append(bar,text);button.append(loc,val);
      button.addEventListener('click',()=>{
        selectProvince(p.code);if(window.innerWidth<700){$('map-holder').scrollIntoView({behavior:'smooth',block:'center'});}
      });fragment.append(button);
    });
    container.append(fragment);
  }
  function updateMetric(metric){
    if(!METRICS[metric]||!state.data) return;
    state.metric=metric;
    document.querySelectorAll('[data-metric]').forEach(btn=>{
      const active=btn.dataset.metric===metric;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
    });
    $('map-title').textContent=METRICS[metric].label;
    $('table-indicator').textContent=METRICS[metric].short.toLocaleUpperCase('id-ID');
    $('metric-explanation').textContent=METRICS[metric].explanation;
    $('original-source').href=state.data.sources[metric];
    updateSummary();
    if(state.selected){selectProvince(state.selected,false);}
    else renderRanking();
    if(state.mapReady) paintMap();
    const params=new URLSearchParams(location.search);params.set('indikator',metric);
    if (location.protocol === 'https:' || location.protocol === 'http:') {
      history.replaceState(null,'',`${location.pathname}?${params.toString()}${location.hash}`);
    }
  }
  function colorScale(){
    const values=state.data.provinces.map(p=>p[state.metric]);
    const min=Math.min(...values),max=Math.max(...values);
    return d3.scaleSequential().domain([min,max]).interpolator(d3.interpolateRgbBasis(['#dfead7','#9dcd70','#53aa73','#276966']));
  }
  function paintMap(){
    const color=colorScale();
    d3.selectAll('#map-geometry path')
      .attr('fill',f=>{const p=state.data.provinces.find(r=>normalizeName(r.name)===normalizeName(f.properties.PROVINSI));return p?color(p[state.metric]):'#55616b';})
      .classed('selected',f=>{const p=state.data.provinces.find(r=>normalizeName(r.name)===normalizeName(f.properties.PROVINSI));return p && p.code===state.selected;});
  }
  function renderMap(geojson){
    if(!window.d3) throw new Error('Pustaka peta D3 tidak dapat dimuat.');
    if(!geojson?.features || geojson.features.length!==38) throw new Error('Batas peta provinsi tidak lengkap.');
    const codes=new Set(state.data.provinces.map(p=>normalizeName(p.name)));
    const unknown=geojson.features.filter(f=>!codes.has(normalizeName(f.properties.PROVINSI)));
    if(unknown.length) throw new Error('Ada nama provinsi pada peta yang tidak cocok dengan data.');
    const svg=d3.select('#map-svg');
    const mapWidth=1040,mapHeight=540;
    const projection=d3.geoMercator().fitExtent([[36,35],[mapWidth-36,mapHeight-35]],geojson);
    const path=d3.geoPath(projection);
    const g=d3.select('#map-geometry');
    g.selectAll('path').data(geojson.features).join('path')
      .attr('d',path)
      .attr('role','button')
      .attr('tabindex',0)
      .attr('aria-label',f=>`Lihat statistik ${f.properties.PROVINSI}`)
      .on('click',(_,f)=>selectByName(f.properties.PROVINSI))
      .on('keydown',(ev,f)=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();selectByName(f.properties.PROVINSI);}})
      .on('pointermove',(ev,f)=>showTooltip(ev,f))
      .on('pointerleave',()=>{$('tooltip').hidden=true;});
    state.features=geojson.features;state.mapReady=true;
    state.zoom=d3.zoom().scaleExtent([1,6]).translateExtent([[0,0],[mapWidth,mapHeight]]).on('zoom',ev=>g.attr('transform',ev.transform));
    svg.call(state.zoom).on('dblclick.zoom',null);
    $('zoom-in').addEventListener('click',()=>svg.transition().duration(200).call(state.zoom.scaleBy,1.45));
    $('zoom-out').addEventListener('click',()=>svg.transition().duration(200).call(state.zoom.scaleBy,1/1.45));
    $('zoom-reset').addEventListener('click',()=>svg.transition().duration(200).call(state.zoom.transform,d3.zoomIdentity));
    $('map-status').textContent='';
    paintMap();
  }
  function selectByName(name){
    const p=state.data.provinces.find(r=>normalizeName(r.name)===normalizeName(name));if(p)selectProvince(p.code);
  }
  function showTooltip(ev,feature){
    const p=state.data.provinces.find(r=>normalizeName(r.name)===normalizeName(feature.properties.PROVINSI));if(!p)return;
    const tooltip=$('tooltip'),holder=$('map-holder');
    tooltip.replaceChildren();
    const title=document.createElement('strong');title.textContent=p.name;
    const value=document.createElement('span');value.textContent=`${formatValue(p[state.metric])} ${formatUnit(state.metric)}`;
    tooltip.append(title,value);tooltip.hidden=false;
    const rect=holder.getBoundingClientRect();
    const desiredX=ev.clientX-rect.left+16,desiredY=ev.clientY-rect.top-55;
    tooltip.style.left=`${Math.max(8,Math.min(desiredX,rect.width-tooltip.offsetWidth-8))}px`;
    tooltip.style.top=`${Math.max(8,Math.min(desiredY,rect.height-tooltip.offsetHeight-8))}px`;
  }
  async function getGeojson(){
    for(const url of MAP_SOURCES){
      try{const response=await fetch(url,{cache:'force-cache'});if(!response.ok)continue;return await response.json();}
      catch(e){console.warn('Sumber geometri peta tidak tersedia',e);}
    }
    throw new Error('Peta gagal dimuat. Periksa koneksi internet dan muat ulang halaman. Daftar provinsi tetap bisa digunakan.');
  }
  function downloadCsv(){
    if(!state.data)return;
    const m=state.metric;
    const rows=[['Kode Provinsi','Provinsi','Periode',METRICS[m].label, 'Satuan'],...getRanking().map(p=>[p.code,p.name,'Maret 2025',p[m],METRICS[m].unit])];
    const csv='\ufeff'+rows.map(r=>r.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const objectUrl=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=objectUrl;link.download=`indonesia-visualized-${m}-2025.csv`;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
  }
  async function start(){
    try{
      const response=await fetch('data/poverty-2025.json');if(!response.ok)throw new Error('Data statistik tidak ditemukan.');
      const payload=await response.json();
      if(!Array.isArray(payload.provinces)||payload.provinces.length!==38)throw new Error('Data provinsi belum lengkap.');
      state.data=payload;payload.provinces.forEach(p=>recordMap.set(p.code,p));
      document.querySelectorAll('[data-metric]').forEach(btn=>btn.addEventListener('click',()=>updateMetric(btn.dataset.metric)));
      $('search').addEventListener('input',e=>{state.search=e.target.value;renderRanking();});
      $('download-csv').addEventListener('click',downloadCsv);
      const saved=new URLSearchParams(location.search).get('indikator');
      updateMetric(METRICS[saved]?saved:'poverty_rate');
      // Selection is deliberate: initially none, like the reference explorer.
      renderMap(await getGeojson());
    } catch(err){
      console.error(err);
      $('map-status').textContent=`${err.message} Gunakan daftar provinsi untuk eksplorasi data.`;
      if(!state.data){$('ranking-list').textContent='Data belum tersedia. Jalankan aplikasi melalui HTTP server atau GitHub Pages.';}
    }
  }
  start();
})();