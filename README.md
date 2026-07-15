# DBK ESP32-C3 PM2.5 Monitor

ESPHome firmware for a compact real-time particulate monitor built from an ESP32-C3 SuperMini, Plantower PMS7003, 0.91-inch SSD1306 OLED, and one WS2812 LED.

The firmware measures PM1.0, PM2.5, and PM10, shows a "Dustboy Kit For Kids" startup screen followed by the 128x32 instrument dashboard, exposes measurements to Home Assistant, and supports Wi-Fi provisioning and OTA updates.

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

The generic firmware has no embedded Wi-Fi credentials. Provision it through Improv Serial, Improv BLE, or the fallback access point, then adopt it in Home Assistant or the ESPHome dashboard. When Wi-Fi is unavailable, `(AP 90s)` in the OLED header counts down until the fallback access point starts. It then changes to `(RST 14m)` and counts down to the 15-minute Wi-Fi recovery reboot. A successful Wi-Fi connection cancels and resets both timers.

When connected, the main-page header shows SNTP time in `HH:MM` format using the configurable `timezone` substitution. The default timezone is `Asia/Bangkok`.

## Configuration

### Device identity

Every numbered unit uses the public identity `DBK-xxx`, where `xxx` is its unique three-digit unit number. For example, the first unit is `DBK-001`.

| Setting | Example | Used for |
|---|---|---|
| `name` | `dbk-001` | ESPHome hostname; must be lowercase |
| `friendly_name` | `DBK-001` | Home Assistant and ESPHome display name |
| `device_id` | `DBK-001` | OLED header and MQTT topic identity |

Keep the same number in all three settings. A configured `DBK-001` publishes below the MQTT root `DUSTBOY/DBK/WiFi/DBK-001`.

The generic factory image uses a MAC suffix so the same image can safely boot on multiple unnumbered devices. Assign the `DBK-xxx` identity when configuring an individual unit.

### Configure a numbered unit

Create local configuration files from the public templates:

```bash
cp workshop.yaml.example workshop.yaml
cp secrets.yaml.example secrets.yaml
```

Edit `workshop.yaml` and replace `001` with the number assigned to the unit:

```yaml
substitutions:
  name: dbk-001
  friendly_name: DBK-001
  device_id: DBK-001
  name_add_mac_suffix: "false"

packages:
  device: !include dbk.yaml
  mqtt: !include packages/mqtt.yaml

wifi:
  networks:
    - ssid: !secret wifi_ssid
      password: !secret wifi_password
```

Edit `secrets.yaml` with the Wi-Fi network and, when using the DustBoy broker, the DBK MQTT credentials:

```yaml
mqtt_broker: mqtt.example.com
mqtt_port: "1883"
mqtt_username: dbk
mqtt_password: change-me
wifi_ssid: change-me
wifi_password: change-me
```

Validate and flash the numbered configuration:

```bash
esphome config workshop.yaml
esphome run workshop.yaml
```

`workshop.yaml` and `secrets.yaml` are ignored by Git. Never commit either file or place real credentials in `*.example` files.

Users who do not need MQTT can use the generic `dbk.yaml` image and provision Wi-Fi through Improv Serial, Improv BLE, or the fallback access point.

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
