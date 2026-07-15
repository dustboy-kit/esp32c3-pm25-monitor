# DBK ESP32-C3 PM2.5 Monitor

ESPHome firmware for a compact real-time particulate monitor built from an ESP32-C3 SuperMini, Plantower PMS7003, 0.91-inch SSD1306 OLED, and one WS2812 LED.

The firmware measures PM1.0, PM2.5, and PM10, reproduces the original 128x32 instrument display, exposes measurements to Home Assistant, and supports Wi-Fi provisioning and OTA updates.

## Hardware

| Device | Pin | ESP32-C3 |
|---|---|---:|
| PMS7003 | VCC pins 1/2 | 5V |
| PMS7003 | GND pins 3/4 | GND |
| PMS7003 | TX pin 9 | GPIO6 |
| PMS7003 | RX pin 7 | GPIO7 |
| PMS7003 | SET pin 10 | GPIO5 |
| PMS7003 | RESET pin 5 | GPIO8 |
| SSD1306 OLED | VCC | 3V3 |
| SSD1306 OLED | GND | GND |
| SSD1306 OLED | SDA | GPIO9 |
| SSD1306 OLED | SCL | GPIO10 |
| WS2812 | VCC | 5V |
| WS2812 | GND | GND |
| WS2812 | DIN | GPIO2 |

The PMS7003 requires a stable 5V supply. Its UART signals are 3.3V-compatible. Always disconnect power before changing wiring.

GPIO2, GPIO8, and GPIO9 are ESP32-C3 strapping pins. This firmware matches the proven reference wiring, but new PCB designs should review those connections carefully and every assembled unit should be cold-boot tested with all peripherals attached.

## Air-quality indication

| PM2.5 | LED | State |
|---:|---|---|
| 0-25 ug/m3 | Green | GOOD |
| 26-50 ug/m3 | Yellow | FAIR |
| Above 50 ug/m3 | Red | BAD |
| First 30 seconds | Blue | WARMING UP |
| Missing sensor data | Magenta | SENSOR ERROR |

## Install

### ESPHome CLI

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
esphome run dbk.yaml
```

The first flash uses the ESP32-C3 native USB connection. Subsequent updates can use OTA.

### ESPHome dashboard

Import this package URL:

```text
github://dustboy-kit/esp32c3-pm25-monitor/dbk.yaml@main
```

The generic firmware has no embedded Wi-Fi credentials. Provision it through Improv Serial, Improv BLE, or the fallback access point, then adopt it in Home Assistant or the ESPHome dashboard.

## Configuration

The top-level substitutions control the device identity, thresholds, warm-up time, and stale-data timeout. `name_add_mac_suffix` is enabled so one factory image can be installed on multiple devices safely.

For DustBoy MQTT deployments, copy `secrets.yaml.example` to `secrets.yaml` and add this package to a local device configuration:

```yaml
packages:
  device: !include dbk.yaml
  mqtt: !include packages/mqtt.yaml
```

Set a unique `name` such as `dbk-001` for every MQTT-connected unit. Its MQTT root will be `DUSTBOY/DBK/WiFi/dbk-001`.

Never commit `secrets.yaml`.

## Development

```bash
esphome config dbk.yaml
esphome compile factory.yaml
```

Pull requests validate and compile the factory image. Tags matching `v*` publish factory and OTA binaries as a GitHub release.

Before a hardware release, verify repeated cold boots, sensor readings, OLED orientation, all PM2.5 threshold boundaries, sensor-disconnect behavior, provisioning, OTA, and at least 24 hours of continuous operation.

## Origin

This is an independent ESPHome implementation inspired by [KakaoFull/esp32c3-pm25-monitor](https://github.com/KakaoFull/esp32c3-pm25-monitor). It uses ESPHome's native components rather than copying the original PlatformIO source.

## License

MIT
