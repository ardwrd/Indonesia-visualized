/* Indonesia Visualized — no tracking, framework-free provincial explorer. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const number = new Intl.NumberFormat('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});
  const decimalOne = new Intl.NumberFormat('id-ID',{minimumFractionDigits:1,maximumFractionDigits:1});
  const integer = new Intl.NumberFormat('id-ID',{maximumFractionDigits:0});
  const normalize = s => String(s??'').toLocaleLowerCase('id-ID').normalize('NFKD')
    .replace(/daerah istimewa yogyakarta|d\.?i\.? yogyakarta/g,'di yogyakarta').replace(/[^a-z0-9]/g,'');
  const state = {
    poverty:null, catalog:null, provinces:[], provinceByCode:new Map(), provinceByName:new Map(),
    category:'population',metric:'population_total',year:'2025',selected:null,search:'',
    scale:1,tx:0,ty:0,drag:null,skipClickUntil:0,featuresLoaded:false
  };
  const defaultCategoryOrder=['population','poverty','human','labor','education','health','economy'];
  const svg=$('map-svg'),group=$('map-geometry'),holder=$('map-holder');
  const viewport={width:1000,height:445};
  const povertyDefinitions={
    poverty_rate:['Persentase penduduk miskin','%','Proporsi penduduk dengan pengeluaran per kapita di bawah garis kemiskinan.'],
    poor_population_thousand:['Jumlah penduduk miskin','ribu jiwa','Estimasi jumlah penduduk miskin dalam ribu jiwa.'],
    poverty_gap:['Indeks kedalaman kemiskinan (P1)','indeks','Rata-rata kesenjangan pengeluaran penduduk miskin dari garis kemiskinan.'],
    poverty_severity:['Indeks keparahan kemiskinan (P2)','indeks','Indeks yang memberi bobot lebih tinggi pada kesenjangan pengeluaran paling besar.'],
    poverty_line:['Garis kemiskinan','Rp/kapita/bulan','Nilai pengeluaran per kapita minimum untuk kebutuhan dasar.']
  };
  let definitions={};

  function getDefinition(key){return definitions[key];}
  function getSeries(){
    const d=getDefinition(state.metric);
    return d?.periods?.[state.year]??null;
  }
  function unit(){return state.metric==='population_total'?'juta jiwa':getDefinition(state.metric)?.unit??'';}
  function formatValue(value){
    if(!Number.isFinite(value))return '—';
    if(state.metric==='poverty_line')return 'Rp '+integer.format(value);
    if(state.metric==='population_total')return number.format(value/1000);
    if(state.metric==='grdp_per_capita')return integer.format(value);
    if(state.metric==='grdp_current')return number.format(value);
    return number.format(value);
  }
  function allRecords(){
    const vals=getSeries()?.values??{};
    return state.provinces.map(p=>({...p,value:vals[p.code]??null})).filter(p=>Number.isFinite(p.value));
  }
  function ranking(){return allRecords().sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'id'));}
  function activePeriod(){return getSeries()?.label??state.year;}
  function availableMetrics(category){return Object.entries(definitions).filter(([,d])=>d.category===category);}
  function metricValid(category,metric){return definitions[metric]?.category===category;}

  function selectProvince(code,scroll=false){
    const record=state.provinceByCode.get(String(code));if(!record)return;
    state.selected=record.code;
    updateDetail();
    group.querySelectorAll('.province').forEach(el=>{
      const chosen=el.dataset.province===record.code;
      el.classList.toggle('is-selected',chosen);
      el.setAttribute('aria-pressed',String(chosen));
    });
    renderRanking();
    if(scroll&&window.matchMedia('(max-width:740px)').matches){
      holder.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'});
    }
  }
  function updateDetail(){
    const record=state.provinceByCode.get(state.selected);
    $('detail-empty').hidden=Boolean(record);$('detail-filled').hidden=!record;
    $('province-select').value=record?.code??'';
    if(!record)return;
    const value=getSeries()?.values[record.code];
    const order=ranking();
    $('detail-heading').textContent=record.name;
    $('selected-value').textContent=formatValue(value);
    $('selected-unit').textContent=unit();
    $('selected-foot').textContent=`Peringkat ${order.findIndex(p=>p.code===record.code)+1} dari ${order.length} provinsi · nilai tertinggi lebih dulu`;
    $('detail-desc').textContent='Data BPS · '+activePeriod();
  }
  function renderSummary(){
    const order=ranking();if(!order.length)return;
    $('stat-max').textContent=formatValue(order[0].value);$('stat-max-name').textContent=order[0].name;
    $('stat-min').textContent=formatValue(order.at(-1).value);$('stat-min-name').textContent=order.at(-1).name;
    const values=order.map(p=>p.value).sort((a,b)=>a-b);
    const middle=values.length/2;
    $('stat-median').textContent=formatValue((values[Math.ceil(middle)-1]+values[Math.floor(middle)])/2);
    $('legend-low').textContent=formatValue(values[0]);$('legend-high').textContent=formatValue(values.at(-1));
  }
  function renderRanking(){
    const order=ranking(),target=$('ranking-list');target.replaceChildren();
    const lower=normalize(state.search);const visible=order.filter(p=>normalize(p.name).includes(lower));
    if(!visible.length){const p=document.createElement('p');p.className='empty-rank';p.textContent='Provinsi tidak ditemukan.';target.append(p);return;}
    const vals=order.map(p=>p.value);const min=Math.min(...vals),max=Math.max(...vals);
    const frag=document.createDocumentFragment();
    visible.forEach(p=>{
      const idx=order.findIndex(x=>x.code===p.code)+1;
      const button=document.createElement('button');button.type='button';button.className='rank-item'+(state.selected===p.code?' active':'');
      button.setAttribute('aria-label',`${p.name}, ${formatValue(p.value)} ${unit()}, peringkat ${idx}`);
      const left=document.createElement('span');left.className='rank-location';
      const num=document.createElement('span');num.className='rank-n';num.textContent=String(idx).padStart(2,'0');
      const name=document.createElement('strong');name.textContent=p.name;left.append(num,name);
      const right=document.createElement('span');right.className='rank-metric';
      const bar=document.createElement('span');bar.className='rank-bar';bar.setAttribute('aria-hidden','true');
      const fill=document.createElement('i');fill.style.width=`${Math.max(5,Math.round((max===min?0.5:(p.value-min)/(max-min))*100))}%`;bar.append(fill);
      const value=document.createElement('span');value.textContent=formatValue(p.value);right.append(bar,value);
      button.append(left,right);button.addEventListener('click',()=>selectProvince(p.code,true));frag.append(button);
    });target.append(frag);
  }
  function palette(value,min,max){
    const t=max===min?0.5:Math.max(0,Math.min(1,(value-min)/(max-min)));
    const stops=[[229,239,251],[185,210,241],[123,169,223],[59,121,198],[24,76,152]];
    const scaled=t*(stops.length-1),i=Math.min(stops.length-2,Math.floor(scaled)),f=scaled-i;
    return 'rgb('+stops[i].map((v,k)=>Math.round(v+(stops[i+1][k]-v)*f)).join(',')+')';
  }
  function recolorMap(){
    if(!state.featuresLoaded)return;
    const records=allRecords(),vals=records.map(p=>p.value),min=Math.min(...vals),max=Math.max(...vals);
    const values=getSeries().values;
    group.querySelectorAll('.province').forEach(path=>{
      const value=values[path.dataset.province];
      path.setAttribute('fill',Number.isFinite(value)?palette(value,min,max):'#cbd5e1');
      path.classList.toggle('is-selected',path.dataset.province===state.selected);
    });
  }
  function repaint(){
    const d=getDefinition(state.metric),period=getSeries();
    $('map-title').textContent=d.label;
    $('map-subtitle').textContent=`${activePeriod()} · ${Object.keys(period.values).length} provinsi · ${state.catalog?.sources??'BPS'}`;
    $('detail-date').textContent=activePeriod();
    $('table-indicator').textContent=d.label;
    $('metric-explanation').textContent=state.metric==='population_total'?'Data proyeksi jumlah penduduk ditampilkan dalam juta jiwa (dibagi 1.000 dari satuan asli BPS: ribu jiwa).':d.description;
    $('source-notes').textContent=d.notes||'';
    $('original-source').href=period.source??d.source;
    renderSummary();updateDetail();renderRanking();recolorMap();
    if(['http:','https:'].includes(location.protocol)){
      const q=new URLSearchParams(location.search);
      q.set('kategori',state.category);q.set('indikator',state.metric);q.set('tahun',state.year);
      history.replaceState(null,'',location.pathname+'?'+q.toString()+location.hash);
    }
  }
  function selectCategory(key,requestedMetric=null,requestedYear=null){
    if(!state.catalog.categories[key])return;
    const metrics=availableMetrics(key);if(!metrics.length)return;
    state.category=key;
    $('category').value=key;
    const select=$('indicator');select.replaceChildren();
    for(const [id,d] of metrics){const opt=document.createElement('option');opt.value=id;opt.textContent=d.label;select.append(opt);}
    selectMetric(metricValid(key,requestedMetric)?requestedMetric:metrics[0][0],requestedYear);
  }
  function selectMetric(key,requestedYear=null){
    if(!metricValid(state.category,key))return;
    state.metric=key;$('indicator').value=key;
    const years=Object.keys(getDefinition(key).periods).sort((a,b)=>Number(b)-Number(a));
    const yearSelect=$('year');yearSelect.replaceChildren();
    years.forEach(y=>{const opt=document.createElement('option');opt.value=y;opt.textContent=y;yearSelect.append(opt);});
    const prefer=requestedYear??state.year;
    state.year=years.includes(String(prefer))?String(prefer):years[0];
    yearSelect.value=state.year;yearSelect.disabled=years.length===1;
    repaint();
  }
  function changeYear(year){if(!getDefinition(state.metric).periods[year])return;state.year=year;$('year').value=year;repaint();}

  // Project lat/lon coordinates directly into a fixed SVG viewBox; each ring is drawn independently.
  // This avoids global-sphere inversion with counterclockwise exterior rings in the imported GeoJSON.
  function allCoordinates(geometry){
    const arr=[];function walk(p){if(!Array.isArray(p))return;if(typeof p[0]==='number'&&typeof p[1]==='number'){arr.push(p);return;}p.forEach(walk);}walk(geometry.coordinates);return arr;
  }
  function createProjection(geojson){
    const points=geojson.features.flatMap(f=>allCoordinates(f.geometry));
    if(points.length<100)throw new Error('Koordinat peta tidak lengkap.');
    const x=points.map(p=>p[0]),y=points.map(p=>p[1]);
    const x0=Math.min(...x),x1=Math.max(...x),y0=Math.min(...y),y1=Math.max(...y);
    if(![x0,x1,y0,y1].every(Number.isFinite)||x1-x0<1||y1-y0<1)throw new Error('Koordinat peta tidak valid.');
    const k=Math.min((viewport.width-56)/(x1-x0),(viewport.height-48)/(y1-y0));
    const left=(viewport.width-(x1-x0)*k)/2,top=(viewport.height-(y1-y0)*k)/2;
    return point=>[left+(point[0]-x0)*k,top+(y1-point[1])*k];
  }
  function geometryPath(geometry,project){
    const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.type==='MultiPolygon'?geometry.coordinates:null;
    if(!polys)throw new Error('Jenis poligon tidak dikenal.');
    return polys.map(poly=>poly.map(ring=>ring.map((p,i)=>{const [x,y]=project(p);return(i?'L':'M')+x.toFixed(2)+','+y.toFixed(2);}).join('')+'Z').join('')).join('');
  }
  function showTooltip(ev,record){
    if(ev.pointerType==='touch'||state.drag?.moved)return;
    const tip=$('tooltip');tip.replaceChildren();
    const head=document.createElement('strong');head.textContent=record.name;
    const val=document.createElement('span');val.textContent=formatValue(getSeries().values[record.code])+' '+unit();
    tip.append(head,val);tip.hidden=false;
    const r=holder.getBoundingClientRect();
    tip.style.left=Math.max(6,Math.min(ev.clientX-r.left+12,r.width-tip.offsetWidth-6))+'px';
    tip.style.top=Math.max(6,Math.min(ev.clientY-r.top-43,r.height-tip.offsetHeight-6))+'px';
  }
  function hideTooltip(){$('tooltip').hidden=true;}
  function transform(){
    group.setAttribute('transform',`translate(${state.tx.toFixed(2)},${state.ty.toFixed(2)}) scale(${state.scale.toFixed(3)})`);
    holder.classList.toggle('map-zoomed',state.scale>1.01);
  }
  function scaleTo(target,cx=viewport.width/2,cy=viewport.height/2){
    const k=Math.max(1,Math.min(8,target));const ratio=k/state.scale;
    state.tx=cx+(state.tx-cx)*ratio;state.ty=cy+(state.ty-cy)*ratio;state.scale=k;
    state.tx=Math.max(viewport.width*(1-k),Math.min(0,state.tx));
    state.ty=Math.max(viewport.height*(1-k),Math.min(0,state.ty));
    if(k===1){state.tx=0;state.ty=0;}transform();
  }
  function setupNavigation(){
    $('zoom-in').addEventListener('click',()=>scaleTo(state.scale*1.5));
    $('zoom-out').addEventListener('click',()=>scaleTo(state.scale/1.5));
    $('zoom-reset').addEventListener('click',()=>scaleTo(1));
    svg.addEventListener('wheel',ev=>{
      if(!ev.ctrlKey)return;ev.preventDefault();
      const rect=svg.getBoundingClientRect();const ratio=viewport.width/rect.width;
      scaleTo(state.scale*(ev.deltaY<0?1.2:1/1.2),(ev.clientX-rect.left)*ratio,(ev.clientY-rect.top)*ratio);
    },{passive:false});
    svg.addEventListener('pointerdown',ev=>{
      if(state.scale<=1||ev.button!==0)return;
      state.drag={id:ev.pointerId,x:ev.clientX,y:ev.clientY,tx:state.tx,ty:state.ty,moved:false};hideTooltip();
    });
    svg.addEventListener('pointermove',ev=>{
      const d=state.drag;if(!d||d.id!==ev.pointerId)return;
      const dx=ev.clientX-d.x,dy=ev.clientY-d.y;
      if(Math.abs(dx)+Math.abs(dy)>6&&!d.moved){d.moved=true;svg.setPointerCapture(ev.pointerId);holder.classList.add('map-dragging');}
      if(!d.moved)return;
      const multiplier=viewport.width/svg.getBoundingClientRect().width;
      state.tx=Math.max(viewport.width*(1-state.scale),Math.min(0,d.tx+dx*multiplier));
      state.ty=Math.max(viewport.height*(1-state.scale),Math.min(0,d.ty+dy*multiplier));transform();
    });
    const end=ev=>{
      if(!state.drag||state.drag.id!==ev.pointerId)return;
      if(state.drag.moved)state.skipClickUntil=Date.now()+250;
      state.drag=null;holder.classList.remove('map-dragging');
      if(svg.hasPointerCapture(ev.pointerId))svg.releasePointerCapture(ev.pointerId);
    };
    svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  }
  function renderMap(geojson){
    if(!Array.isArray(geojson.features)||geojson.features.length!==38)throw new Error('Geometri 38 provinsi tidak lengkap.');
    const unknown=geojson.features.filter(f=>!state.provinceByName.get(normalize(f.properties?.PROVINSI)));
    if(unknown.length)throw new Error('Nama provinsi tidak cocok dengan peta: '+unknown.map(f=>f.properties?.PROVINSI).join(', '));
    const project=createProjection(geojson),frag=document.createDocumentFragment();
    for(const f of geojson.features){
      const record=state.provinceByName.get(normalize(f.properties.PROVINSI));
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',geometryPath(f.geometry,project));path.setAttribute('class','province');
      path.setAttribute('fill-rule','evenodd');path.setAttribute('role','button');path.setAttribute('tabindex','0');
      path.setAttribute('data-province',record.code);path.setAttribute('aria-label',`Lihat statistik ${record.name}`);path.setAttribute('aria-pressed','false');
      path.addEventListener('click',()=>{if(Date.now()>=state.skipClickUntil)selectProvince(record.code);hideTooltip();});
      path.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();selectProvince(record.code);}});
      path.addEventListener('pointermove',ev=>showTooltip(ev,record));path.addEventListener('pointerleave',hideTooltip);
      frag.append(path);
    }
    group.replaceChildren(frag);state.featuresLoaded=true;$('map-status').hidden=true;
    setupNavigation();recolorMap();
  }
  function downloadCsv(){
    const d=getDefinition(state.metric),period=getSeries();
    const columns=['Kode provinsi','Provinsi','Kategori','Indikator','Tahun','Periode','Nilai','Satuan','Sumber'];
    const rows=[columns,...ranking().map(p=>[p.code,p.name,state.catalog.categories[state.category],d.label,state.year,period.label,p.value,d.unit,d.source])];
    const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`indonesia-visualized-${state.metric}-${state.year}.csv`;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function loadCatalog(poverty,added){
    if(!Array.isArray(poverty.provinces)||poverty.provinces.length!==38)throw new Error('Data kemiskinan tidak lengkap.');
    if(!added.indicators||!added.categories)throw new Error('Katalog indikator tidak valid.');
    state.poverty=poverty;state.catalog=added;state.provinces=poverty.provinces.map(p=>({name:p.name,code:String(p.code)}));
    state.provinces.forEach(p=>{state.provinceByCode.set(p.code,p);state.provinceByName.set(normalize(p.name),p);});
    for(const [key,definition] of Object.entries(povertyDefinitions)){
      definitions[key]={category:'poverty',label:definition[0],unit:definition[1],description:definition[2],source:poverty.sources?.[key]??poverty.sources?.bps_original??'https://www.bps.go.id/',notes:'Data kemiskinan Maret 2025, disajikan ulang melalui Pusdatin Kementerian Pertanian.',periods:{'2025':{year:2025,label:'Maret 2025',values:Object.fromEntries(poverty.provinces.map(p=>[String(p.code),p[key]]))}}};
    }
    for(const [key,d] of Object.entries(added.indicators)){
      for(const period of Object.values(d.periods)){
        const codes=Object.keys(period.values);
        if(codes.length!==38||codes.some(c=>!state.provinceByCode.has(c))||codes.some(c=>!Number.isFinite(period.values[c])))throw new Error('Data tidak lengkap untuk '+key);
      }
      definitions[key]=d;
    }
    const cat=$('category');cat.replaceChildren();
    for(const key of defaultCategoryOrder){if(!added.categories[key])continue;const opt=document.createElement('option');opt.value=key;opt.textContent=added.categories[key];cat.append(opt);}
    const provSelect=$('province-select');for(const p of [...state.provinces].sort((a,b)=>a.name.localeCompare(b.name,'id'))){const opt=document.createElement('option');opt.value=p.code;opt.textContent=p.name;provSelect.append(opt);}
    const query=new URLSearchParams(location.search),requestedMetric=query.get('indikator'),requestedCategory=query.get('kategori'),year=query.get('tahun');
    const category=requestedCategory&&added.categories[requestedCategory]?requestedCategory:requestedMetric&&definitions[requestedMetric]?definitions[requestedMetric].category:'population';
    selectCategory(category,requestedMetric,year);
  }
  async function fetchJson(url){const resp=await fetch(url);if(!resp.ok)throw new Error('Berkas data gagal dimuat: '+url);return resp.json();}
  async function start(){
    try{
      const [poverty,added]=await Promise.all([fetchJson('data/poverty-2025.json'),fetchJson('data/catalog-2024-2025.json')]);
      loadCatalog(poverty,added);
      $('category').addEventListener('change',ev=>selectCategory(ev.target.value));
      $('indicator').addEventListener('change',ev=>selectMetric(ev.target.value));
      $('year').addEventListener('change',ev=>changeYear(ev.target.value));
      $('province-select').addEventListener('change',ev=>selectProvince(ev.target.value));
      $('search').addEventListener('input',ev=>{state.search=ev.target.value;renderRanking();});
      $('download-csv').addEventListener('click',downloadCsv);
    }catch(err){console.error('[Indonesia Visualized]',err);$('map-status').textContent=err.message;$('ranking-list').textContent='Data belum tersedia. Coba muat ulang.';return;}
    try{renderMap(await fetchJson('data/indonesia-38-provinces.geojson'));}
    catch(err){console.error('[Indonesia Visualized map]',err);$('map-status').textContent=err.message+' Gunakan daftar provinsi atau tabel di bawah.';}
  }
  start();
})();