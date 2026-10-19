/* Indonesia Visualized · zero-framework map explorer. Public BPS snapshot, no analytics. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const METRICS = {
    poverty_rate: {label:'Persentase penduduk miskin',unit:'%',description:'Proporsi penduduk yang pengeluaran per kapitanya berada di bawah garis kemiskinan.'},
    poor_population_thousand: {label:'Jumlah penduduk miskin',unit:'ribu jiwa',description:'Perkiraan jumlah penduduk miskin dalam ribu jiwa. Jumlah tidak dapat dibandingkan sebagai persentase.'},
    poverty_gap: {label:'Indeks kedalaman kemiskinan (P1)',unit:'indeks',description:'Rata-rata kesenjangan pengeluaran penduduk miskin terhadap garis kemiskinan.'},
    poverty_severity: {label:'Indeks keparahan kemiskinan (P2)',unit:'indeks',description:'Indeks yang memberikan bobot lebih besar pada kesenjangan pengeluaran lebih jauh dari garis kemiskinan.'},
    poverty_line: {label:'Garis kemiskinan',unit:'Rp/kapita/bulan',description:'Nilai pengeluaran minimum per kapita per bulan untuk memenuhi kebutuhan dasar menurut metode BPS.'}
  };
  const number = new Intl.NumberFormat('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});
  const integer = new Intl.NumberFormat('id-ID',{maximumFractionDigits:0});
  const normalize = name => String(name??'').toLocaleLowerCase('id-ID').normalize('NFKD')
    .replace(/daerah istimewa yogyakarta|d\.?i\.? yogyakarta/g,'di yogyakarta').replace(/[^a-z0-9]/g,'');
  const state = {data:null,features:[],metric:'poverty_rate',selected:null,scale:1,tx:0,ty:0,search:'',drag:null,skipClickUntil:0};
  const dataByName = new Map();
  const viewport = {width:1000,height:445};
  const svg = $('map-svg');
  const group = $('map-geometry');
  const holder = $('map-holder');

  function valueText(value,metric=state.metric){
    if(!Number.isFinite(value)) return '—';
    return metric==='poverty_line'?'Rp '+integer.format(value):number.format(value);
  }
  function metricUnit(metric=state.metric){return METRICS[metric].unit;}
  function records(){return [...state.data.provinces].sort((a,b)=>b[state.metric]-a[state.metric]);}
  function resolveName(name){return dataByName.get(normalize(name));}
  function formatLabel(value){return valueText(value);}

  function updateSummary(){
    const list=records(), vals=list.map(p=>p[state.metric]).sort((a,b)=>a-b);
    $('stat-max').textContent=valueText(list[0][state.metric]);
    $('stat-max-name').textContent=list[0].name;
    $('stat-min').textContent=valueText(list[list.length-1][state.metric]);
    $('stat-min-name').textContent=list[list.length-1].name;
    $('stat-median').textContent=valueText((vals[18]+vals[19])/2);
    $('legend-low').textContent=valueText(vals[0]);
    $('legend-high').textContent=valueText(vals[vals.length-1]);
  }

  function updateDetail(){
    const record=state.data.provinces.find(p=>p.code===state.selected);
    $('detail-empty').hidden=Boolean(record);
    $('detail-filled').hidden=!record;
    $('province-select').value=record?.code??'';
    if(!record)return;
    $('detail-heading').textContent=record.name;
    $('selected-value').textContent=valueText(record[state.metric]);
    $('selected-unit').textContent=metricUnit();
    const rank=records().findIndex(p=>p.code===record.code)+1;
    $('selected-foot').textContent=`Peringkat ${rank} dari 38 provinsi (nilai tertinggi lebih dulu)`;
    $('detail-desc').textContent='Data BPS · Maret 2025';
  }

  function chooseProvince(code,scrollToMap=false){
    const record=state.data.provinces.find(p=>p.code===String(code));
    if(!record)return;
    state.selected=record.code;
    updateDetail();
    group.querySelectorAll('.province').forEach(el=>{
      const active=el.dataset.province===record.code;
      el.classList.toggle('is-selected',active);
      el.setAttribute('aria-pressed',String(active));
    });
    paintRanking();
    if(scrollToMap&&window.matchMedia('(max-width:740px)').matches){
      holder.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'});
    }
  }

  function paintRanking(){
    const all=records(),max=all[0][state.metric];
    const visible=all.filter(p=>normalize(p.name).includes(normalize(state.search)));
    const target=$('ranking-list');target.replaceChildren();
    if(!visible.length){const empty=document.createElement('p');empty.className='empty-rank';empty.textContent='Tidak ada provinsi yang cocok.';target.append(empty);return;}
    const frag=document.createDocumentFragment();
    visible.forEach(p=>{
      const rank=all.findIndex(x=>x.code===p.code)+1;
      const row=document.createElement('button');row.type='button';row.className='rank-item'+(state.selected===p.code?' active':'');
      row.setAttribute('aria-label',`${p.name}: ${valueText(p[state.metric])} ${metricUnit()}, peringkat ${rank}`);
      const loc=document.createElement('span');loc.className='rank-location';
      const seq=document.createElement('span');seq.className='rank-n';seq.textContent=String(rank).padStart(2,'0');
      const name=document.createElement('strong');name.textContent=p.name;loc.append(seq,name);
      const val=document.createElement('span');val.className='rank-metric';
      const meter=document.createElement('span');meter.className='rank-bar';meter.setAttribute('aria-hidden','true');
      const fill=document.createElement('i');fill.style.width=`${Math.max(2,p[state.metric]/max*100)}%`;meter.append(fill);
      const text=document.createElement('span');text.textContent=formatLabel(p[state.metric]);val.append(meter,text);
      row.append(loc,val);row.addEventListener('click',()=>chooseProvince(p.code,true));frag.append(row);
    });target.append(frag);
  }

  function palette(value,min,max){
    const t=max===min?0.5:Math.min(1,Math.max(0,(value-min)/(max-min)));
    const stops=[[229,239,251],[185,210,241],[123,169,223],[59,121,198],[24,76,152]];
    const scaled=t*(stops.length-1),i=Math.min(stops.length-2,Math.floor(scaled)),u=scaled-i;
    return 'rgb('+stops[i].map((v,k)=>Math.round(v+(stops[i+1][k]-v)*u)).join(',')+')';
  }
  function repaintMap(){
    const values=state.data.provinces.map(p=>p[state.metric]);
    const min=Math.min(...values),max=Math.max(...values);
    group.querySelectorAll('.province').forEach(el=>{
      const p=state.data.provinces.find(x=>x.code===el.dataset.province);
      el.setAttribute('fill',p?palette(p[state.metric],min,max):'#cbd5e1');
      el.classList.toggle('is-selected',Boolean(p&&p.code===state.selected));
    });
  }
  function setMetric(key){
    if(!METRICS[key]||!state.data)return;
    state.metric=key;
    $('indicator').value=key;
    $('map-title').textContent=METRICS[key].label;
    $('table-indicator').textContent=METRICS[key].label;
    $('metric-explanation').textContent=METRICS[key].description;
    $('original-source').href=state.data.sources?.[key]??'https://www.bps.go.id/';
    updateSummary();updateDetail();paintRanking();repaintMap();
    if(['http:','https:'].includes(location.protocol)){
      const query=new URLSearchParams(location.search);query.set('indikator',key);
      history.replaceState(null,'',location.pathname+'?'+query.toString()+location.hash);
    }
  }

  // Geometry is deliberately projected ring-by-ring. This avoids the global-sphere
  // inversion caused by counterclockwise exterior GeoJSON rings in d3.geoMercator.fitExtent.
  // All path coordinates share one fixed projection. SVG viewBox handles responsive sizing.
  function allCoordinates(geometry){
    const out=[];
    function recurse(part){
      if(!Array.isArray(part))return;
      if(typeof part[0]==='number'&&typeof part[1]==='number'){out.push(part);return;}
      part.forEach(recurse);
    }
    recurse(geometry.coordinates);return out;
  }
  function projectFactory(geojson){
    const coords=geojson.features.flatMap(f=>allCoordinates(f.geometry));
    if(!coords.length)throw new Error('Koordinat peta tidak tersedia.');
    const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);
    const lowX=Math.min(...xs), highX=Math.max(...xs),lowY=Math.min(...ys),highY=Math.max(...ys);
    if(![lowX,highX,lowY,highY].every(Number.isFinite)||highX-lowX<1||highY-lowY<1)throw new Error('Rentang koordinat tidak valid.');
    const padX=28,padY=24;
    const scale=Math.min((viewport.width-2*padX)/(highX-lowX),(viewport.height-2*padY)/(highY-lowY));
    const left=(viewport.width-(highX-lowX)*scale)/2;
    const top=(viewport.height-(highY-lowY)*scale)/2;
    return point=>[left+(point[0]-lowX)*scale,top+(highY-point[1])*scale];
  }
  function ringPath(ring,project){return ring.map((point,i)=>{const [x,y]=project(point);return (i?'L':'M')+x.toFixed(2)+','+y.toFixed(2);}).join('')+'Z';}
  function polygonPath(geo,project){
    const polys=geo.type==='Polygon'?[geo.coordinates]:geo.type==='MultiPolygon'?geo.coordinates:null;
    if(!polys)throw new Error('Jenis geometri tidak didukung: '+geo.type);
    return polys.map(poly=>poly.map(r=>ringPath(r,project)).join('')).join('');
  }

  function showTip(ev,record){
    if(ev.pointerType==='touch'||state.drag?.moved)return;
    const tip=$('tooltip');
    tip.replaceChildren();const t=document.createElement('strong');t.textContent=record.name;
    const v=document.createElement('span');v.textContent=valueText(record[state.metric])+' '+metricUnit();tip.append(t,v);
    tip.hidden=false;
    const r=holder.getBoundingClientRect();
    tip.style.left=Math.max(6,Math.min(ev.clientX-r.left+12,r.width-tip.offsetWidth-6))+'px';
    tip.style.top=Math.max(6,Math.min(ev.clientY-r.top-45,r.height-tip.offsetHeight-6))+'px';
  }
  function hideTip(){$('tooltip').hidden=true;}

  function applyTransform(){
    group.setAttribute('transform',`translate(${state.tx.toFixed(2)},${state.ty.toFixed(2)}) scale(${state.scale.toFixed(3)})`);
    holder.classList.toggle('map-zoomed',state.scale>1.01);
  }
  function scaleTo(next,cx=viewport.width/2,cy=viewport.height/2){
    const k=Math.max(1,Math.min(8,next)),ratio=k/state.scale;
    state.tx=cx+(state.tx-cx)*ratio;
    state.ty=cy+(state.ty-cy)*ratio;
    state.scale=k;
    // Keep at least the map viewport covered, so drag never loses the entire map.
    state.tx=Math.max(viewport.width*(1-k),Math.min(0,state.tx));
    state.ty=Math.max(viewport.height*(1-k),Math.min(0,state.ty));
    if(k===1){state.tx=0;state.ty=0;}
    applyTransform();
  }
  function setupNavigation(){
    $('zoom-in').addEventListener('click',()=>scaleTo(state.scale*1.5));
    $('zoom-out').addEventListener('click',()=>scaleTo(state.scale/1.5));
    $('zoom-reset').addEventListener('click',()=>scaleTo(1));
    svg.addEventListener('wheel',ev=>{
      if(!ev.ctrlKey){return;} // Preserve normal trackpad/page scrolling without trapping the user.
      ev.preventDefault();
      const rect=svg.getBoundingClientRect();
      const ratio=viewport.width/rect.width;
      scaleTo(state.scale*(ev.deltaY<0?1.2:1/1.2),(ev.clientX-rect.left)*ratio,(ev.clientY-rect.top)*ratio);
    },{passive:false});
    svg.addEventListener('pointerdown',ev=>{
      if(state.scale<=1||ev.button!==0)return;
      state.drag={id:ev.pointerId,x:ev.clientX,y:ev.clientY,tx:state.tx,ty:state.ty,moved:false};
      hideTip();
    });
    svg.addEventListener('pointermove',ev=>{
      const d=state.drag;
      if(!d||d.id!==ev.pointerId)return;
      const dx=ev.clientX-d.x,dy=ev.clientY-d.y;
      if(Math.abs(dx)+Math.abs(dy)>6&&!d.moved){
        d.moved=true;svg.setPointerCapture(ev.pointerId);holder.classList.add('map-dragging');
      }
      if(!d.moved)return;
      const multiplier=viewport.width/svg.getBoundingClientRect().width;
      const k=state.scale;
      state.tx=Math.max(viewport.width*(1-k),Math.min(0,d.tx+dx*multiplier));
      state.ty=Math.max(viewport.height*(1-k),Math.min(0,d.ty+dy*multiplier));
      applyTransform();
    });
    const endDrag=ev=>{
      if(!state.drag||state.drag.id!==ev.pointerId)return;
      if(state.drag.moved)state.skipClickUntil=Date.now()+250;
      state.drag=null;holder.classList.remove('map-dragging');
      if(svg.hasPointerCapture(ev.pointerId))svg.releasePointerCapture(ev.pointerId);
    };
    svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
  }

  function renderMap(geojson){
    if(!Array.isArray(geojson.features)||geojson.features.length!==38)throw new Error('Geometri 38 provinsi tidak lengkap.');
    const unknown=geojson.features.filter(f=>!resolveName(f.properties?.PROVINSI));
    if(unknown.length)throw new Error('Nama provinsi pada peta tidak cocok dengan data: '+unknown.map(x=>x.properties.PROVINSI).join(', '));
    const project=projectFactory(geojson);
    group.replaceChildren();
    const frag=document.createDocumentFragment();
    geojson.features.forEach(f=>{
      const record=resolveName(f.properties.PROVINSI);
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',polygonPath(f.geometry,project));
      path.setAttribute('class','province');path.setAttribute('fill-rule','evenodd');
      path.setAttribute('role','button');path.setAttribute('tabindex','0');
      path.setAttribute('data-province',record.code);
      path.setAttribute('aria-label',`Lihat statistik ${record.name}`);path.setAttribute('aria-pressed','false');
      path.addEventListener('click',()=>{if(Date.now()>=state.skipClickUntil)chooseProvince(record.code);hideTip();});
      path.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();chooseProvince(record.code);}});
      path.addEventListener('pointermove',ev=>showTip(ev,record));
      path.addEventListener('pointerleave',hideTip);
      frag.append(path);
    });
    group.append(frag);$('map-status').hidden=true;
    setupNavigation();repaintMap();
  }

  function downloadCsv(){
    const metric=state.metric;
    const rows=[['Kode Provinsi','Provinsi','Periode',METRICS[metric].label,'Satuan'],...records().map(p=>[p.code,p.name,'Maret 2025',p[metric],metricUnit()])];
    const csv='\ufeff'+rows.map(row=>row.map(cell=>'"'+String(cell).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`indonesia-visualized-${metric}-2025.csv`;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1200);
  }
  async function start(){
    try{
      const response=await fetch('data/poverty-2025.json');
      if(!response.ok)throw new Error('Data statistik gagal dimuat.');
      const data=await response.json();
      if(!Array.isArray(data.provinces)||data.provinces.length!==38)throw new Error('Statistik 38 provinsi belum lengkap.');
      state.data=data;
      for(const p of data.provinces)dataByName.set(normalize(p.name),p);
      for(const p of [...data.provinces].sort((a,b)=>a.name.localeCompare(b.name,'id'))){
        const opt=document.createElement('option');opt.value=p.code;opt.textContent=p.name;$('province-select').append(opt);
      }
      $('indicator').addEventListener('change',ev=>setMetric(ev.target.value));
      $('province-select').addEventListener('change',ev=>chooseProvince(ev.target.value));
      $('search').addEventListener('input',ev=>{state.search=ev.target.value;paintRanking();});
      $('download-csv').addEventListener('click',downloadCsv);
      const initial=new URLSearchParams(location.search).get('indikator');
      setMetric(METRICS[initial]?initial:'poverty_rate');
      const mapResponse=await fetch('data/indonesia-38-provinces.geojson');
      if(!mapResponse.ok)throw new Error('Berkas geometri peta tidak ditemukan.');
      renderMap(await mapResponse.json());
    }catch(error){
      console.error('[Indonesia Visualized]',error);
      $('map-status').textContent=error.message+' Gunakan daftar provinsi untuk membaca data.';
      $('map-status').hidden=false;
      if(!state.data){$('ranking-list').textContent='Data belum tersedia. Jalankan menggunakan HTTP server.';}
    }
  }
  start();
})();