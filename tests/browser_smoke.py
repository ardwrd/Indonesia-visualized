"""Playwright smoke test. Temporary geometry and poverty fixture are not committed."""
import http.server, json, shutil, threading, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
from sys import path
path.insert(0,str(ROOT/'scripts'))
from build_catalog import PROVINCES

with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)
    (root/'data').mkdir()
    for name in ['index.html','styles.css','app.js']:
        shutil.copy(ROOT/name,root/name)
    shutil.copy(ROOT/'data/catalog-2024-2025.json',root/'data/catalog-2024-2025.json')
    provinces=[];features=[]
    for i,(code,name) in enumerate(PROVINCES):
        provinces.append({'code':code,'name':name,'poverty_rate':4+i/3,'poor_population_thousand':100+i*13,'poverty_gap':1+i/50,'poverty_severity':.2+i/100,'poverty_line':650000+i*1000})
        x=95+(i%11)*3.4;y=-9+(i//11)*3.2
        coords=[[x,y],[x+2,y],[x+2,y+2],[x,y+2],[x,y]]
        features.append({'type':'Feature','properties':{'PROVINSI':name},'geometry':{'type':'Polygon','coordinates':[coords]}})
    (root/'data/poverty-2025.json').write_text(json.dumps({'provinces':provinces,'sources':{'poverty_rate':'https://www.bps.go.id/'}}))
    (root/'data/indonesia-38-provinces.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features}))
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
        def log_message(self,*args):pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),H)
    t=threading.Thread(target=server.serve_forever,daemon=True);t.start()
    url=f'http://127.0.0.1:{server.server_port}'
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        for width,height in [(320,740),(393,852),(1280,900)]:
            page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.set_content((root/'index.html').read_text(encoding='utf-8').replace('<script defer src="app.js?v=3"></script>','').replace('<link rel="stylesheet" href="styles.css?v=3">',''))
            page.add_style_tag(content=(root/'styles.css').read_text(encoding='utf-8'))
            mock_files={
                'data/poverty-2025.json':json.loads((root/'data/poverty-2025.json').read_text()),
                'data/catalog-2024-2025.json':json.loads((root/'data/catalog-2024-2025.json').read_text()),
                'data/indonesia-38-provinces.geojson':json.loads((root/'data/indonesia-38-provinces.geojson').read_text()),
            }
            page.evaluate('files => {window.fetch = async path => ({ok: !!files[path],json:async()=>files[path]});}', mock_files)
            page.add_script_tag(content=(root/'app.js').read_text(encoding='utf-8'))
            page.wait_for_selector('path.province')
            assert page.locator('path.province').count()==38
            assert page.locator('#ranking-list button.rank-item').count()==38
            assert '2025' in page.locator('#map-subtitle').inner_text()
            assert page.locator('#category option').count()==7
            # 2025 default population
            assert page.locator('#indicator').input_value()=='population_total'
            assert page.locator('#year option').count()==2
            page.locator('#category').select_option('labor')
            assert page.locator('#indicator').input_value()=='unemployment_feb'
            assert page.locator('#year').is_disabled()
            page.locator('#indicator').select_option('unemployment_aug')
            page.evaluate("() => {let s=document.getElementById('province-select');s.value='32';s.dispatchEvent(new Event('change',{bubbles:true}))}")
            assert 'Jawa Barat' in page.locator('#detail-heading').inner_text()
            assert '6,77' in page.locator('#selected-value').inner_text()
            page.locator('#category').select_option('human')
            assert page.locator('#indicator').input_value()=='human_development_index'
            page.locator('#year').select_option('2024')
            assert page.locator('#map-subtitle').inner_text().startswith('2024')
            page.evaluate("() => {let s=document.getElementById('province-select');s.value='97';s.dispatchEvent(new Event('change',{bubbles:true}))}")
            assert '54,43' in page.locator('#selected-value').inner_text()
            # Switching to metric without year 2024 must select 2025 automatically.
            page.locator('#category').select_option('education')
            assert page.locator('#year').input_value()=='2025'
            assert page.locator('#year').is_disabled()
            assert '4,76' in page.locator('#selected-value').inner_text()
            page.locator('#category').select_option('poverty')
            assert page.locator('#indicator').input_value()=='poverty_rate'
            assert 'Maret 2025' in page.locator('#detail-date').inner_text()
            page.locator('#search').fill('papua')
            assert page.locator('#ranking-list button.rank-item').count()>=4
            page.locator('#search').fill('')
            page.locator('#zoom-in').click()
            assert 'scale(1.500)' in page.locator('#map-geometry').get_attribute('transform')
            page.locator('#zoom-reset').click()
            assert 'scale(1.000)' in page.locator('#map-geometry').get_attribute('transform')
            dimensions=page.evaluate('({scroll:document.documentElement.scrollWidth,inner:window.innerWidth})')
            assert dimensions['scroll']<=dimensions['inner']+1,dimensions
            assert not errors,errors
            page.locator('#category').select_option('economy')
            page.screenshot(path=str(ROOT/f'preview-{width}.png'),full_page=(width==393))
            print('PASS:',width,'px; categories=7; map=38; sorting, year changes, province lookup, zoom, no overflow')
            page.close()
        browser.close()
    server.shutdown()