#!/usr/bin/env python3
"""Fake PMS7003 for the QEMU board simulator.

Listens on 127.0.0.1:<port> (default 5556). QEMU connects UART1 to it
(-serial tcp:127.0.0.1:5556), and this script sends one real 32-byte PMS7003 frame per
second: 0x42 0x4D, length 28, 13 data words, 16-bit checksum. PM2.5 sweeps 0..120 over a
minute so the kit's GOOD / FAIR / BAD colours all show. The firmware's own pmsx003 parser
reads it, exactly as on a real board.
"""
import math, socket, struct, sys, time

port = int(sys.argv[1]) if len(sys.argv) > 1 else 5556
srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(("127.0.0.1", port))
srv.listen(1)
print(f"pms feeder on 127.0.0.1:{port}, waiting for QEMU", flush=True)
conn, _ = srv.accept()
print("QEMU connected", flush=True)
t0 = time.time()
while True:
    phase = ((time.time() - t0) % 60) / 60
    pm25 = int(60 * (1 - math.cos(phase * 2 * math.pi)))
    pm1, pm10 = int(pm25 * 0.62), int(pm25 * 1.45)
    words = [pm1, pm25, pm10, pm1, pm25, pm10, 0, 0, 0, 0, 0, 0, 0]
    body = b"\x42\x4d" + struct.pack(">H", 28) + struct.pack(">13H", *words)
    frame = body + struct.pack(">H", sum(body) & 0xFFFF)
    try:
        conn.sendall(frame)
    except OSError:
        break
    print(f"pm1={pm1} pm25={pm25} pm10={pm10}", flush=True)
    time.sleep(1)
