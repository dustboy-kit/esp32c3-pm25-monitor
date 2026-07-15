# DBK ESP32-C3 PM2.5 Monitor

ESPHome firmware for the Dustboy Kit: an ESP32-C3, PMS7003 particulate sensor, and 128x32 SSD1306 OLED. The display shows PM1.0, PM2.5, and PM10 readings.

## Beginner setup

### 1. Download the code

```bash
git clone https://github.com/dustboy-kit/esp32c3-pm25-monitor.git
cd esp32c3-pm25-monitor
```

Install ESPHome:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

### 2. Create your local configuration

```bash
cp workshop.yaml.example workshop.yaml
cp secrets.yaml.example secrets.yaml
```

Both files are local-only and are ignored by Git.

### 3. Set the device ID

Open `workshop.yaml` and use the same number in all three settings. For device 001:

```yaml
substitutions:
  name: dbk-001
  friendly_name: DBK-001
  device_id: DBK-001
  name_add_mac_suffix: "false"
```

Use `DBK-002`, `DBK-003`, and so on for additional devices. Keep `name` lowercase; the other two values are shown as `DBK-xxx`.

### 4. Set Wi-Fi

Open `secrets.yaml` and enter the Wi-Fi details:

```yaml
wifi_ssid: your-wifi-name
wifi_password: your-wifi-password
```

Do not commit or share `secrets.yaml`.

### 5. Connect and flash

Connect the ESP32-C3 by USB, then run:

```bash
esphome run workshop.yaml
```

Select the USB serial device when ESPHome asks. The first upload must use USB. Later updates can use USB or OTA after the device is on Wi-Fi.

## Optional MQTT

The example workshop configuration includes the DBK MQTT package. Ask the workshop instructor for the current broker address, port, DBK username, and DBK password. Do not guess these values or copy credentials from another project.

If your workshop does not use MQTT, remove this line from `workshop.yaml`:

```yaml
  mqtt: !include packages/mqtt.yaml
```

If MQTT is enabled, also fill in the MQTT fields in `secrets.yaml`:

```yaml
mqtt_broker: mqtt.example.com
mqtt_port: "1883"
mqtt_username: dbk
mqtt_password: your-mqtt-password
```

## Hardware wiring

| Device | Pin | ESP32-C3 |
|---|---|---:|
| PMS7003 VCC pins 1/2 | 5V | 5V |
| PMS7003 GND pins 3/4 | GND | GND |
| PMS7003 TX pin 9 | GPIO6 | GPIO6 |
| PMS7003 RX pin 7 | GPIO7 | GPIO7 |
| PMS7003 SET pin 10 | GPIO5 | GPIO5 |
| PMS7003 RESET pin 5 | GPIO8 | GPIO8 |
| SSD1306 VCC | 3V3 | 3V3 |
| SSD1306 GND | GND | GND |
| SSD1306 SDA | GPIO9 | GPIO9 |
| SSD1306 SCL | GPIO10 | GPIO10 |

The PMS7003 needs a stable 5V supply. Disconnect power before changing wiring.

## License

MIT
