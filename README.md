# DBK ESP32-C3 PM2.5 Monitor

- ESP32-C3 + PMS7003 particulate sensor
- 128×32 SSD1306 OLED
- Displays PM1.0, PM2.5, and PM10

## Beginner setup

### 1. Download the code

- Open the repository page.
- Choose **Code → Download ZIP**.
- Extract the ZIP file.
- No GitHub account or Git installation is needed.
- Open a terminal in the extracted `esp32c3-pm25-monitor` folder.

- Follow the [official ESPHome installation guide](https://esphome.io/guides/installing_esphome/).
- Run:

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

- Open `workshop.yaml`.
- Use the same device number in all three settings.
- Example for device 001:

```yaml
substitutions:
  name: dbk-001
  friendly_name: DBK-001
  device_id: DBK-001
  name_add_mac_suffix: "false"
```

- Use `DBK-002`, `DBK-003`, and so on for additional devices.
- Keep `name` lowercase.
- Keep the `DBK-` prefix in `device_id` for MQTT topics.

### 4. Set Wi-Fi

- Open `secrets.yaml`.
- Enter the Wi‑Fi details:

```yaml
wifi_ssid: your-wifi-name
wifi_password: your-wifi-password
```

- Do not commit or share `secrets.yaml`.

### 5. Connect and flash

- Connect the ESP32-C3 by USB.
- Run:

```bash
esphome run workshop.yaml
```

- Select the USB serial device when ESPHome asks.
- Flash using USB.

### Change the Wi‑Fi network

- Two methods are available:

  1. **Edit the code and flash by USB:** change `wifi_ssid` and `wifi_password` in `secrets.yaml`, then flash the device.
  2. **Use the setup AP:** if the saved network cannot be reached, connect to `DBK-xxx` with password `12345678`, open [http://192.168.4.1](http://192.168.4.1), and enter the new Wi‑Fi details.

- Edit `secrets.yaml`:

```yaml
wifi_ssid: new-wifi-name
wifi_password: new-wifi-password
```

- Flash again by USB after changing the Wi‑Fi settings.
- If Wi‑Fi fails, connect to the temporary AP:
  - SSID: `DBK-xxx`
  - Password: `12345678`
  - Open: [http://192.168.4.1](http://192.168.4.1)
  - AP starts after 90 seconds.
  - AP remains available for 15 minutes.
- Enter the new Wi‑Fi details and save.

### Force the setup AP

- Change `wifi_password` in `secrets.yaml` to an incorrect value.
- Flash the device by USB.
- Reboot the device.
- Wait for the 90-second countdown.
- Connect to `DBK-xxx` with password `12345678`.
- Open [http://192.168.4.1](http://192.168.4.1).
- Restore the correct Wi‑Fi settings after configuration.

## Optional MQTT

- The workshop configuration includes MQTT.
- Ask the instructor for the current broker, port, username, and password.
- Do not copy credentials from another project.

- If MQTT is not needed, remove this line from `workshop.yaml`:

```yaml
mqtt: !include packages/mqtt.yaml
```

- If MQTT is enabled, enter the instructor-provided values in `secrets.yaml`:

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
- If Wi‑Fi cannot be joined, the temporary setup AP is named `DBK-xxx` and uses password `12345678`. It appears after 90 seconds and remains available for 15 minutes.

- Topic prefix: `DUSTBOY/DBK/<device-id>/`
- MQTT discovery: disabled
- Use the topics directly if MQTT is enabled.

### OLED layout

- Display: 128×32 pixels
- Right side: MQTT circle, Wi‑Fi symbol, device name

#### 1. Splash screen
```text
┌──────────────────────────────────────────────────────────────┐
│                 Dustboy Kit For Kids                         │
│              ┌────────────────────────┐                      │
│              └────────────────────────┘                      │
└──────────────────────────────────────────────────────────────┘
```

#### 2. Wi‑Fi and MQTT not connected
After power-on, while Wi‑Fi is not connected, the left side shows the 90-second countdown:
```text
┌──────────────────────────────────────────────────────────────┐
│ (89s)                             ○  Wi‑Fi          DBK-001  │
├──────────────────────────────────────────────────────────────┤
│       PM1              PM2.5                  PM10           │
│        4                9                     11             │
└──────────────────────────────────────────────────────────────┘
```

#### 3. Wi‑Fi lost or still not connected after power
After 90 seconds, the setup access point is active for 15 minutes:
```text
┌──────────────────────────────────────────────────────────────┐
│ (AP 15m)                          ○  Wi‑Fi          DBK-001  │
├──────────────────────────────────────────────────────────────┤
│       PM1              PM2.5                  PM10           │
│        4                9                     11             │
└──────────────────────────────────────────────────────────────┘
```

#### 4. Wi‑Fi connected, MQTT not connected
```text
┌──────────────────────────────────────────────────────────────┐
│ 12:34                              ○  Wi‑Fi          DBK-001 │
├──────────────────────────────────────────────────────────────┤
│       PM1              PM2.5                  PM10           │
│        4                9                     11             │
└──────────────────────────────────────────────────────────────┘
```

#### 5. Wi‑Fi and MQTT connected
```text
┌──────────────────────────────────────────────────────────────┐
│ 12:34                              ●  Wi‑Fi          DBK-001 │
├──────────────────────────────────────────────────────────────┤
│       PM1              PM2.5                  PM10           │
│        4                9                     11             │
└──────────────────────────────────────────────────────────────┘
```

#### 6. Checking sensor and sensor error
- First 30 seconds: `CHECKING SENSOR...`
- Missing readings: `SENSOR ERROR`

- Filled MQTT circle: broker connected
- Outlined MQTT circle: broker disconnected
- Filled Wi‑Fi symbol: Wi‑Fi connected
- Crossed Wi‑Fi symbol: Wi‑Fi disconnected

## Hardware wiring

| Device               | Pin    | ESP32-C3 |
| -------------------- | ------ | -------: |
| PMS7003 VCC pins 1/2 | 5V     |       5V |
| PMS7003 GND pins 3/4 | GND    |      GND |
| PMS7003 TX pin 9     | GPIO6  |    GPIO6 |
| PMS7003 RX pin 7     | GPIO7  |    GPIO7 |
| PMS7003 SET pin 10   | GPIO5  |    GPIO5 |
| PMS7003 RESET pin 5  | GPIO8  |    GPIO8 |
| SSD1306 VCC          | 3V3    |      3V3 |
| SSD1306 GND          | GND    |      GND |
| SSD1306 SDA          | GPIO9  |    GPIO9 |
| SSD1306 SCL          | GPIO10 |   GPIO10 |

- PMS7003 requires stable 5V power.
- Disconnect power before changing wiring.

## License

MIT
