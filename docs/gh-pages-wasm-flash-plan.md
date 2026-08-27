# DustBoy ESP32C3 — Evidence → Instructions → TODO → Delivery Plan

Repository: https://github.com/dustboy-kit/esp32c3-pm25-monitor  
Working copy: `/opt/Code/github.com/dustboy-kit/esp32c3-pm25-monitor`

## 1. Collect data first (evidence register)

### 1.1 Repository and firmware
- [x] Confirm the repository, default branch, and current commit with `gh repo view` / `git log`.
- [x] Record hardware from `README.md` and packages: ESP32-C3, PMS7003, SSD1306 128×32, I²C address `0x3C`.
- [x] Record build inputs: `factory.yaml`, `dbk.yaml`, `packages/*.yaml`, `requirements.txt`, and existing ESPHome CI.
- [x] Record provisioning behavior: fallback AP `DBK-xxx`, password `12345678`, `http://192.168.4.1`, hostname after join.
- [ ] Capture one known-good factory binary checksum and ESP image header (`0xE9`) from a tagged release.

### 1.2 Wiki/gallery and simulator
- [x] Read Dashboard Gallery: 22 dashboard screen designs and live gallery URLs.
- [x] Read Firmware Gallery: 30 OLED lambdas, host SDL simulator intent, credential-free design, and limitations.
- [x] Verify current upstream HEAD does **not** contain `sim/gallery.yaml`; import/adapt it from the haos-oracle workspace before treating it as source code.
- [x] Record canonical editor: https://dbk-oled-studio.pages.dev/tools/esphome-canvas-simulator
- [ ] Decide whether the Pages site embeds the editor or links to it (embedding must be checked against its CSP).

### 1.3 Flashing and Wi-Fi reference
- [x] Inspect KRU32 pattern: `esp-web-tools`, JSON manifests, factory image, explicit offset, `new_install_prompt_erase: false`.
- [x] Record KRU32 post-flash rule: Wi-Fi/Improv is a separate step after USB re-enumeration.
- [ ] Verify a DustBoy-specific factory image on physical ESP32-C3 hardware.
- [ ] Verify Chrome and Edge behavior on macOS/Linux, including cancel/reconnect and cold power-cycle.

### 1.4 Deployment evidence
- [x] Add a static Pages scaffold under `site/` and workflow `.github/workflows/pages.yaml`.
- [x] Add manifest template `site/manifests/dbk.json` pointing to the latest GitHub release asset.
- [ ] Enable Pages in repository settings and confirm `gh api repos/dustboy-kit/esp32c3-pm25-monitor/pages` returns a configured site (currently it returns 404).
- [ ] Confirm the first deployed URL and test all manifest/binary URLs over HTTPS.

## 2. Operating instructions (how to use the system)

1. **Develop firmware:** edit ESPHome YAML/packages; never put credentials in Git.
2. **Validate firmware:** run `esphome config dbk.yaml`, `esphome config factory.yaml`, and `esphome compile factory.yaml`.
3. **Validate displays:** after importing the simulator, run `just lab-sim dbk`; native compilation is authoritative over browser translation.
4. **Publish firmware:** push a `v*` tag; release workflow uploads `dbk.factory.bin` and `dbk.ota.bin`.
5. **Flash:** open the Pages site in Chrome/Edge, connect a data USB cable, choose the ESP32-C3 manifest, and flash only a supported board.
6. **Recover/configure Wi-Fi:** unplug/replug after flash, wait for re-enumeration, then use the separate `/wifi/` guide and AP fallback.
7. **Report failures:** capture browser, OS, board revision, release tag, serial log, and whether a cold power-cycle was performed.

## 3. Step-by-step TODO checklist

### A. Data and source alignment
- [ ] Import/adapt `sim/gallery.yaml`, `tools/lab-sim.py`, and required `justfile` target from the haos-oracle workspace.
- [ ] Compare every imported lambda with the real `packages/oled.yaml`; document intentional differences.
- [ ] Add a `docs/evidence/` record containing commit SHA, binary checksums, and hardware test notes.

### B. Pages UI
- [x] Static landing page with simulator link and flash control.
- [x] Separate Wi-Fi setup page.
- [ ] Add gallery cards/canvas previews for all 30 screens.
- [ ] Add explicit browser compatibility and USB troubleshooting panel.
- [ ] Add a release selector once more than one firmware version exists.

### C. Firmware and manifests
- [x] Manifest schema template with C3 chip family and offset `0`.
- [ ] Confirm factory image layout and update manifest path/checksum strategy.
- [ ] Generate manifests automatically from release metadata; fail CI when an asset is missing or not an ESP image.
- [ ] Keep C3 and JC3248W535/S3 manifests and binaries completely separate.

### D. CI/CD and QA
- [x] Pages workflow scaffold using official Pages actions.
- [ ] Run Pages build on a branch and inspect artifact contents/base path.
- [ ] Enable Pages and verify the production URL.
- [ ] Run native simulator, ESPHome compile, site build, manifest HTTP checks, and Playwright smoke tests.
- [ ] Execute the physical flash matrix and publish results.

## 4. Delivery plan (in order)

### Phase 0 — Evidence gate
Finish section 1A–1D, obtain a tagged factory binary, and record checksums. **Exit:** all URLs/configs are known and hardware artifact is reproducible.

### Phase 1 — Source alignment
Import the simulator files, reconcile lambdas with real firmware, and add deterministic local commands. **Exit:** native simulator and ESPHome compile pass from a clean checkout.

### Phase 2 — Pages preview
Expand `site/` into the 30-screen gallery and verify repository base-path links. **Exit:** Pages artifact renders all screens without secrets.

### Phase 3 — Flash release
Generate manifests from the tagged release, deploy Pages, and validate the browser flash flow on physical C3 hardware. **Exit:** fresh install, reflash, cancel/reconnect, and cold reboot are documented.

### Phase 4 — Wi-Fi and JC3248 extension
Harden `/wifi/` and Improv/AP instructions. Only after C3 is stable, add a separate JC3248W535 ESP32-S3 profile using validated KRU32/ESP32 Oracle firmware. **Exit:** no cross-flashing risk and separate artifacts/manifests.

## Current status and blockers
- Pages scaffold is committed in `3fd07e6` and deployed successfully. Verified HTTP 200 for `/`, `/wifi/`, and `/manifests/dbk.json`.
- The first firmware validation run is currently compiling `factory.yaml`; release publication remains gated on its result.
- Pages is not enabled yet (API returned 404); enabling/configuring it requires repository admin/write authority.
- No public source repository for the Cloudflare `dbk-oled-studio` project was confirmed; use it as a canonical reference/link until source is provided.
- Full flashing validation requires physical hardware and a known-good factory binary.
