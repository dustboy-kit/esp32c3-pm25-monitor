/* Extracted unchanged from tools/screen-gallery.html: all 30 OLED screens. */
"use strict";
/* =====================================================================
   THE 30 SCREENS. Each draw body is used as authored, against the
   d / t / S surface. font_value carries ONLY " 0123456789" and
   font_icons ONLY U+F05A9 / U+F05AA, so anything else on this panel
   is either drawn from primitives or sent to header/label.
   ===================================================================== */
var SCREENS = [
  {
    id: "seg-clock",
    name: "Segment Clock",
    concept: "A full-width HH:MM wall clock drawn as four 24x28 seven-segment digits, with a vertical seconds column on the right edge.",
    teaches: "When no font is big enough, stop looking for a font: a digit is seven rectangles, and a lookup table of seven bits per numeral turns fillRect into any type size you want.",
    animated: "t drives two things: the colon blinks (on for 700ms of every 1000ms, so the panel visibly proves the render loop is alive), and the right-hand column fills bottom-up with (t/1000)%60 as a 60-second sweep. The digits themselves come from S.hhmm and only change on the minute.",
    draw: function (d, t, S) {
    var SEG=['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'];
    function seg7(n,x,y,w,h,th){
      var s=SEG[n],vh=(h-3*th)/2;
      if(s.charAt(0)==='1') d.fillRect(x+th,y,w-2*th,th);
      if(s.charAt(1)==='1') d.fillRect(x+w-th,y+th,th,vh);
      if(s.charAt(2)==='1') d.fillRect(x+w-th,y+2*th+vh,th,vh);
      if(s.charAt(3)==='1') d.fillRect(x+th,y+h-th,w-2*th,th);
      if(s.charAt(4)==='1') d.fillRect(x,y+2*th+vh,th,vh);
      if(s.charAt(5)==='1') d.fillRect(x,y+th,th,vh);
      if(s.charAt(6)==='1') d.fillRect(x+th,y+th+vh,w-2*th,th);
    }
    var hm=(''+(S&&S.hhmm?S.hhmm:'09:41')).replace(':','');
    if(hm.length<4) hm='0'+hm;
    var xs=[2,28,62,88];
    for(var i=0;i<4;i++) seg7(+hm.charAt(i),xs[i],2,24,28,4);
    if(t%1000<700){ d.fillRect(53,8,4,4); d.fillRect(53,20,4,4); }
    d.rect(116,2,10,28);
    var fh=Math.round(24*((t/1000)%60)/60);
    if(fh>0) d.fillRect(118,28-fh,6,fh);
    }
  },
  {
    id: "outdoor-countdown",
    name: "Outdoor Window",
    concept: "A countdown to the end of the clean-air window when the kids can still play outside, with a full-width bar that drains as the time runs out.",
    teaches: "A depleting bar answers 'how much is left?' before the eye has read a single digit — and at 1 bit, urgency is inversion, not colour: the last minute flashes the bar solid black instead of turning it red.",
    animated: "t runs the countdown at 10x demo speed (100ms of real time = 1 counted second), so the full 25:00 window drains in 2.5 minutes and the bar visibly shortens. Under 60 seconds left, t%600 flips the whole bar between solid-filled and outline at ~2Hz.",
    draw: function (d, t, S) {
    var total=1500;
    var left=total-(Math.floor(t/100)%total);
    var mm=Math.floor(left/60), ss=left%60;
    var pad=function(n){ return (n<10?'0':'')+n; };
    d.print(0,0,'label','TL','OUTDOOR OK');
    d.print(127,0,'label','TR','PM2.5 '+Math.round(S&&S.pm25!=null?S.pm25:12));
    d.hline(0,9,128);
    d.print(61,18,'value','CR',pad(mm));
    d.print(68,18,'value','CL',pad(ss));
    d.fillRect(63,14,3,3);
    d.fillRect(63,21,3,3);
    var urgent=left<=60;
    if(urgent&&t%600<300){
      d.fillRect(0,26,128,6);
    }else{
      d.rect(0,26,128,6);
      var w=Math.round(126*left/total);
      if(w>0) d.fillRect(1,27,w,4);
    }
    }
  },
  {
    id: "pomo-dial",
    name: "Pomodoro Dial",
    concept: "A 25-minute focus / 5-minute break timer: a 24-tick dial with a sweeping hand on the left, the remaining MM:SS and the completed-session squares on the right.",
    teaches: "Quantise circular progress. A smooth arc on a 1-bit panel turns into a ragged staircase, but 24 discrete ticks — hollow pixel for 'not yet', fat blob for 'done' — read cleanly and give the eye something countable.",
    animated: "t%30000 compresses the whole 30-minute pomodoro into a 30-second demo cycle. That phase drives three things at once: how many of the 24 ring ticks are filled, the angle of the centre hand, and the counting-down MM:SS. Math.floor(t/30000)%4 fills the session squares top-right, and the label swaps FOCUS/BREAK at the 25/30 boundary.",
    draw: function (d, t, S) {
    var cycle=30000;
    var p=(t%cycle)/cycle;
    var focus=p<0.8333;
    var phase=focus?p/0.8333:(p-0.8333)/0.1667;
    var secs=Math.ceil((focus?1500:300)*(1-phase));
    var mm=Math.floor(secs/60), ss=secs%60;
    var pad=function(n){ return (n<10?'0':'')+n; };
    var done=Math.floor(t/cycle)%4;
    var lit=Math.round(24*phase);
    for(var i=0;i<24;i++){
      var a=-Math.PI/2+i*Math.PI/12;
      var cx=16+Math.round(13*Math.cos(a)), cy=16+Math.round(13*Math.sin(a));
      if(i<lit) d.fillCircle(cx,cy,1); else d.px(cx,cy);
    }
    var ha=-Math.PI/2+2*Math.PI*phase;
    d.line(16,16,16+Math.round(9*Math.cos(ha)),16+Math.round(9*Math.sin(ha)));
    d.print(36,0,'header','TL',focus?'FOCUS':'BREAK');
    d.print(60,21,'value','CR',pad(mm));
    d.print(67,21,'value','CL',pad(ss));
    d.fillRect(62,17,3,3);
    d.fillRect(62,24,3,3);
    for(var k=0;k<4;k++){
      if(k<done) d.fillRect(97+k*8,2,7,7); else d.rect(97+k*8,2,7,7);
    }
    }
  },
  {
    id: "ota-marching",
    name: "Marching Progress",
    concept: "An over-the-air firmware update bar whose fill is packed with 45-degree stripes that march forward, plus a percentage and a hand-drawn % sign.",
    teaches: "Motion is the proof of life. A percentage that sits at 47 for thirty seconds looks like a crash; the same 47% with stripes marching inside it reads as 'still working'. The texture, not the number, carries the reassurance.",
    animated: "Two independent clocks off t. (t/100)%101 walks the percentage 0-100 over ~10s, growing the fill width. Separately Math.floor(t/60)%6 shifts the diagonal stripe phase by one pixel every 60ms, so the hatching slides continuously even while the number is stuck. Each stripe is one d.line, hand-clipped to the fill rectangle by intersecting the 45-degree edge.",
    draw: function (d, t, S) {
    var pct=Math.floor((t/100)%101);
    d.print(0,0,'label','TL','OTA  dbk-c3-01');
    d.print(113,1,'label','TR',pct<100?'FLASHING':'VERIFY');
    d.print(127,0,'icons','TR',String.fromCharCode(0xDB81,(S&&S.wifi)?0xDDA9:0xDDAA));
    d.rect(0,12,84,18);
    var ix=2, iy=14, iw=80, ih=13;
    var fw=Math.round(iw*pct/100);
    var ph=Math.floor(t/60)%6;
    for(var k=-ih+ph;k<fw;k+=6){
      var ax=k, ay=0, ex=k+ih, ey=ih;
      if(ax<0){ ay=-ax; ax=0; }
      if(ex>fw){ ey=fw-k; ex=fw; }
      if(ey>ay) d.line(ix+ax,iy+ay,ix+ex,iy+ey);
    }
    d.print(114,20,'value','CR',''+pct);
    d.rect(117,15,3,3);
    d.line(117,24,123,16);
    d.rect(121,22,3,3);
    }
  },
  {
    id: "week-and-day",
    name: "Week and Day",
    concept: "A calendar page: weekday, day number, month and year on the left, a seven-column week strip with today boxed on the right, and a 24-hour track for today along the bottom edge.",
    teaches: "One panel can hold two time scales if you give each its own band — the week reads across the top two thirds, the day reads along the bottom four rows — and 'today' is marked by a box around it, because a 1-bit panel has no highlight colour to spend.",
    animated: "The date block is static. The bottom track is driven by t: minutes = S.hhmm + Math.floor(t/100), so at demo speed 100ms equals one minute and the 3px notch sweeps a whole day across the 24-hour track in about 2.4 minutes, with the bottom row underlining the elapsed part of the day behind it.",
    draw: function (d, t, S) {
    var days=['SUN','MON','TUE','WED','THU','FRI','SAT'];
    var ini=['S','M','T','W','T','F','S'];
    var todayIdx=3;
    d.print(2,0,'header','TL',days[todayIdx]);
    d.print(43,1,'label','TR','2026');
    d.print(2,12,'value','TL','26');
    d.print(22,17,'label','TL','AUG');
    d.vline(45,0,26);
    for(var i=0;i<7;i++){
      var cx=48+i*11;
      d.print(cx+5,0,'label','TC',ini[i]);
      d.print(cx+5,11,'label','TC',''+(23+i));
      if(i===todayIdx) d.rect(cx,0,11,21);
    }
    var hm=(''+(S&&S.hhmm?S.hhmm:'09:41')).split(':');
    var base=(+hm[0])*60+(+hm[1]);
    var mins=(base+Math.floor(t/100))%1440;
    d.hline(0,29,128);
    for(var h=0;h<=24;h+=6) d.vline(Math.min((h*127/24)|0,126),27,3);
    var mx=Math.round(124*mins/1440);
    if(mx>0) d.hline(0,31,mx+3);
    d.fillRect(mx,26,3,6);
    }
  },
  {
    id: "mood-face",
    name: "Air Face",
    concept: "A big round face fills the left half and its mouth curves from a wide smile to a deep frown as PM2.5 climbs, with the number and a one-word verdict on the right.",
    teaches: "Encode the scalar as a SHAPE before you encode it as a number — a mouth curve is readable across a classroom at 1 bit, a two-digit reading is not. The mouth is one parabola whose sign is the data.",
    animated: "Two independent slow clocks keep the face alive without touching the data: the pupils drift on sin(t/900) and sin(t/1300) so the gaze wanders on an irrational-looking loop, and a 150 ms blink fires every 3400 ms (t % 3400 < 150) which swaps both eye rings for flat hlines. The mouth itself is static per reading — motion is charm, the curve is truth.",
    draw: function (d, t, S) {
    var pm = Math.round(S.pm25);
    var m = 1 - pm / 35; if (m > 1) m = 1; if (m < -1) m = -1;
    d.circle(16, 16, 15);
    var blink = (t % 3400) < 150;
    var gx = Math.round(1.4 * Math.sin(t / 900));
    var gy = Math.round(1.2 * Math.sin(t / 1300));
    if (blink) { d.hline(8, 12, 7); d.hline(18, 12, 7); }
    else {
      d.circle(11, 12, 3); d.circle(21, 12, 3);
      d.fillCircle(11 + gx, 12 + gy, 1); d.fillCircle(21 + gx, 12 + gy, 1);
    }
    for (var x = 9; x <= 23; x++) {
      var dx = (x - 16) / 7;
      var y = Math.round(21 + m * 3 * (1 - dx * dx));
      d.px(x, y); d.px(x, y + 1);
    }
    d.vline(34, 0, 32);
    d.print(38, 0, 'label', 'TL', 'PM2.5');
    d.print(38, 8, 'value', 'TL', String(pm));
    d.print(38, 22, 'label', 'TL', 'ug/m3');
    d.print(126, 9, 'header', 'TR', m > 0.55 ? 'YAY' : m > 0 ? 'OK' : m > -0.6 ? 'HMM' : 'YUCK');
    }
  },
  {
    id: "dust-bug",
    name: "Dust Bug",
    concept: "A six-segment caterpillar undulates across the grass at the bottom while dust motes drift down from the sky — the worse the air, the more motes fall on him.",
    teaches: "Phase-offset ONE sine along a loop index and six identical circles become a living creature. Organic motion at 1 bit comes from the offset, not from more pixels.",
    animated: "The head walks right at (t/45) % 176 - 24 and each segment trails it by 7 px; every segment's height is 24 + 2*sin(t/130 - i*0.9), so the same wave arrives 0.9 rad later per body part and the crawl ripples backwards. Segments outside x 4..123 are skipped rather than clipped, so he genuinely walks on and off the panel. Motes fall on their own slower clocks (x on t/28, y on t/190) and the mote COUNT is pm25/7 — bad air literally rains harder.",
    draw: function (d, t, S) {
    var pm = Math.round(S.pm25);
    d.hline(0, 31, 128);
    for (var g = 2; g < 128; g += 12) { d.vline(g, 28, 3); d.px(g - 1, 29); d.px(g + 1, 29); }
    var head = (t / 45) % 176 - 24;
    for (var i = 0; i < 6; i++) {
      var cx = Math.round(head - i * 7);
      if (cx < 4 || cx > 123) continue;
      var cy = 24 + Math.round(2 * Math.sin(t / 130 - i * 0.9));
      if (i === 0) {
        d.circle(cx, cy, 3); d.px(cx + 1, cy - 1);
        d.line(cx + 2, cy - 4, cx + 3, cy - 6);
        d.line(cx - 1, cy - 4, cx - 2, cy - 6);
      } else d.fillCircle(cx, cy, 2);
    }
    var n = Math.min(7, Math.round(pm / 7));
    for (var k = 0; k < n; k++) {
      var mx = 48 + ((k * 13 + Math.round(t / 28)) % 56);
      var my = 2 + ((k * 5 + Math.round(t / 190)) % 13);
      d.px(mx, my); if (k % 2) d.px(mx + 1, my + 1);
    }
    d.print(2, 1, 'value', 'TL', String(pm));
    d.print(24, 6, 'label', 'TL', 'ug/m3');
    d.print(126, 0, 'icons', 'TR', S.wifi ? String.fromCharCode(0xDB81, 0xDDA9) : String.fromCharCode(0xDB81, 0xDDAA));
    }
  },
  {
    id: "haze-pong",
    name: "Haze Pong",
    concept: "A full game of Pong plays itself inside the panel — two paddles, a dashed net, a live score — and the ball speeds up as PM2.5 rises.",
    teaches: "A triangle wave, span - |(p mod 2*span) - span|, turns a monotonic clock into a perfect bounce. The whole game is a pure function of t: no velocity, no position, no state to get out of sync with the display.",
    animated: "Everything derives from t. The ball is two triangle waves at coprime-ish divisors (t*speed/9 across, t*speed/13 down) so the rally never repeats visibly. The left paddle tracks the ball exactly; the right paddle is fed the SAME triangle wave evaluated at t-160 ms, so it lags and looks like a second, slightly worse player. Each score digit is floor of the sweep count, the right one offset by half a period, so points tick up as the ball reaches each wall. speed = 1 + pm25/60, so dirty air makes the game frantic.",
    draw: function (d, t, S) {
    function tri(p, span) { var q = p % (2 * span); if (q < 0) q += 2 * span; return span - Math.abs(q - span); }
    function cl(v) { return v < 17 ? 17 : (v > 24 ? 24 : v); }
    d.rect(0, 0, 128, 32);
    for (var y = 2; y < 30; y += 5) d.vline(64, y, 2);
    var speed = 1 + S.pm25 / 60;
    var bx = 6 + Math.round(tri(t * speed / 9, 113));
    var by = 18 + Math.round(tri(t * speed / 13, 10));
    var lag = 18 + Math.round(tri((t - 160) * speed / 13, 10));
    d.fillRect(bx, by, 3, 3);
    d.fillRect(2, cl(by - 3), 3, 7);
    d.fillRect(123, cl(lag - 3), 3, 7);
    var a = Math.floor(t * speed / 2034) % 10;
    var b = Math.floor((t * speed + 1017) / 2034) % 10;
    d.print(58, 1, 'value', 'TR', String(a));
    d.print(70, 1, 'value', 'TL', String(b));
    d.print(2, 2, 'label', 'TL', 'RALLY');
    d.print(126, 2, 'label', 'TR', 'PM' + Math.round(S.pm25));
    }
  },
  {
    id: "air-news-ticker",
    name: "Air News",
    concept: "A single-line LED news ticker slides a message about today's air past two side rails, with marching tick marks above and below that move at exactly the text's speed.",
    teaches: "On a monospace font you can place every glyph YOURSELF and simply skip the ones that would hang off the edge — a marquee that scrolls smoothly and never draws a pixel outside 0..127, no clipping layer required.",
    animated: "shift = round(t/30) advances 33 px/s. Each character i is placed at (i*6 - shift) wrapped modulo the message's full pixel length, and drawn only when 6 <= gx <= 114 — so glyphs slide out from behind the left rail and vanish behind the right one. The tick marks on the top and bottom rails wrap over a 112 px span at the SAME 1 px per shift unit, so text and rails read as one moving band instead of two unrelated animations.",
    draw: function (d, t, S) {
    var msg = '  CHIANG MAI AIR CLUB  <>  PM2.5 IS ' + Math.round(S.pm25) + '  <>  BREATHE EASY  ';
    var W = 6, span = msg.length * W;
    var shift = Math.round(t / 30) % span;
    d.hline(4, 0, 120); d.hline(4, 31, 120);
    d.vline(2, 2, 28); d.vline(125, 2, 28);
    d.px(3, 2); d.px(3, 29); d.px(124, 2); d.px(124, 29);
    for (var k = 0; k < 14; k++) {
      var rx = 6 + ((((k * 8 - shift) % 112) + 112) % 112);
      d.px(rx, 2); d.px(rx, 29);
    }
    for (var i = 0; i < msg.length; i++) {
      var gx = (((i * W - shift) % span) + span) % span;
      if (gx < 6 || gx > 114) continue;
      d.print(gx, 9, 'header', 'TL', msg.charAt(i));
    }
    }
  },
  {
    id: "dust-cube",
    name: "Dust Cube",
    concept: "A real 3D wireframe cube tumbles in the left two-thirds of the panel, projected live from eight rotating vertices, spinning faster the dirtier the air gets.",
    teaches: "You cannot shade a 1-bit panel, so buy depth with MOTION instead: one perspective divide, s = 26/(z+5), is enough to make twelve straight lines read as a solid object. 4096 pixels can hold real 3D — the constraint was never the resolution.",
    animated: "Two rotation angles run off t: a = t*sp around Y and b = 0.62*a around X, which is an irrational-feeling ratio so the tumble never visibly loops. Each of the 8 vertices is rotated, then divided by its own depth, so near faces genuinely grow and far ones shrink every frame. sp = 0.0006 + pm25*0.00004 — clean air gives a slow, calm tumble; heavy haze makes it spin frantically, which is the whole point of the screen.",
    draw: function (d, t, S) {
    var pm = Math.round(S.pm25);
    function cl(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
    var sp = 0.0006 + pm * 0.00004;
    var a = t * sp, b = t * sp * 0.62;
    var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    var P = [];
    for (var i = 0; i < 8; i++) {
      var x = (i & 1) ? 1 : -1, y = (i & 2) ? 1 : -1, z = (i & 4) ? 1 : -1;
      var x1 = x * ca + z * sa, z1 = z * ca - x * sa;
      var y1 = y * cb - z1 * sb, z2 = z1 * cb + y * sb;
      var s = 28 / (z2 + 5);
      P.push([cl(Math.round(28 + x1 * s), 0, 50), cl(Math.round(16 + y1 * s), 0, 31)]);
    }
    var E = [0,1, 1,3, 3,2, 2,0, 4,5, 5,7, 7,6, 6,4, 0,4, 1,5, 2,6, 3,7];
    for (var e = 0; e < E.length; e += 2) {
      var p = P[E[e]], q = P[E[e + 1]];
      d.line(p[0], p[1], q[0], q[1]);
    }
    d.vline(52, 0, 32);
    d.print(58, 0, 'label', 'TL', 'SPIN=DUST');
    d.print(58, 8, 'value', 'TL', String(pm));
    d.print(58, 22, 'label', 'TL', 'ug/m3');
    }
  },
  {
    id: "hero-pm25",
    name: "Hero Number",
    concept: "The current PM2.5 reading as a 22px seven-segment number built from filled rectangles, with the unit stacked in a small side column and a one-second sample sweep along the bottom edge.",
    teaches: "When no font is big enough, stop looking for a font: a digit is seven rectangles, so build your own display face out of primitives and reclaim two thirds of the panel for the one number that matters.",
    animated: "A 2px progress bar sweeps left-to-right across the bottom once per second over a dotted track, driven by (t % 1000) / 1000 — it mirrors the PMS7003's ~1Hz frame cadence, so a still panel still proves the sensor is alive. The digits themselves hold steady.",
    draw: function (d, t, S) {
    var s = String(Math.round(S.pm25)), n = s.length;
    var SEG = ['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'];
    function seg(v, x, y) {
      var m = SEG[v], w = 16, h = 22, k = 4, mid = y + 9, half = 13;
      if (m.charAt(0) === '1') d.fillRect(x, y, w, k);
      if (m.charAt(1) === '1') d.fillRect(x + w - k, y, k, half);
      if (m.charAt(2) === '1') d.fillRect(x + w - k, mid, k, half);
      if (m.charAt(3) === '1') d.fillRect(x, y + h - k, w, k);
      if (m.charAt(4) === '1') d.fillRect(x, mid, k, half);
      if (m.charAt(5) === '1') d.fillRect(x, y, k, half);
      if (m.charAt(6) === '1') d.fillRect(x, mid, w, k);
    }
    for (var i = 0; i < n; i++) seg(Number(s.charAt(i)), 58 - (n - i) * 20 + 4, 3);
    d.vline(61, 2, 26);
    d.print(64, 2, 'header', 'TL', 'PM2.5');
    d.print(64, 17, 'label', 'TL', 'ug/m3');
    for (var x = 0; x < 128; x += 3) d.px(x, 30);
    d.fillRect(0, 29, Math.round(128 * (t % 1000) / 1000), 2);
    }
  },
  {
    id: "aqi-band",
    name: "Density Scale",
    concept: "The US EPA AQI band as a word plus a six-cell scale where each cell is filled with a denser 1-bit dither than the last, and a pointer drops onto the cell holding the current reading.",
    teaches: "With no colour, ink density IS the colour ramp — a monotonic dither sequence (empty, 1/16, 1/4, 1/2, 3/4, solid) makes 'worse' legible at a glance, and the selected cell is marked by a double frame with a clear gutter rather than by a hue.",
    animated: "The pointer triangle blinks at 1Hz — visible for the first 620ms of every (t % 1000) cycle. At 1 bit, blinking is the only highlight channel left once fill and outline are both spent on the scale itself; the double frame keeps the selection readable in the dark half of the cycle.",
    draw: function (d, t, S) {
    var c = S.pm25;
    var BP = [0, 9, 35.4, 55.4, 125.4, 225.4, 325.4], AQ = [0, 50, 100, 150, 200, 300, 500];
    var NM = ['GOOD', 'MODERATE', 'SENSITIVE', 'UNHEALTHY', 'V.UNHEALTHY', 'HAZARDOUS'];
    var i = 0; while (i < 5 && c > BP[i + 1]) i++;
    var f = (c - BP[i]) / (BP[i + 1] - BP[i]); if (f < 0) f = 0; if (f > 1) f = 1;
    function ink(b, x, y) {
      if (b === 0) return false;
      if (b === 1) return x % 4 === 0 && y % 4 === 0;
      if (b === 2) return x % 2 === 0 && y % 2 === 0;
      if (b === 3) return (x + y) % 2 === 0;
      if (b === 4) return !(x % 2 && y % 2);
      return true;
    }
    d.print(0, 0, 'header', 'TL', NM[i]);
    d.print(127, 0, 'value', 'TR', String(Math.round(AQ[i] + f * (AQ[i + 1] - AQ[i]))));
    d.rect(4, 19, 120, 11);
    for (var b = 0; b < 6; b++) {
      var x0 = 4 + b * 20, pad = (b === i) ? 3 : 1;
      if (b) d.vline(x0, 19, 11);
      if (b === i) d.rect(x0 + 1, 20, 18, 9);
      for (var ix = x0 + pad; ix <= x0 + 19 - pad; ix++)
        for (var iy = 19 + pad; iy <= 29 - pad; iy++) if (ink(b, ix, iy)) d.px(ix, iy);
    }
    var pt = Math.round(4 + i * 20 + f * 19);
    if (t % 1000 < 620) for (var k = 0; k < 4; k++) d.hline(pt - 3 + k, 14 + k, 7 - 2 * k);
    }
  },
  {
    id: "triple-metric",
    name: "Three Columns",
    concept: "PM1.0, PM2.5 and PM10 side by side in three ruled columns under a status strip carrying the unit, the wifi icon, and a hand-drawn MQTT beacon.",
    teaches: "Three numbers become one instrument when they share a baseline and are separated by hairlines instead of gaps — and when the icon font has no glyph for what you need (MQTT), you draw it, rather than misusing a glyph that means something else.",
    animated: "The MQTT indicator is a dot with a ring that expands from r=2 to r=4 over the first 600ms of every 4000ms cycle (t % 4000), echoing the real publish interval. If S.mqtt is false the ring never fires and a slash is struck through the dot instead. The wifi glyph swaps between U+F05A9 and U+F05AA on S.wifi.",
    draw: function (d, t, S) {
    var ph = t % 4000;
    d.print(0, 0, 'label', 'TL', 'ug/m3');
    d.print(127, 0, 'icons', 'TR', S.wifi ? '󰖩' : '󰖪');
    d.fillCircle(107, 5, 1);
    if (S.mqtt) {
      if (ph < 600) d.circle(107, 5, 2 + Math.floor(ph / 200));
    } else {
      d.line(103, 1, 111, 9);
    }
    d.hline(0, 10, 128);
    d.vline(42, 12, 20);
    d.vline(85, 12, 20);
    var cx = [21, 64, 107], vs = [S.pm1, S.pm25, S.pm10], nm = ['PM1', 'PM2.5', 'PM10'];
    for (var i = 0; i < 3; i++) {
      d.print(cx[i], 12, 'value', 'TC', String(Math.round(vs[i])));
      d.print(cx[i], 22, 'label', 'TC', nm[i]);
    }
    }
  },
  {
    id: "trend-strip",
    name: "Trend Strip",
    concept: "A 45-sample scrolling column sparkline of recent PM2.5, anchored by a solid baseline and a dotted line at the 35.4 ug/m3 EPA threshold, with the newest value read out large on the left.",
    teaches: "A bare 1-bit sparkline is just noise — give it a fixed baseline and a labelled reference line (here 35.4, the EPA 2024 Moderate/Sensitive boundary) so the eye reads 'above the line' rather than merely 'bumpy'.",
    animated: "The whole history scrolls one sample left every 400ms: k = floor(t / 400) offsets the sample index, so a new column enters at the right edge and the big left-hand number is always samp(44 + k), the newest bar. A floating cap pixel sits two rows above the newest column so 'now' never gets lost in the run of bars.",
    draw: function (d, t, S) {
    var k = Math.floor(t / 400), hn = 1;
    function samp(j) {
      var v = S.pm25 + 14 * Math.sin(j * 0.31) + 7 * Math.sin(j * 0.13 + 1.1) + 3 * Math.sin(j * 0.77);
      return v < 0 ? 0 : v;
    }
    d.print(0, 0, 'label', 'TL', 'PM2.5');
    d.print(0, 9, 'value', 'TL', String(Math.round(samp(44 + k))));
    d.print(0, 22, 'label', 'TL', 'ug/m3');
    d.vline(35, 0, 32);
    d.hline(38, 30, 90);
    for (var i = 0; i < 45; i++) {
      var h = Math.round(samp(i + k) / 80 * 26);
      if (h > 26) h = 26;
      if (h < 1) h = 1;
      d.vline(38 + i * 2, 30 - h, h);
      if (i === 44) hn = h;
    }
    for (var x = 38; x < 128; x += 3) d.px(x, 18);
    d.hline(36, 18, 2);
    d.px(126, 30 - hn - 2 < 0 ? 0 : 30 - hn - 2);
    }
  },
  {
    id: "sensor-stale",
    name: "Stale Reading",
    concept: "A sensor-failure state: a hand-drawn warning triangle beside the fault name, with the last good reading still shown but struck through and stamped with how many minutes old it is.",
    teaches: "An error screen must stay useful — keep the last good number on the panel and say how stale it is; at 1 bit you cannot dim it to mean 'not current', so you strike it through, which is a stronger and more honest signal than dimming ever was.",
    animated: "The exclamation mark inside the triangle blinks on for the first 800ms of every 1200ms (t % 1200), so the alarm reads as active rather than as a frozen frame. The staleness counter climbs one minute every 8s — age = 14 + floor(t / 8000) % 46 — so the screen visibly gets worse the longer nobody fixes it.",
    draw: function (d, t, S) {
    var age = 14 + (Math.floor(t / 8000) % 46);
    d.line(13, 3, 1, 28);
    d.line(13, 3, 25, 28);
    d.hline(1, 28, 25);
    if (t % 1200 < 800) {
      d.fillRect(12, 12, 2, 9);
      d.fillRect(12, 23, 2, 2);
    }
    d.print(30, 0, 'header', 'TL', 'SENSOR FAIL');
    for (var x = 30; x < 128; x += 2) d.px(x, 14);
    var s = String(Math.round(S.pm25)), w = s.length * 6;
    d.print(30, 16, 'value', 'TL', s);
    d.hline(28, 22, w + 4);
    d.print(38 + w, 21, 'label', 'TL', 'ug/m3');
    d.print(127, 21, 'label', 'TR', 'STALE ' + age + 'm');
    }
  },
  {
    id: "link-state",
    name: "Link State",
    concept: "Wi-Fi link status: the real MDI wifi / wifi-off glyph for the binary fact, hand-drawn bars for signal strength, and a marching scan track when the link is down.",
    teaches: "An icon can only carry a binary fact — you have exactly U+F05A9 and U+F05AA, so any magnitude has to be built from rectangles; drawing the EMPTY bar slots as outlines is what turns three lit bars into a scale instead of a decoration.",
    animated: "t drives a 3-step state demo: Math.floor(t/3500)%3 keeps the link up for 7s then drops it for 3.5s, swapping the icon glyph, the header word and the whole lower band. While down, a 8x5 block marches the 88px scan track at Math.floor(t/25)%78 — about 40px/s, fast enough to read as 'searching', slow enough not to strobe.",
    draw: function (d, t, S) {
    // font_icons has ONLY these two glyphs: U+F05A9 wifi, U+F05AA wifi-off.
    // Signal STRENGTH has no icon, so it is drawn.
    var linked = Math.floor(t / 3500) % 3 < 2;
    d.print(1, 1, 'icons', 'TL', String.fromCharCode(0xDB81, linked ? 0xDDA9 : 0xDDAA));
    d.print(14, 0, 'header', 'TL', linked ? 'ONLINE' : 'NO LINK');
    var i, h;
    for (i = 0; i < 4; i++) {              // all four slots always drawn
      h = 3 + i * 3;                       // 3,6,9,12 - bottoms flush at y=11
      if (linked && i < 3) d.fillRect(104 + i * 6, 12 - h, 4, h);
      else d.rect(104 + i * 6, 12 - h, 4, h);   // hollow slot = headroom, countable
    }
    d.hline(0, 14, 128);
    if (linked) {
      d.print(2, 19, 'label', 'TL', 'CH6  -58dBm');   // '-' needs label, not value
      d.print(126, 19, 'label', 'TR', 'MQTT OK');
    } else {
      d.print(2, 19, 'label', 'TL', 'SCANNING');
      d.rect(38, 19, 88, 9);
      d.fillRect(40 + Math.floor(t / 25) % 78, 21, 8, 5);
    }
    }
  },
  {
    id: "cell-gauge",
    name: "Cell Gauge",
    concept: "A battery drawn entirely from rectangles and lines — eight discrete charge cells, a terminal nub, a hand-built '%' sign, and a doubled outline when the pack goes low.",
    teaches: "Quantise a level into countable cells: on 1 bit a segmented gauge is read at a glance where a smooth bar is a guess. And a glyph you do not own is not a blocker — '%' is two 3x3 rings and a diagonal.",
    animated: "pct = 100 - (Math.floor(t/90) % 101) drains the pack 100 to 0 in about 9s and loops, so the whole scale plus the low state is demonstrated continuously. Nothing blinks: crossing 20% draws a second, outer outline permanently instead of flashing, so the reading never disappears.",
    draw: function (d, t, S) {
    var pct = 100 - (Math.floor(t / 90) % 101);   // slow drain, loops
    var f = Math.round(pct * 8 / 100), i, cx;
    d.print(2, 0, 'label', 'TL', 'PACK');
    d.print(126, 0, 'label', 'TR', pct <= 20 ? 'LOW' : 'RUN');
    d.rect(2, 11, 68, 18);                        // body
    d.fillRect(70, 16, 3, 8);                     // terminal nub
    for (i = 0; i < 8; i++) {
      cx = 4 + i * 8;
      if (i < f) d.fillRect(cx, 14, 7, 12);       // countable cell, not a smooth bar
      else d.vline(cx + 3, 19, 2);                // ghost tick: empty slot still visible
    }
    if (pct <= 20) d.rect(0, 9, 75, 22);          // doubled outline = LOW, no blink
    d.print(112, 13, 'value', 'TR', String(pct)); // digits land on y17..23
    d.rect(114, 17, 3, 3);                        // font_value has no '%' - build it
    d.line(114, 23, 123, 17);
    d.rect(121, 21, 3, 3);
    }
  },
  {
    id: "cold-start",
    name: "Cold Start",
    concept: "A four-stage boot: the whole panel lights and parts like a curtain, the DBK wordmark types itself in, three subsystems report with hand-drawn ticks, then a READY bar fills.",
    teaches: "A splash is a progress log, not a logo. Give every stage its own slice of the timeline and its own line of text, so a hang shows up as the one row that never gets its tick — the screen debugs the boot for you.",
    animated: "T = t % 6400 is the boot clock. 0-900ms: two filled half-panels retract from centre (w = T*64/900) — the loudest transition a 1-bit panel has. 900-2200: 'DBK' reveals one character per 300ms while an underline grows outward from x=64. 2200-4900: one subsystem row every 850ms, the pending row showing a 3-dot spinner at Math.floor(t/160)%3. 4900-6400: the READY bar fills 106px in 1.3s.",
    draw: function (d, t, S) {
    var T = t % 6400, i, y, k, w;
    if (T < 900) {                       // every pixel lit, then parted - the boldest 1-bit move
      w = Math.floor(T * 64 / 900);
      d.fillRect(0, 0, 64 - w, 32);
      d.fillRect(64 + w, 0, 64 - w, 32);
    } else if (T < 2200) {
      k = Math.min(3, Math.floor((T - 900) / 300));
      d.print(55, 6, 'header', 'TL', 'DBK'.substring(0, k));   // TL so it types, not jitters
      w = Math.min(52, Math.floor((T - 900) / 12));
      if (w > 0) d.hline(64 - w, 21, w * 2);
    } else if (T < 4900) {
      var names = ['PMS7003', 'WIFI', 'MQTT'];
      k = Math.floor((T - 2200) / 850);
      for (i = 0; i < 3 && i <= k; i++) {
        y = 1 + i * 10;
        d.print(14, y, 'label', 'TL', names[i]);
        if (i < k) { d.line(3, y + 5, 6, y + 8); d.line(6, y + 8, 11, y + 2); }  // tick: 2 lines
        else d.fillRect(3 + (Math.floor(t / 160) % 3) * 4, y + 4, 3, 3);          // still waiting
      }
    } else {
      d.print(64, 2, 'header', 'TC', 'DBK READY');
      d.rect(10, 20, 108, 8);
      w = Math.min(106, Math.floor((T - 4900) / 13));
      if (w > 0) d.fillRect(11, 21, w, 6);
    }
    }
  },
  {
    id: "hard-alert",
    name: "Hard Alert",
    concept: "A PM2.5 danger alert: a marching-ants border crawling around the full panel, a hand-drawn warning triangle, and the reading held dead still in the middle.",
    teaches: "There is no colour and no inverse text here, so urgency has to come from motion at the EDGE and stillness at the CENTRE. A crawling border owns peripheral vision while the number stays legible every single frame — the opposite of a blink, which hides the message half the time.",
    animated: "off = Math.floor(t/55)%8 shifts an 8px dash phase, so the dashes travel continuously around the perimeter (top, left, bottom, right all circulate the same direction). Roughly 18 steps/s: unmissable in the corner of the eye, but every glyph inside is drawn identically on every frame.",
    draw: function (d, t, S) {
    var off = Math.floor(t / 55) % 8, i;   // ants crawl; the message never moves
    for (i = 0; i < 128; i++) if ((i + off) % 8 < 4) { d.px(i, 0); d.px(127 - i, 31); }
    for (i = 0; i < 32; i++) if ((i + off) % 8 < 4) { d.px(127, i); d.px(0, 31 - i); }
    d.line(16, 4, 5, 27);                  // warning triangle - no such icon exists
    d.line(16, 4, 27, 27);
    d.hline(5, 27, 23);
    d.fillRect(15, 11, 3, 7);              // bang stroke
    d.fillRect(15, 20, 3, 3);              // bang dot
    d.print(34, 2, 'label', 'TL', 'PM2.5');          // '.' needs label, never value
    d.print(34, 12, 'value', 'TL', String(Math.round(S.pm25)));
    d.print(60, 15, 'label', 'TL', 'UG/M3');
    d.print(122, 3, 'header', 'TR', 'DANGER');
    d.hline(86, 17, 36);                   // double rule = emphasis without colour
    d.hline(86, 20, 36);
    }
  },
  {
    id: "eight-up-board",
    name: "Eight Up Board",
    concept: "Eight devices in a 4x2 grid, each a name plus one 26x3 status bar, with a poll cursor stepping tile to tile underneath.",
    teaches: "Three states out of one shape — solid, dashed, hollow. Keep the tile geometry byte-identical so only the TEXTURE of the bar changes; the eye then scans the whole board in one pass instead of reading eight little widgets.",
    animated: "Tile 6 really flips state every 1.9s (Math.floor(t/1900)%2) so the board is visibly live rather than a screenshot. A poll cursor — a single 26px underline — steps one tile every 450ms, Math.floor(t/450)%8, completing a sweep of the fleet every 3.6s; it says which row was refreshed most recently without touching the state bars.",
    draw: function (d, t, S) {
    var names = ['DBK1', 'DBK2', 'ANCS', 'HALL', 'GATE', 'LOFT', 'CAFE', 'MAKR'];
    var st = [S.wifi ? 2 : 0, S.mqtt ? 2 : 1, 2, 1, 2, 2, 0, 2];  // 2 solid 1 dashed 0 hollow
    st[6] = Math.floor(t / 1900) % 2 ? 1 : 0;                     // this one really is flapping
    var k, cx, cy, j;
    d.vline(31, 0, 32); d.vline(63, 0, 32); d.vline(95, 0, 32);
    for (k = 0; k < 8; k++) {
      cx = (k % 4) * 32; cy = k < 4 ? 0 : 16;
      d.print(cx + 2, cy + 1, 'label', 'TL', names[k]);           // 4 chars x adv 4 = 16px
      if (st[k] === 2) d.fillRect(cx + 2, cy + 10, 26, 3);        // ONLINE  - solid
      else if (st[k] === 1) for (j = 0; j < 26; j += 4) d.fillRect(cx + 2 + j, cy + 10, 2, 3);
      else d.rect(cx + 2, cy + 10, 26, 3);                        // OFFLINE - hollow
    }
    k = Math.floor(t / 450) % 8;                                  // poll cursor
    cx = (k % 4) * 32; cy = k < 4 ? 0 : 16;
    d.hline(cx + 2, cy + 14, 26);
    }
  },
  {
    id: "flip-alarm",
    name: "Panel Flip Alarm",
    concept: "A PM2.5 danger alarm with nothing to read: a hand-built warning triangle, the reading as 24px seven-segment digits, a carved PM25 tag — and the ENTIRE panel, all 4096 pixels, flips polarity twice a second. Both halves of the cycle carry the identical message; only which side the ink is on changes.",
    teaches: "A blink hides your message half the time; a polarity flip never does. Build the frame as an ink MASK first, then decide per pixel whether to paint the mask or its complement — that one boolean is the entire alarm, and it is the loudest thing a 1-bit panel can do.",
    animated: "inv = (t % 1400) < 700 — 0.71 Hz, slow enough that the eye reads the number in BOTH states instead of smearing them together. Nothing else moves: the geometry is byte-identical in both phases, so the flip reads as the panel itself changing rather than as content appearing and disappearing. The digits follow S.pm25 and only change with the reading. Note the mask carries the carved 'PM25' too — the real fonts can only ADD ink, so knocked-out text has to be a glyph you own (here a 3x5 column-bitmap micro-font).",
    draw: function (d, t, S) {
    var SEG=['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'];
    var MF={P:[31,5,2],M:[31,2,31],'2':[29,21,23],'5':[23,21,29]};
    var H={},i,q,x,y;
    function rct(a,b,w,h){for(var j=0;j<h;j++)for(var k=0;k<w;k++){var X=a+k,Y=b+j;if(X>=0&&X<128&&Y>=0&&Y<32)H[Y*128+X]=1;}}
    function seg(v,a,b,w,h,k){var s=SEG[v],vh=Math.floor((h-3*k)/2);
      if(s.charAt(0)=='1')rct(a+k,b,w-2*k,k);
      if(s.charAt(1)=='1')rct(a+w-k,b+k,k,vh);
      if(s.charAt(2)=='1')rct(a+w-k,b+2*k+vh,k,vh);
      if(s.charAt(3)=='1')rct(a+k,b+h-k,w-2*k,k);
      if(s.charAt(4)=='1')rct(a,b+2*k+vh,k,vh);
      if(s.charAt(5)=='1')rct(a,b+k,k,vh);
      if(s.charAt(6)=='1')rct(a+k,b+k+vh,w-2*k,k);}
    function mtx(s,a,b){for(var m=0;m<s.length;m++){var g=MF[s.charAt(m)];if(g)for(var c=0;c<3;c++)for(var r=0;r<5;r++)if((g[c]>>r)&1)rct(a+m*4+c,b+r,1,1);}}
    for(i=0;i<26;i++){q=Math.round(i*12/25);rct(16-q,3+i,2,1);rct(15+q,3+i,2,1);}
    rct(4,27,25,2);rct(15,11,3,7);rct(15,21,3,3);
    var v=String(Math.min(999,Math.round(S.pm25))),n=v.length,x0=70-Math.floor((24*n-4)/2);
    for(i=0;i<n;i++)seg(+v.charAt(i),x0+i*24,4,20,24,4);
    mtx('PM',112,4);mtx('25',112,12);
    var inv=(t%1400)<700;
    for(y=0;y<32;y++)for(x=0;x<128;x++){var on=H[y*128+x]?1:0;if(inv?!on:on)d.px(x,y);}
    }
  },
  {
    id: "split-polarity",
    name: "Split Polarity",
    concept: "The panel cut in half down the middle: PM2.5 left, PM10 right, drawn with byte-identical geometry but OPPOSITE polarity — one knocked out of a solid block, one plain ink on black — each with a small meter along the bottom. Every 2.6s the two halves trade sides.",
    teaches: "Inversion is a spotlight, and a spotlight has to be able to MOVE. Because both halves come from the same mask and differ only by a per-pixel boolean, the featured metric can swap with zero layout change — and the seam needs no divider line, because opposite polarity IS the divider.",
    animated: "flip = floor(t/2600) % 2 swaps which half is inverted every 2.6s. The per-pixel test is inv = (x<64) === (flip===0), so the two halves are ALWAYS opposite and the boundary can never vanish. The 2px meters at y29 are scaled to the live readings, which makes the swap demonstrate the same bar in both polarities at once: a filled bar on one side, a carved notch on the other. Values are 7-seg primitives so they survive the polarity change unchanged.",
    draw: function (d, t, S) {
    var SEG=['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'];
    var MF={P:[31,5,2],M:[31,2,31],'0':[31,17,31],'1':[18,31,16],'2':[29,21,23],'5':[23,21,29]};
    var H={},i,j,x,y;
    function rct(a,b,w,h){for(var p=0;p<h;p++)for(var k=0;k<w;k++){var X=a+k,Y=b+p;if(X>=0&&X<128&&Y>=0&&Y<32)H[Y*128+X]=1;}}
    function seg(v,a,b,w,h,k){var s=SEG[v],vh=Math.floor((h-3*k)/2);
      if(s.charAt(0)=='1')rct(a+k,b,w-2*k,k);
      if(s.charAt(1)=='1')rct(a+w-k,b+k,k,vh);
      if(s.charAt(2)=='1')rct(a+w-k,b+2*k+vh,k,vh);
      if(s.charAt(3)=='1')rct(a+k,b+h-k,w-2*k,k);
      if(s.charAt(4)=='1')rct(a,b+2*k+vh,k,vh);
      if(s.charAt(5)=='1')rct(a,b+k,k,vh);
      if(s.charAt(6)=='1')rct(a+k,b+k+vh,w-2*k,k);}
    function mtx(s,a,b){for(var m=0;m<s.length;m++){var g=MF[s.charAt(m)];if(g)for(var c=0;c<3;c++)for(var r=0;r<5;r++)if((g[c]>>r)&1)rct(a+m*4+c,b+r,1,1);}}
    var nm=['PM25','PM10'],vl=[Math.min(999,Math.round(S.pm25)),Math.min(999,Math.round(S.pm10))];
    for(i=0;i<2;i++){
      var bx=i*64,v=String(vl[i]),n=v.length,x0=bx+32-Math.floor((17*n-3)/2),w=Math.min(56,Math.round(vl[i]*56/150));
      mtx(nm[i],bx+4,2);
      for(j=0;j<n;j++)seg(+v.charAt(j),x0+j*17,8,14,19,3);
      if(w>0)rct(bx+4,29,w,2);
    }
    var flip=Math.floor(t/2600)%2;
    for(y=0;y<32;y++)for(x=0;x<128;x++){var on=H[y*128+x]?1:0,inv=(x<64)===(flip===0);if(inv?!on:on)d.px(x,y);}
    }
  },
  {
    id: "menu-cursor",
    name: "Menu Cursor",
    concept: "A four-row list — PM1, PM2.5, PM10 and today's peak — where the selected row sits inside a full-width inverted block with its name, its value and its hairline bar all knocked out of the ink. A 2px rail down the right edge carries a thumb the block never reaches.",
    teaches: "The 'current item' pattern every UI needs, done the only way 1 bit allows. The highlight is not a block drawn BEHIND the text — it IS the text, inverted. Which means you must reserve a strip the block never covers (here x >= 124), or the scroll indicator drowns in its own highlight.",
    animated: "The cursor steps one row every 900ms (floor(t/900)%4), and it does not teleport: for the first 140ms of each step the block WIPES out from x=0 to x=124 (bw), so a row's name flips polarity a beat before its value does and you can watch the boundary cross individual glyphs mid-stroke. The 1px hairline under each row is that row's value on a 0-150 scale and inverts along with everything else; the right-edge thumb slides but stays normal polarity throughout.",
    draw: function (d, t, S) {
    var MF={P:[31,5,2],M:[31,2,31],A:[30,5,30],X:[27,4,27],'0':[31,17,31],'1':[18,31,16],'2':[29,21,23],'3':[17,21,31],'4':[7,4,31],'5':[23,21,29],'6':[31,21,29],'7':[1,1,31],'8':[31,21,31],'9':[23,21,31]};
    var H={},i,x,y;
    function rct(a,b,w,h){for(var p=0;p<h;p++)for(var k=0;k<w;k++){var X=a+k,Y=b+p;if(X>=0&&X<128&&Y>=0&&Y<32)H[Y*128+X]=1;}}
    function mtx(s,a,b){for(var m=0;m<s.length;m++){var g=MF[s.charAt(m)];if(g)for(var c=0;c<3;c++)for(var r=0;r<5;r++)if((g[c]>>r)&1)rct(a+m*4+c,b+r,1,1);}}
    var nm=['PM1','PM25','PM10','MAX'],vl=[S.pm1,S.pm25,S.pm10,S.pm25*1.9];
    var k=Math.floor(t/900)%4,ph=t%900,bw=ph<140?Math.round(124*ph/140):124;
    for(i=0;i<4;i++){
      var ry=i*8,n=Math.min(999,Math.round(vl[i])),v=String(n),w=Math.min(64,Math.round(n*64/150));
      mtx(nm[i],4,ry+1);
      mtx(v,120-4*v.length,ry+1);
      if(w>0)rct(24,ry+6,w,1);
    }
    rct(126,0,1,32);rct(124,k*8+1,4,6);
    for(y=0;y<32;y++)for(x=0;x<128;x++){var on=H[y*128+x]?1:0,inv=y>=k*8&&y<k*8+8&&x<bw;if(inv?!on:on)d.px(x,y);}
    }
  },
  {
    id: "carve-bar",
    name: "Carved Bar",
    concept: "One horizontal bar whose fill grows with the reading, with the reading's own seven-segment digits standing in the middle of the track. Where the fill has reached them the digits are carved OUT of the ink instead of drawn into it — the value eats its own number.",
    teaches: "A bar and a number normally repeat the same fact twice. Overlap them and the polarity boundary carries the extra information for free: how far the fill has swallowed the digits tells you where the reading sits on the scale before you have read a single glyph.",
    animated: "A 14s triangle ramp — p = (t%14000)/14000, val = 150*(1 - |2p-1|) — walks the reading 0 to 150 and back so the whole scale is demonstrated. The digits change with it and the fill front tracks it, and roughly between 50 and 105 the front is physically INSIDE the numerals: half a digit knocked out, half still ink, the boundary sliding through the segments. The real-font header, the frame and the three threshold ticks (35, 55, 125 ug/m3) live outside the bar and never invert — the fixed chrome is what makes the moving polarity legible.",
    draw: function (d, t, S) {
    var SEG=['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'];
    var H={},x,y,i;
    function rct(a,b,w,h){for(var p=0;p<h;p++)for(var k=0;k<w;k++){var X=a+k,Y=b+p;if(X>=0&&X<128&&Y>=0&&Y<32)H[Y*128+X]=1;}}
    function seg(v,a,b,w,h,k){var s=SEG[v],vh=Math.floor((h-3*k)/2);
      if(s.charAt(0)=='1')rct(a+k,b,w-2*k,k);
      if(s.charAt(1)=='1')rct(a+w-k,b+k,k,vh);
      if(s.charAt(2)=='1')rct(a+w-k,b+2*k+vh,k,vh);
      if(s.charAt(3)=='1')rct(a+k,b+h-k,w-2*k,k);
      if(s.charAt(4)=='1')rct(a,b+2*k+vh,k,vh);
      if(s.charAt(5)=='1')rct(a,b+k,k,vh);
      if(s.charAt(6)=='1')rct(a+k,b+k+vh,w-2*k,k);}
    var p2=(t%14000)/14000,val=Math.round(150*(1-Math.abs(2*p2-1)));
    var v=String(val),n=v.length,x0=64-Math.floor((16*n-3)/2),bw=Math.round(val*125/150);
    for(i=0;i<n;i++)seg(+v.charAt(i),x0+i*16,11,13,17,3);
    d.print(0,0,'label','TL','PM2.5');
    d.print(127,0,'label','TR','ug/m3');
    for(y=11;y<29;y++)for(x=1;x<127;x++){var on=H[y*128+x]?1:0,inv=x<1+bw;if(inv?!on:on)d.px(x,y);}
    d.rect(0,10,128,20);
    d.vline(31,30,2);d.vline(47,30,2);d.vline(105,30,2);
    }
  },
  {
    id: "wipe-invert",
    name: "Polarity Wipe",
    concept: "Two pages — PM2.5 and PM10 — that change over with a 45-degree wipe. The arriving page is not just different data, it is the opposite polarity, so the diagonal front is a page transition and an inversion boundary at the same time.",
    teaches: "A 1-bit panel has no cross-fade, no slide, no easing — but a moving polarity boundary costs one comparison per pixel and reads as a genuine transition. Slanting the front (x < f - y) instead of keeping it vertical is what makes it read as motion rather than as a screen tear.",
    animated: "A 2.6s half-cycle. For the first 900ms the front f sweeps 0 to 159 (about 180 px/s) and the test x < f - y gives a 45-degree edge that cuts through the digits, showing the same panel in both polarities simultaneously; the remaining 1.7s holds the arrived page. Each half-cycle brings in the other page, so page 0 (PM2.5, ink on black) and page 1 (PM10, knocked out of solid) alternate forever — and polarity ALONE tells you which page you are looking at, no title needed.",
    draw: function (d, t, S) {
    var SEG=['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'];
    var MF={P:[31,5,2],M:[31,2,31],U:[31,16,31],G:[14,17,29],'0':[31,17,31],'1':[18,31,16],'2':[29,21,23],'3':[17,21,31],'5':[23,21,29]};
    var A={},B={},T,x,y;
    function rct(H,a,b,w,h){for(var p=0;p<h;p++)for(var k=0;k<w;k++){var X=a+k,Y=b+p;if(X>=0&&X<128&&Y>=0&&Y<32)H[Y*128+X]=1;}}
    function mt(H,s,a,b){for(var m=0;m<s.length;m++){var g=MF[s.charAt(m)];if(g)for(var c=0;c<3;c++)for(var r=0;r<5;r++)if((g[c]>>r)&1)rct(H,a+m*4+c,b+r,1,1);}}
    function seg(H,v,a,b,w,h,k){var s=SEG[v],vh=Math.floor((h-3*k)/2);
      if(s.charAt(0)=='1')rct(H,a+k,b,w-2*k,k);
      if(s.charAt(1)=='1')rct(H,a+w-k,b+k,k,vh);
      if(s.charAt(2)=='1')rct(H,a+w-k,b+2*k+vh,k,vh);
      if(s.charAt(3)=='1')rct(H,a+k,b+h-k,w-2*k,k);
      if(s.charAt(4)=='1')rct(H,a,b+2*k+vh,k,vh);
      if(s.charAt(5)=='1')rct(H,a,b+k,k,vh);
      if(s.charAt(6)=='1')rct(H,a+k,b+k+vh,w-2*k,k);}
    function page(H,lbl,val){var v=String(Math.min(999,Math.round(val))),n=v.length,x0=64-Math.floor((22*n-4)/2),m;
      mt(H,lbl,4,3);mt(H,'UGM3',108,3);
      for(m=0;m<n;m++)seg(H,+v.charAt(m),x0+m*22,8,18,21,3);}
    page(A,'PM25',S.pm25);page(B,'PM10',S.pm10);
    var hc=2600,k=Math.floor(t/hc),cur=k%2,prv=1-cur,f=(T=t%hc)<900?Math.round(T*159/900):159;
    for(y=0;y<32;y++)for(x=0;x<128;x++){var pg=(x<f-y)?cur:prv,on=(pg?B:A)[y*128+x]?1:0;if(pg?!on:on)d.px(x,y);}
    }
  },
  {
    id: "grey-ladder",
    name: "Grey Ladder",
    concept: "Six Bayer dither densities as 19x16 swatches in one row — 1/16, 1/8, 1/4, 1/2, 3/4, solid — with a bracket that steps along adjacent PAIRS and prints an honest verdict on whether that pair actually separates.",
    teaches: "An ordered 4x4 Bayer matrix offers sixteen nominal greys and this panel honestly delivers about four. Empty, 1/4, 1/2 and solid separate at a glance; 1/16 vs 1/8 is mush — both read as sparse speckle rather than tone, and a 16px-tall block of 1/16 holds only four rows of dots; 3/4 vs solid is mush too, because the eye fills in the one missing pixel of every four, especially with OLED bloom. They only separate when directly adjacent, which is exactly why the swatches touch. Note also that ONLY the 1/2 checkerboard reads as a flat TONE — every other level reads as a visible pattern with a direction to it. Budget three fills plus empty, not six.",
    animated: "p = floor(t/1500) % 5 steps the comparison bracket one pair to the right every 1.5s, cycling all five adjacent pairs in 7.5s. The bracket is the only thing that moves — the swatches are fixed, because the whole point is that you compare them yourself. The header follows the bracket: pair names on the left, the verdict (MUSH / FAINT / CLEAR) on the right.",
    draw: function (d, t, S) {
    var B=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
    var LV=[1,2,4,8,12,16], NM=['1/16','1/8','1/4','1/2','3/4','ALL'];
    var VD=['MUSH','FAINT','CLEAR','CLEAR','MUSH'];
    var p=Math.floor(t/1500)%5, i, x, y, x0;
    d.print(0,0,'label','TL',NM[p]+' v '+NM[p+1]);
    d.print(127,0,'label','TR',VD[p]);
    for(i=0;i<6;i++){
      x0=2+i*21;
      for(x=x0;x<x0+19;x++)
        for(y=10;y<26;y++)
          if(B[(y&3)*4+(x&3)]<LV[i]) d.px(x,y);
    }
    var bx=2+p*21;
    d.hline(bx,29,40);
    d.vline(bx,27,3);
    d.vline(bx+39,27,3);
    d.vline(bx+20,27,2);
    }
  },
  {
    id: "lifted-card",
    name: "Lifted Card",
    concept: "The PM2.5 reading sits on an outlined card that floats above the panel on a dithered drop shadow, breathing up and down; two small squares on the right run the A/B — one shadow dithered, one solid — so the failure is on screen next to the fix.",
    teaches: "A drop shadow is an offset silhouette MINUS the shape's own footprint, and at 1 bit it has to be dithered. A solid offset copy reads as a second object — a double image, which is what the right-hand HARD square shows — while a 1/4-to-3/4 dither reads as air underneath. Then bind density to offset: a tight 2px shadow stays dark (about 3/4), a 5px lift goes light (about 1/4). That density-follows-distance rule is the only blur this panel can fake. Because this API only turns pixels ON and never off, the shadow cannot simply be painted over — it has to skip the card rectangle as it draws, which is the same discipline you want on hardware anyway.",
    animated: "o = 2 + round(1.5*(1+sin(t/1100))) walks the shadow offset 2..5 px on a ~7s breath, and L = round(15 - 2.2*o) drops the shadow's Bayer level from about 3/4 down to about 1/4 as it lifts, so the card visibly rises off the glass instead of just sliding. The card, the number and the A/B squares never move — only the shadow does, which is what makes the lift read as depth rather than as a wobble.",
    draw: function (d, t, S) {
    var B=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
    var o=2+Math.round(1.5*(1+Math.sin(t/1100)));
    var L=Math.round(15-2.2*o), x, y;
    for(x=4+o;x<=81+o;x++) for(y=1+o;y<=26+o;y++){
      if(x<=81&&y<=26) continue;
      if(B[(y&3)*4+(x&3)]<L) d.px(x,y);
    }
    d.rect(4,1,78,26);
    d.print(9,3,'label','TL','PM2.5');
    d.print(9,13,'value','TL',String(Math.round(S.pm25)));
    d.print(36,16,'label','TL','ug/m3');
    for(x=93;x<=104;x++) for(y=6;y<=17;y++){
      if(x<=101&&y<=14) continue;
      if(B[(y&3)*4+(x&3)]<8) d.px(x,y);
    }
    d.rect(90,3,12,12);
    d.fillRect(122,6,3,12);
    d.fillRect(113,15,9,3);
    d.rect(110,3,12,12);
    d.print(89,20,'label','TL','SOFT');
    d.print(109,20,'label','TL','HARD');
    }
  },
  {
    id: "smoke-plate",
    name: "Smoke Plate",
    concept: "The whole panel fills with smoke texture that thickens from 1/16 to solid, while the reading sits inside a clear plate knocked out of it — a hole reserved in the background before a single texture pixel is laid.",
    teaches: "You cannot un-draw here, so plan the hole. Reserve the plate's rectangle plus a 1px margin before laying the background and the type survives every density, including solid — at which point the plate becomes a genuine inverse card for free, lit type in an unlit well inside a lit field. Skip the margin and the dither crawls into the glyph stems; 7px Roboto Mono dies somewhere around 1/2 and is gone by 3/4. On hardware you have the other option — filled_rectangle, then print with COLOR_OFF — but reserving the hole is the version that survives being ported to a renderer without a colour argument. One honest cost: a full-panel per-pixel dither is ~4096 draw_pixel calls per frame, which is fine at 5-10fps on an ESP32-C3 and is not fine at 60.",
    animated: "i = floor(t/1600) % 6 steps the background through the six Bayer levels every 1.6s, so the panel visibly fogs over a 9.6s loop and then snaps clear again. Nothing inside the plate moves at all — the number holds dead still while the world around it disappears, which is the entire demonstration. The readout at the plate's right names the current background level so you can see which density finally starts eating the frame.",
    draw: function (d, t, S) {
    var B=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
    var LV=[1,2,4,8,12,16], NM=['1/16','1/8','1/4','1/2','3/4','ALL'];
    var i=Math.floor(t/1600)%6, L=LV[i], x, y;
    for(x=0;x<128;x++) for(y=0;y<32;y++){
      if(x>18&&x<109&&y>5&&y<26) continue;
      if(B[(y&3)*4+(x&3)]<L) d.px(x,y);
    }
    d.rect(20,7,88,18);
    d.print(24,9,'value','TL',String(Math.round(S.pm25)));
    d.print(50,8,'label','TL','PM2.5');
    d.print(50,15,'label','TL','ug/m3');
    d.print(104,13,'label','TR','BG '+NM[i]);
    }
  },
  {
    id: "haze-horizon",
    name: "Haze Horizon",
    concept: "Doi Suthep as a solid black silhouette under a sky built from a vertical dither ramp — clear at the top, thickening toward the valley floor — with a dotted inversion layer that drifts up and down and a ramp depth set by the live PM2.5.",
    teaches: "A 16-step ramp across 17 rows does not give you 16 greys. It gives about four visible bands with hard Mach edges where they meet, and no amount of arithmetic hides that at this pixel pitch. So spend a gradient on ATMOSPHERE and never on data, and put your type where the ramp is empty rather than knocking a hole in it — the clear band above the inversion layer is free real estate that costs nothing to keep. The solid silhouette is what actually sells the depth: crisp black against graded texture is the only figure/ground separation a 1-bit panel owns, and the peak poking into the thinner part of the ramp reads as distance without a single extra pixel.",
    animated: "hc = 12 + round(2*sin(t/2600)) drifts the inversion ceiling between rows 10 and 14 on a ~16s breath, and every ramp row below it recomputes its Bayer level against that moving origin — so the whole graded body of haze rises and settles as one mass rather than sliding as a texture. The dotted line one row above hc marks the ceiling and moves with it. Ramp depth is data, not animation: Lmax = min(16, 4 + pm25/5), so clean air leaves a nearly empty sky and heavy smoke fills it to the mountain's shoulders.",
    draw: function (d, t, S) {
    var B=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
    var pm=Math.round(S.pm25);
    var Lmax=Math.min(16,Math.round(4+pm/5));
    var hc=12+Math.round(2*Math.sin(t/2600));
    var x, y, h1, h2, ry, L;
    d.print(2,0,'label','TL','PM2.5 '+pm);
    d.print(126,0,'label','TR','INVERSION');
    for(x=0;x<128;x++){
      h1=(x>12&&x<64)?9*(0.5+0.5*Math.cos((x-38)/26*Math.PI)):0;
      h2=(x>68&&x<112)?5*(0.5+0.5*Math.cos((x-90)/22*Math.PI)):0;
      ry=27-Math.round(h1+h2);
      for(y=hc;y<ry;y++){
        L=Math.round(Lmax*(y-hc)/(27-hc));
        if(L>0&&B[(y&3)*4+(x&3)]<L) d.px(x,y);
      }
      d.vline(x,ry,32-ry);
      if(x%4===0) d.px(x,hc-1);
    }
    }
  },
  {
    id: "moving-weave",
    name: "Moving Weave",
    concept: "Three bands of per-pixel dither all scrolling at the same rate — an 8px diagonal, a 4px diagonal, and a checkerboard — where two glide like fabric and the third strobes, with the drift speed set by the dust load.",
    teaches: "Texture can move only if its period along the scroll axis is LONGER than the step. The 8px and 4px diagonals have eight and four distinct phases, so they glide; the 1/2 checkerboard has period 2, which means a 1px shift does not move it at all, it INVERTS it — that is a strobe, not motion, and at ~11 steps/s it reads as noise and drags the eye to the wrong place. Watch bands two and three together: identical 50% ink, identical static tone, opposite behaviour the moment they move. And the useful half of that finding — motion survives where tone fails. You cannot confidently rank the 25% band against the 50% one as a static grey, but you can see either one drift instantly, which makes a moving texture a better liveness channel on this panel than any grey ever will be.",
    animated: "ph = floor(t*spd/90) advances the stripe phase one pixel about every 90ms, and every band samples ((x+y+ph) % k) < w, so the diagonals travel down-left continuously while the checker just flips polarity on the same clock. spd = 1 + pm25/40 ties the drift to the dust load: clean air gives a slow calm weave, heavy haze speeds it up and pushes the bottom band from an ugly flicker into an outright strobe — the failure gets worse exactly when the data does.",
    draw: function (d, t, S) {
    var pm=Math.round(S.pm25);
    var spd=1+pm/40;
    var ph=Math.floor(t*spd/90);
    var K=[8,4,2], W=[2,2,1], NM=['8PX','4PX','2PX'], Y=[1,12,23];
    var b, x, y, y0, k, w;
    for(b=0;b<3;b++){
      y0=Y[b]; k=K[b]; w=W[b];
      d.print(0,y0+4,'label','CL',NM[b]);
      for(x=16;x<128;x++)
        for(y=y0;y<y0+9;y++)
          if(((x+y+ph)%k)<w) d.px(x,y);
    }
    }
  }
];
if (typeof module !== "undefined" && module.exports) module.exports = SCREENS;
if (typeof window !== "undefined") window.SCREENS = SCREENS;
