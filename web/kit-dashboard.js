// DustBoy Kit: the page the kit itself serves at http://<kit>/ (web_server js_include).
// Same-origin, so it works from any browser on the same Wi-Fi: reads /events (SSE) and the REST JSON.
// Keep it small: it is gzipped into flash. No external assets, no fonts.
const GOOD = 25, FAIR = 50; // same as good_limit / fair_limit in dbk.yaml
const T = {
  title: 'DustBoy Kit', kit: 'Kit ID', live: 'ค่าสด', wait: 'กำลังรอค่า…', air: 'คุณภาพอากาศ',
  rssi: 'สัญญาณ Wi-Fi', up: 'เปิดเครื่องมาแล้ว', ip: 'ที่อยู่เครื่อง', updated: 'อัปเดตล่าสุด',
  lost: 'ขาดการติดต่อ กำลังต่อใหม่…', unit: 'µg/m³', site: 'หน้าตั้งค่า DustBoy Kit',
  GOOD: 'ดี', FAIR: 'ปานกลาง', BAD: 'แย่'
};
const css = `
*{box-sizing:border-box}body{margin:0;font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Thai",sans-serif;background:#f3f5f8;color:#1f2937}
main{max-width:720px;margin:0 auto;padding:20px 16px 32px}
header{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px}
h1{font-size:22px;margin:0;font-weight:700}h1 small{display:block;font-size:13px;color:#6b7280;font-weight:500}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#9ca3af;margin-right:6px;vertical-align:middle}
.dot.on{background:#16a34a}.kit{font:600 15px/1 ui-monospace,Menlo,monospace;padding:8px 12px;border:1px solid #d1d5db;border-radius:10px;background:#fff}
.big{margin-bottom:12px}.grid{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:12px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;min-height:104px;display:flex;flex-direction:column;justify-content:center;min-width:0}
.card small{display:block;font-size:12px;color:#6b7280;letter-spacing:.04em;text-transform:uppercase}
.card b{display:block;margin-top:6px;font:800 clamp(26px,7vw,40px)/1 ui-monospace,Menlo,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.card b.txt{font-size:clamp(13px,4vw,24px)}
.card span{font-size:12px;color:#6b7280}.card.big{text-align:center;padding:22px 16px}
.card.big b{font-size:clamp(56px,20vw,96px)}.GOOD b{color:#15803d}.FAIR b{color:#b45309}.BAD b{color:#b91c1c}
.badge{display:inline-block;margin-top:8px;padding:4px 12px;border-radius:999px;font-weight:600;font-size:14px;background:#e5e7eb}
.GOOD .badge{background:#dcfce7;color:#166534}.FAIR .badge{background:#fef3c7;color:#92400e}.BAD .badge{background:#fee2e2;color:#991b1b}
footer{margin-top:20px;font-size:13px;color:#6b7280;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
footer a{color:#2563eb}
@media(max-width:480px){.grid{grid-template-columns:1fr 1fr}}`;
document.documentElement.lang = 'th';
document.head.insertAdjacentHTML('beforeend', `<meta name=viewport content="width=device-width,initial-scale=1"><title>${T.title}</title><style>${css}</style>`);
document.body.innerHTML = `<main>
<header><h1><span class=dot id=dot></span>${T.title}<small id=sub>${T.wait}</small></h1><div class=kit><span style="color:#6b7280;font-weight:500">${T.kit}</span> <span id=kit>—</span></div></header>
<div class="card big" id=c25><small>PM2.5</small><b id=pm2_5>—</b><span>${T.unit}</span><br><span class=badge id=aq>${T.wait}</span></div>
<div class=grid>
 <div class=card><small>PM1.0</small><b id=pm1_0>—</b><span>${T.unit}</span></div>
 <div class=card><small>PM10</small><b id=pm10>—</b><span>${T.unit}</span></div>
 <div class=card><small>${T.rssi}</small><b id=rssi>—</b><span>dBm</span></div>
 <div class=card><small>${T.up}</small><b class=txt id=uptime>—</b><span>&nbsp;</span></div>
 <div class=card><small>${T.ip}</small><b class=txt id=ip_address>${location.hostname}</b><span>&nbsp;</span></div>
 <div class=card><small>${T.updated}</small><b class=txt id=ts>—</b><span>&nbsp;</span></div>
</div>
<footer><span></span><a href="https://dustboy-kit.github.io/esp32c3-pm25-monitor/" target=_blank rel=noopener>${T.site}</a></footer>
</main>`;
const $ = id => document.getElementById(id);
const cls = v => v <= GOOD ? 'GOOD' : v <= FAIR ? 'FAIR' : 'BAD';
function up(s){s=Math.round(s);const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return d?`${d} วัน ${h} ชม.`:h?`${h} ชม. ${m} น.`:`${m} นาที`}
function apply(id, value, state) {
  let key = id.replace(/^[a-z_]+-/, ''); if (/rssi/.test(key)) key = 'rssi'; if (key === 'kit_id') key = 'kit';
  const el = $(key); if (!el) return;
  if (key === 'uptime') el.textContent = up(+value);
  else if (key === 'kit') el.textContent = state || '—';
  else if (key === 'ip_address') el.textContent = state || '—';
  else if (key === 'air_quality_level') { if (T[state]) { $('aq').textContent = T[state]; $('aq').dataset.fw = '1'; $('c25').className = 'card big ' + state; } else delete $('aq').dataset.fw; }
  else el.textContent = Number.isFinite(+value) ? Math.round(+value) : (state || '—');
  if (key === 'pm2_5' && Number.isFinite(+value)) { const c = cls(+value); $('c25').className = 'card big ' + c; if (!$('aq').dataset.fw) $('aq').textContent = T[c]; }
  $('ts').textContent = new Date().toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit', second: '2-digit'}); $('sub').textContent = T.live;
}
async function seed() {
  const paths = ['sensor/pm2_5','sensor/pm1_0','sensor/pm10','sensor/wi-fi_rssi','sensor/wi_fi_rssi','sensor/uptime','text/kit_id','text_sensor/air_quality_level','text_sensor/ip_address'];
  for (const p of paths) { try { const r = await fetch('/' + p); if (r.ok) { const j = await r.json(); apply(j.id || p.replace('/', '-'), j.value, j.state); } } catch {} }
}
let es, retry;
function connect() {
  es = new EventSource('/events');
  es.onopen = () => { $('dot').className = 'dot on'; $('sub').textContent = T.live; };
  es.addEventListener('state', e => { try { const j = JSON.parse(e.data); apply(j.id, j.value, j.state); } catch {} });
  es.onerror = () => { $('dot').className = 'dot'; $('sub').textContent = T.lost; es.close(); clearTimeout(retry); retry = setTimeout(connect, 4000); };
}
seed(); connect(); setInterval(seed, 30000);
