#!/usr/bin/env python3
"""Fake DustBoy Kit for the QEMU JC3248 screen: sends DBK link v1 JSON lines.

Listens on 127.0.0.1:<port> (default 5557); QEMU connects the screen's UART1 to it
(-serial tcp:127.0.0.1:5557). Every 5 s one line, the same object the kit broadcasts over
ESP-NOW (Soul-Brews-Studio/esp32-oracle#32), with PM2.5 sweeping 0..120 over a minute.
"""
import json, math, socket, sys, time

port = int(sys.argv[1]) if len(sys.argv) > 1 else 5557
srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(("127.0.0.1", port))
srv.listen(1)
print(f"dbk feeder on 127.0.0.1:{port}, waiting for QEMU", flush=True)
conn, _ = srv.accept()
print("QEMU connected", flush=True)
t0 = time.time()
while True:
    up = int(time.time() - t0)
    pm25 = int(60 * (1 - math.cos((up % 60) / 60 * 2 * math.pi)))
    band = "good" if pm25 <= 25 else ("fair" if pm25 <= 50 else "poor")
    msg = {"t": "dbk", "v": 1, "id": "173e5c", "pm25": pm25, "pm10": int(pm25 * 1.45),
           "pm1": int(pm25 * 0.62), "band": band, "rssi": -60, "up": up}
    try:
        conn.sendall((json.dumps(msg, separators=(",", ":")) + "\n").encode())
    except OSError:
        break
    print(msg, flush=True)
    time.sleep(5)
