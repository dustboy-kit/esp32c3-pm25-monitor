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
- Use the same device number in these three settings: `name`, `friendly_name`, and `device_id`.
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

### Wi-Fi transmit power

`dbk.yaml` sets `wifi_output_power: "8.5dBm"` (ESPHome's default of 20 dBm makes the
ESP32-C3 SuperMini clones fail with `Auth Expired`). `dbk-tx11.yaml` is the same firmware
at 11 dBm for range tests; override per device with `wifi_output_power` under
`substitutions:` in `workshop.yaml`. ESPHome accepts 8.5dB to 20.5dB in 0.25 dB steps
(the chip rounds down to 8.5, 11, 13, 14, 15, 16.5, 18, 19.5, 20).

### 5. Connect and flash

- Connect the ESP32-C3 by USB.
- Run:

```bash
esphome run workshop.yaml
```

- Select the USB serial device when ESPHome asks.
- Flash using USB with `esphome run workshop.yaml`.

### Change the Wi‑Fi network

- Two methods are available:

  1. **Edit the code and flash by USB:** change `wifi_ssid` and `wifi_password` in `secrets.yaml`, then run `esphome run workshop.yaml`.
  2. **Use the setup AP:** if the saved network cannot be reached, connect to `DBK-xxx` with password `12345678`, open [http://192.168.4.1](http://192.168.4.1), and enter the new Wi‑Fi details.

- Edit `secrets.yaml`:

```yaml
wifi_ssid: new-wifi-name
wifi_password: new-wifi-password
```

- Flash again by USB with `esphome run workshop.yaml`.
- If Wi‑Fi fails, connect to the temporary AP:
  - SSID: `DBK-xxx`
  - Password: `12345678`
  - Open: [http://192.168.4.1](http://192.168.4.1)
  - AP starts after 90 seconds.
  - AP remains available for 15 minutes.
- Enter the new Wi‑Fi details and save.

For a factory image that has no credentials, use the Thai/English
[USB Wi‑Fi setup page](https://dustboy-kit.github.io/esp32c3-pm25-monitor/wifi/).
It follows the KRU32 flow: choose the settled Serial port first, then launch
Improv Serial and send the SSID/password without editing YAML.
If provisioning times out, open the bilingual
[Wi‑Fi recovery guide](https://dustboy-kit.github.io/esp32c3-pm25-monitor/wifi/recovery/).
The published ESP32-C3 images use the hardware-tested compatibility settings
`output_power: 8.5dBm`, `power_save_mode: none`, and `fast_connect: true`.
On the target SuperMini board, the ESPHome default 20 dBm repeatedly returned
`Auth Expired`; the same board, router, and credentials connected immediately
at 8.5 dBm.

### Force the setup AP

- Turn off the Wi‑Fi hotspot or router the device normally uses.
- Reboot the device.
- Wait for the 90-second countdown.
- Connect to `DBK-xxx` with password `12345678`.
- Open [http://192.168.4.1](http://192.168.4.1).
- Turn the normal Wi‑Fi back on after configuration.

### Open the DBK device page

- Connect the computer to the same Wi‑Fi network as the DBK device.
- Open `http://dbk-001.local/` in a browser.
- Replace `dbk-001` with the device `name` if a different ID was configured.
- The page shows device status and provides basic controls.
- Factory and Canvas images embed ESPHome Web Server v3, so this UI, its REST
  JSON endpoints, and `/events` SSE stream work without an internet connection.
- A factory node gets a unique MAC-suffixed hostname such as
  `dbk-a1b2c3.local`. Its persistent friendly alias starts as `DBK A1B2C3` and
  can be changed from the device page, Home Assistant, or the
  [DustBoy Telemetry Dashboard](https://dustboy-kit.github.io/esp32c3-pm25-monitor/dashboard/).
- The alias is intentionally separate from the hostname: changing it never
  breaks mDNS, OTA, or the native ESPHome API address.

### REST JSON and browser JSON-RPC

ESPHome serves entity JSON directly on the local network:

```text
GET  http://dbk-a1b2c3.local/sensor/PM2.5
GET  http://dbk-a1b2c3.local/text/Device%20Alias
POST http://dbk-a1b2c3.local/text/Device%20Alias/set?value=DBK%20LAB%202
GET  http://dbk-a1b2c3.local/events
```

`site/tools/dbk-esphome-rpc.js` is a zero-server JSON-RPC 2.0 adapter over that
official Web API. The hosted dashboard uses it for `telemetry.snapshot`,
`device.info`, `entity.get`, `alias.set`, `button.press`, and `device.restart`.
The browser still talks directly to the ESP32; no telemetry proxy or cloud is
introduced. If a browser blocks an HTTPS Pages app from reaching an HTTP LAN
address, open the embedded on-device UI instead.

## Optional MQTT

- The base `dbk.yaml` does not include MQTT, and the prebuilt images on the site
  carry no broker credentials.
- `workshop.yaml` (copy of `workshop.yaml.example`) is the per-kit build: it includes
  `dbk.yaml` plus `packages/mqtt.yaml` and sets the kit's `device_id`.
  1. Set `name`, `friendly_name` and `device_id` to the kit's id (`DBK-001`, `DBK-002`, ...).
     Keep the `DBK-` prefix: it is the MQTT topic segment and the name the CCDC
     collector looks up.
  2. Ask the instructor for the broker, port, username, and password and put them in
     `secrets.yaml` (copy `secrets.yaml.example`):

     ```yaml
     mqtt_broker: mqtt.example.com
     mqtt_port: "1883"
     mqtt_username: your-mqtt-username
     mqtt_password: your-mqtt-password
     ```

  3. Flash by USB: `esphome run workshop.yaml`.
  4. If MQTT is not needed, remove the `mqtt` package line from `workshop.yaml`.

### Wi‑Fi and MQTT status on the display

- The Wi‑Fi symbol is filled when the device is connected to Wi‑Fi. An outlined or crossed symbol means it is disconnected.
- When Wi‑Fi is connected, the top-left area shows the current time. When it is disconnected, it shows the remaining seconds before the setup access point appears, followed by the access-point countdown.
- The MQTT circle is filled when the device is connected to the MQTT broker. An outlined circle means MQTT is not connected.
- Wi‑Fi and MQTT are separate: the device can have Wi‑Fi while MQTT is still unavailable because the broker or credentials are incorrect.
- If Wi‑Fi cannot be joined, the temporary setup AP is named `DBK-xxx` and uses password `12345678`. It appears after 90 seconds and remains available for 15 minutes.

- Topics, same layout as the Model-N Wi-Fi fleet:
  - `DUSTBOY/DBK/<device-id>/status`: one JSON snapshot every 30 seconds,
    `{"info": {"mac", "ip", "version", "device_id"}, "d": {"myName", "alias", "pm1", "pm2_5", "pm10", "rssi", "uptime_s"}}`.
    The fleet collector (`00_mz_forwarder`, params `030_model_dbk.yml`) reads `d.pm1`,
    `d.pm2_5`, `d.pm10` and takes the kit name from the topic.
  - `DUSTBOY/DBK/<device-id>/lwt`: `online` / `offline` (birth and will, retained).
  - ESPHome's per-entity topics (`DUSTBOY/DBK/<device-id>/sensor/pm2_5/state`, ...).
- Home Assistant discovery and the MQTT log topic are off: the classroom broker
  account is write-only inside `DUSTBOY/DBK/+/#`.
- MQTT remains opt-in because broker credentials must never be embedded in a
  public factory image.

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

## Bluetooth variant (no Wi-Fi)

`dbk-ble.yaml` is the same monitor without Wi-Fi. The board advertises as `DBK-xxxxxx`
and serves PM1.0 / PM2.5 / PM10 over a BLE GATT service, so a phone or laptop reads it
without a network, an access point, or any Wi-Fi TX power workaround.

- Flash: open the site and press **Flash DBK Bluetooth**, or run `esphome run dbk-ble.yaml`.
- Read: open `site/ble/` (`https://dustboy-kit.github.io/esp32c3-pm25-monitor/ble/`) in
  Chrome or Edge on Android, macOS, Windows or Linux and press **Connect**. iOS Safari has no
  Web Bluetooth; use the Bluefy app.
- OLED top row shows uptime, a Bluetooth icon with the connected-client count, and the device ID.
- GATT service `d8b70001-5b1e-4c3a-9f2e-00d0b0000001`: PM1 `…0002`, PM2.5 `…0003`,
  PM10 `…0004` (float32 little-endian, read + notify every second), status `…0005`
  (UTF-8 `GOOD` / `FAIR` / `BAD` / `SENSOR ERROR`), alias `…0006`.
- Wireless update: `site/ble/ota.html` streams an ESPHome `.ota.bin` into the idle app slot
  over BLE (`ota_ctrl` `…0010`, `ota_data` `…0011`, `ota_status` `…0012`; see
  `packages/ble_ota.h`). The board checks size and SHA-256 before switching slots, so a lost
  link or a wrong file leaves it on the current firmware. There is no bootloader rollback:
  an image that verifies but crashes at boot needs a USB flash. Boards must take one USB
  flash of 0.2.0-ble or newer first. `site/firmware/dbk-ble.ota.bin` is the latest image.
- The Wi-Fi firmware (`dbk.yaml`) is unchanged. Wi-Fi and BLE are not combined on purpose:
  the single-core ESP32-C3 SuperMini clones in the kit are short on RAM and on Wi-Fi margin.

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
