export const boardLesson = {
  title: 'รู้จักบอร์ด DustBoy Kit',
  pins: [
    {part:'เซนเซอร์ PMS7003', pin:'5V, GND', to:'ไฟ 5V และ GND', power:'5V + GND'},
    {part:'เซนเซอร์ PMS7003', pin:'TX → GPIO6', to:'บอร์ด RX (รับข้อมูล)', power:'—'},
    {part:'เซนเซอร์ PMS7003', pin:'RX ← GPIO7', to:'บอร์ด TX (ส่งข้อมูล)', power:'—'},
    {part:'เซนเซอร์ PMS7003', pin:'SET → GPIO5 (ค้างระดับสูง)', to:'บอร์ด GPIO5', power:'—'},
    {part:'เซนเซอร์ PMS7003', pin:'RESET → GPIO8 (ค้างระดับสูง)', to:'บอร์ด GPIO8', power:'—'},
    {part:'จอ OLED', pin:'3V3, GND', to:'ไฟ 3V3 และ GND', power:'3V3 + GND'},
    {part:'จอ OLED', pin:'SDA → GPIO9 · SCL → GPIO10', to:'บอร์ด GPIO9 / GPIO10', power:'—'},
    {part:'ไฟ RGB WS2812', pin:'DATA → GPIO2', to:'บอร์ด GPIO2', power:'รับไฟจากบอร์ด'},
  ],
  parts: [
    {id:'board', name:'บอร์ด ESP32-C3 SuperMini', title:'สมองของชุด รับค่าจากเซนเซอร์แล้วสั่งจอกับไฟ', pins:'แฟลช 4MB · USB-C · 2 แถว แถวละ 8 ขา', position:[0,0,0], color:'#087f5b'},
    {id:'sensor', name:'เซนเซอร์ฝุ่น PMS7003', title:'พัดลมดูดอากาศเข้ามาวัดฝุ่น แล้วส่งค่าให้บอร์ด', pins:'5V, GND, TX→GPIO6, RX←GPIO7, SET→GPIO5, RESET→GPIO8', position:[-2.35,.12,0], color:'#dbe3ea'},
    {id:'oled', name:'จอ OLED', title:'แสดงค่าฝุ่น PM2.5 ที่อ่านได้', pins:'3V3, GND, SDA→GPIO9, SCL→GPIO10 · I²C 0x3C · 400kHz', position:[2.25,.55,0], color:'#111827'},
    {id:'led', name:'ไฟ RGB WS2812', title:'บอกระดับค่าฝุ่นด้วยสี', pins:'DATA→GPIO2 · สีข้อมูล GRB · ปรับความสว่าง 4%', position:[3.0,.8,.4], color:'#16a34a'},
  ],
  wires: [
    {from:'sensor',fromPin:'5V',boardPin:'5V',to:'board',color:'#ef4444'}, {from:'sensor',fromPin:'GND',boardPin:'GND',to:'board',color:'#111827'},
    {from:'sensor',fromPin:'TX',boardPin:'GPIO6',to:'board',color:'#f97316'}, {from:'sensor',fromPin:'RX',boardPin:'GPIO7',to:'board',color:'#2563eb'},
    {from:'sensor',fromPin:'SET',boardPin:'GPIO5',to:'board',color:'#16a34a'}, {from:'sensor',fromPin:'RESET',boardPin:'GPIO8',to:'board',color:'#9333ea'},
    {from:'oled',fromPin:'3V3',boardPin:'3V3',to:'board',color:'#ef4444'}, {from:'oled',fromPin:'GND',boardPin:'GND',to:'board',color:'#111827'}, {from:'oled',fromPin:'SDA',boardPin:'GPIO9',to:'board',color:'#a855f7'}, {from:'oled',fromPin:'SCL',boardPin:'GPIO10',to:'board',color:'#0284c7'},
    {from:'led',fromPin:'5V',boardPin:'5V',to:'board',color:'#ef4444'}, {from:'led',fromPin:'GND',boardPin:'GND',to:'board',color:'#111827'}, {from:'led',fromPin:'DATA',boardPin:'GPIO2',to:'board',color:'#eab308'},
  ],
  sensor: {uart:'UART 9600 8N1', warmupSeconds:30, noDataSeconds:10},
  colors: [{max:25,color:'#16a34a',label:'ดี'}, {max:50,color:'#eab308',label:'เริ่มสูง'}, {max:150,color:'#dc2626',label:'สูง'}],
  missingColor: {color:'#a855f7',label:'ไม่มีข้อมูล'},
  worksheet: {
    objective:'รู้จักส่วนประกอบและอธิบายการต่อสายของ DustBoy Kit ได้',
    steps:['หมุนภาพสามมิติ แล้วแตะดูหน้าที่ของเซนเซอร์ จอ และไฟ','ปรับแถบค่าฝุ่น แล้วจดว่าสีไฟเปลี่ยนที่ค่าใด','ดูภาพต่อสาย แล้วจับคู่ชื่อขากับชิ้นส่วน'],
    questions:['ทำไมขา TX ของเซนเซอร์จึงต่อเข้าขา RX ของบอร์ด?','ไฟสีม่วงหมายถึงอะไร?','คาดว่าค่าฝุ่นใกล้ควันจากการทำอาหารจะเปลี่ยนอย่างไร?'],
  },
};
