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

If MQTT is enabled, ask the workshop instructor for the current MQTT broker, port, username, and password. Enter the values they provide in `secrets.yaml`:

```yaml
mqtt_broker: mqtt.example.com
mqtt_port: "1883"
mqtt_username: your-mqtt-username
mqtt_password: your-mqtt-password
```

### Wi‑Fi and MQTT status on the display

- The Wi‑Fi symbol is filled when the device is connected to Wi‑Fi. An outlined or crossed symbol means it is disconnected.
- When Wi‑Fi is connected, the top-left area shows the current time. When it is disconnected, it shows the remaining seconds before the setup access point appears, followed by the access-point countdown.
- The MQTT circle is filled when the device is connected to the MQTT broker. An outlined circle means MQTT is not connected.
- Wi‑Fi and MQTT are separate: the device can have Wi‑Fi while MQTT is still unavailable because the broker or credentials are incorrect.

When MQTT is connected, the device publishes its status and sensor values under the `DUSTBOY/DBK/<device-id>/` topic prefix. MQTT discovery is disabled; use the topics directly or configure your own dashboard.

### OLED layout

The display is a 128×32 pixel OLED. These diagrams show the complete screen in each state. The MQTT circle and Wi‑Fi symbol are grouped with the device name on the right.

```text
┌──────────────────────────────────────────────────────────────┐
│                 Dustboy Kit For Kids                         │  Splash (3s)
│              ┌────────────────────────┐                      │
│              └────────────────────────┘                      │
└──────────────────────────────────────────────────────────────┘
```

```text
┌──────────────────────────────────────────────────────────────┐
│ 12:34                              ●  Wi‑Fi          DBK-001 │  Wi‑Fi + MQTT
├──────────────────────────────────────────────────────────────┤
│       PM1              PM2.5                  PM10            │
│        4                9                     11              │
└──────────────────────────────────────────────────────────────┘
```

If Wi‑Fi is connected but MQTT is not, only the MQTT circle changes to an outline:

```text
┌──────────────────────────────────────────────────────────────┐
│ 12:34                              ○  Wi‑Fi          DBK-001 │  Wi‑Fi only
├──────────────────────────────────────────────────────────────┤
│       PM1              PM2.5                  PM10            │
│        4                9                     11              │
└──────────────────────────────────────────────────────────────┘
```

When Wi‑Fi is lost, the clock is replaced by a 90-second countdown:

```text
┌──────────────────────────────────────────────────────────────┐
│ (89s)                             ○  Wi‑Fi          DBK-001 │  Waiting
├──────────────────────────────────────────────────────────────┤
│       PM1              PM2.5                  PM10            │
│        4                9                     11              │
└──────────────────────────────────────────────────────────────┘
```

After 90 seconds, the setup access point is active for 15 minutes:

```text
┌──────────────────────────────────────────────────────────────┐
│ (AP 15m)                          ○  Wi‑Fi          DBK-001 │  Setup AP
├──────────────────────────────────────────────────────────────┤
│       PM1              PM2.5                  PM10            │
│        4                9                     11              │
└──────────────────────────────────────────────────────────────┘
```

During the first 30 seconds after boot, the sensor area shows:

```text
┌──────────────────────────────────────────────────────────────┐
│ 12:34                              ●  Wi‑Fi          DBK-001 │
├──────────────────────────────────────────────────────────────┤
│                     CHECKING SENSOR...                       │
└──────────────────────────────────────────────────────────────┘
```

If the sensor stops providing readings, it shows:

```text
┌──────────────────────────────────────────────────────────────┐
│ 12:34                              ●  Wi‑Fi          DBK-001 │
├──────────────────────────────────────────────────────────────┤
│                       SENSOR ERROR                           │
└──────────────────────────────────────────────────────────────┘
```

The filled MQTT circle means connected to the broker; the outlined circle means disconnected. The filled Wi‑Fi symbol means connected to Wi‑Fi; the crossed symbol means disconnected.

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
