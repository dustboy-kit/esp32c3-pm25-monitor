#!/usr/bin/env python3
"""Generate and locally compile one standalone ESPHome image per Canvas example.

The three basic lambdas come from the simulator HTML. The 30 original C++
lambdas come from sim/gallery.yaml, but each generated YAML contains only its
own direct display lambda plus the complete hardware configuration. No package
include or gallery screen-selection switch is needed to compile one example.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time


ROOT = Path(__file__).resolve().parents[1]
SIMULATOR = ROOT / "site/tools/esphome-canvas-simulator.html"
GALLERY_JS = ROOT / "site/tools/oled-gallery-screens.js"
GALLERY_CONFIG = ROOT / "sim/gallery.yaml"
YAML_DIR = ROOT / "sim/canvas"
FIRMWARE_DIR = ROOT / "site/firmware/canvas"
MANIFEST_DIR = ROOT / "site/manifests/canvas"
CATALOG_PATH = YAML_DIR / "catalog.json"
ARTIFACT_CATALOG_PATH = FIRMWARE_DIR / "catalog.json"
ACTIVE_CONFIG = YAML_DIR / "_active.yaml"
DEVICE_NAME = "dbk-canvas"
BASIC_IDS = ("readings", "animation", "geometry")
BASIC_NAMES = {
    "readings": "DBK Readings",
    "animation": "Animated Sweep",
    "geometry": "Geometry Test",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def gallery_examples() -> list[dict[str, object]]:
    source = GALLERY_JS.read_text()
    matches = re.findall(
        r"\{\s*id:\s*\"([^\"]+)\",\s*name:\s*\"([^\"]+)\"",
        source,
    )
    if len(matches) != 30:
        raise SystemExit(f"expected 30 gallery screens, found {len(matches)}")
    return [
        {"id": screen_id, "name": name, "kind": "gallery", "screen_index": index}
        for index, (screen_id, name) in enumerate(matches)
    ]


def browser_basic_yaml() -> dict[str, str]:
    source = SIMULATOR.read_text()
    start = source.index("  var EXAMPLES = {")
    end = source.index("\n  };", start)
    block = source[start:end]
    found: dict[str, str] = {}
    for example_id in BASIC_IDS:
        match = re.search(rf"\n\s*{re.escape(example_id)}:\s*`(.*?)`\s*(?:,|\Z)", block, re.S)
        if not match:
            raise SystemExit(f"could not extract browser YAML for {example_id}")
        found[example_id] = match.group(1)
    return found


def extract_lambda(yaml_text: str) -> tuple[list[str], str | None]:
    lines = yaml_text.splitlines()
    lambda_line = next(i for i, line in enumerate(lines) if re.search(r"lambda:\s*\|-?", line))
    key_indent = len(lines[lambda_line]) - len(lines[lambda_line].lstrip())
    body: list[str] = []
    for line in lines[lambda_line + 1 :]:
        indent = len(line) - len(line.lstrip())
        if line.strip() and indent <= key_indent:
            break
        body.append(line)
    base = min(len(line) - len(line.lstrip()) for line in body if line.strip())
    body = [line[base:] if line.strip() else "" for line in body]
    interval_match = re.search(r"^\s*update_interval:\s*([^\s#]+)", yaml_text, re.M)
    return body, interval_match.group(1) if interval_match else None


def gallery_lambdas() -> dict[int, list[str]]:
    source = GALLERY_CONFIG.read_text()
    found: dict[int, list[str]] = {}
    for index in range(30):
        match = re.search(
            rf"^    // -- {index} .*?\n    case {index}: \{{\n(.*?)^    \}} break;",
            source,
            re.M | re.S,
        )
        if not match:
            raise SystemExit(f"could not extract gallery C++ lambda {index}")
        lines = match.group(1).splitlines()
        found[index] = [line[6:] if line.startswith("      ") else line for line in lines]
    return found


def standalone_hardware() -> str:
    """Return the complete common config without gallery screen selection."""
    source = GALLERY_CONFIG.read_text()
    start = source.index("esphome:")
    end = source.index("\ndisplay:", start)
    config = source[start:end]
    config = config.replace("${device_name}", DEVICE_NAME)
    config = config.replace("${friendly_name}", "DBK Canvas")
    config = re.sub(
        r"(globals:\n)(?:#.*\n)*- id: screen_idx\n(?:  .*\n)+",
        r"\1",
        config,
        count=1,
    )
    config = re.sub(
        r"interval:\n# The gallery itself:.*?(?=# GALLERY ONLY)",
        "interval:\n",
        config,
        count=1,
        flags=re.S,
    )
    if "screen_idx" in config or "selected_screen" in config or "initial_screen" in config:
        raise SystemExit("standalone hardware still contains gallery screen selection")
    return config.rstrip()


def all_examples() -> list[dict[str, object]]:
    basics = [
        {"id": example_id, "name": BASIC_NAMES[example_id], "kind": "basic", "screen_index": None}
        for example_id in BASIC_IDS
    ]
    return basics + gallery_examples()


def standalone_yaml(
    example: dict[str, object], basics: dict[str, str], gallery: dict[int, list[str]]
) -> str:
    example_id = str(example["id"])
    name = str(example["name"])
    index = example["screen_index"]
    if example["kind"] == "basic":
        body, interval = extract_lambda(basics[example_id])
    else:
        body = gallery[int(index)]
        interval = "50ms"
    interval = interval or "50ms"
    lines = [
        "# Generated by tools/canvas-firmware.py; edit the Canvas source, not this file.",
        f"# Standalone Canvas example: {name} ({example_id})",
        f"# Compile directly: esphome compile sim/canvas/{example_id}.yaml",
        "# Rename: edit esphome.name; set name_add_mac_suffix false for an exact name.",
        "",
        standalone_hardware(),
        "",
        "# Adopt the complete editable file in ESPHome Device Builder. To rename",
        "# the node, follow ESPHome's two-step name/use_address migration.",
        "dashboard_import:",
        f"  package_import_url: github://dustboy-kit/esp32c3-pm25-monitor/sim/canvas/{example_id}.yaml@main",
        "  import_full_config: true",
        "",
        "display:",
        "- platform: ssd1306_i2c",
        "  id: oled",
        "  i2c_id: oled_bus",
        "  model: SSD1306_128X32",
        "  address: 0x3C",
        f"  update_interval: {interval}",
        "  flip_x: true",
        "  flip_y: true",
        "  lambda: |-",
        *[f"    {line}" if line else "" for line in body],
    ]
    result = "\n".join(lines) + "\n"
    if "packages:" in result or "!include" in result or "switch (id(screen_idx))" in result:
        raise SystemExit(f"generated YAML is not standalone: {example_id}")
    return result


def generate() -> list[dict[str, object]]:
    examples = all_examples()
    basics = browser_basic_yaml()
    gallery = gallery_lambdas()
    YAML_DIR.mkdir(parents=True, exist_ok=True)
    (YAML_DIR / ".gitignore").write_text("/.esphome/\n/_active.yaml\n")
    for example in examples:
        (YAML_DIR / f"{example['id']}.yaml").write_text(
            standalone_yaml(example, basics, gallery)
        )
    catalog = {
        "schema_version": 1,
        "device": "ESP32-C3 + SSD1306 128x32",
        "source": "site/tools/esphome-canvas-simulator.html",
        "examples": examples,
    }
    CATALOG_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    return examples


def manifest(example: dict[str, object], compiler_version: str) -> dict[str, object]:
    example_id = str(example["id"])
    return {
        "name": f"DustBoy Canvas - {example['name']}",
        "version": f"{compiler_version}-local-canvas",
        "new_install_prompt_erase": False,
        "builds": [
            {
                "chipFamily": "ESP32-C3",
                "parts": [
                    {"path": f"../../firmware/canvas/{example_id}.factory.bin", "offset": 0}
                ],
            }
        ],
    }


def compiler_version(command: str) -> str:
    result = subprocess.run([command, "version"], check=True, text=True, capture_output=True)
    match = re.search(r"Version:\s*([^\s]+)", result.stdout + result.stderr)
    return match.group(1) if match else "unknown"


def locate_factory_binary() -> Path:
    build_root = YAML_DIR / ".esphome/build" / DEVICE_NAME
    candidates = list(build_root.glob(f".pioenvs/{DEVICE_NAME}/firmware.factory.bin"))
    if len(candidates) != 1:
        raise SystemExit(f"expected one factory binary below {build_root}, found {candidates}")
    return candidates[0]


def build(
    examples: list[dict[str, object]], command: str, only: set[str], verbose: bool
) -> None:
    selected = [example for example in examples if not only or str(example["id"]) in only]
    unknown = only - {str(example["id"]) for example in examples}
    if unknown:
        raise SystemExit(f"unknown example ids: {', '.join(sorted(unknown))}")
    version = compiler_version(command)
    print(f"ESPHome {version}; compiling {len(selected)} Canvas firmware images")
    FIRMWARE_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_DIR.mkdir(parents=True, exist_ok=True)
    seen_hashes: dict[str, str] = {}
    records: list[dict[str, object]] = []
    env = dict(os.environ, COPYFILE_DISABLE="1")
    log_dir = YAML_DIR / ".esphome/logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    try:
        for number, example in enumerate(selected, 1):
            example_id = str(example["id"])
            config = YAML_DIR / f"{example_id}.yaml"
            # Compile every variant through one stable path. ESPHome can then keep
            # the shared PlatformIO build cache instead of treating each checked-in
            # wrapper filename as a separate device configuration.
            ACTIVE_CONFIG.write_text(config.read_text())
            started = time.time()
            print(f"\n[{number}/{len(selected)}] {example_id}: {example['name']}")
            build_command = [command, "compile", str(ACTIVE_CONFIG)]
            if verbose:
                subprocess.run(build_command, cwd=ROOT, env=env, check=True)
            else:
                log_path = log_dir / f"{example_id}.log"
                with log_path.open("w") as log:
                    result = subprocess.run(
                        build_command,
                        cwd=ROOT,
                        env=env,
                        text=True,
                        stdout=log,
                        stderr=subprocess.STDOUT,
                    )
                if result.returncode:
                    tail = "\n".join(log_path.read_text(errors="replace").splitlines()[-80:])
                    raise SystemExit(f"compile failed for {example_id}:\n{tail}")
            source = locate_factory_binary()
            target = FIRMWARE_DIR / f"{example_id}.factory.bin"
            if source.stat().st_mtime + 1 < started:
                if not target.exists() or sha256(target) != sha256(source):
                    raise SystemExit(f"stale build artifact after compiling {example_id}: {source}")
                print(f"reused freshly archived local build for unchanged {example_id}")
            shutil.copy2(source, target)
            digest = sha256(target)
            if digest in seen_hashes:
                raise SystemExit(f"{example_id} duplicated firmware for {seen_hashes[digest]} ({digest})")
            seen_hashes[digest] = example_id
            manifest_path = MANIFEST_DIR / f"{example_id}.json"
            manifest_path.write_text(
                json.dumps(manifest(example, version), ensure_ascii=False, indent=2) + "\n"
            )
            record = {
                **example,
                "yaml": f"sim/canvas/{example_id}.yaml",
                "manifest": f"site/manifests/canvas/{example_id}.json",
                "firmware": f"site/firmware/canvas/{example_id}.factory.bin",
                "bytes": target.stat().st_size,
                "sha256": digest,
            }
            records.append(record)
            print(f"archived {target.relative_to(ROOT)} ({record['bytes']} bytes, {digest})")
    finally:
        ACTIVE_CONFIG.unlink(missing_ok=True)

    if only:
        return
    ARTIFACT_CATALOG_PATH.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "compiler": f"ESPHome {version}",
                "count": len(records),
                "examples": records,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )


def verify(examples: list[dict[str, object]]) -> None:
    expected_ids = {str(example["id"]) for example in examples}
    catalog = json.loads(ARTIFACT_CATALOG_PATH.read_text())
    records = catalog["examples"]
    actual_ids = {record["id"] for record in records}
    if actual_ids != expected_ids or catalog["count"] != len(examples):
        raise SystemExit("artifact catalog does not cover every Canvas example")
    for record in records:
        firmware = ROOT / record["firmware"]
        config = ROOT / record["yaml"]
        manifest_path = ROOT / record["manifest"]
        if not firmware.exists() or not config.exists() or not manifest_path.exists():
            raise SystemExit(f"missing artifact for {record['id']}")
        if firmware.stat().st_size != record["bytes"] or sha256(firmware) != record["sha256"]:
            raise SystemExit(f"firmware integrity mismatch for {record['id']}")
        if firmware.read_bytes()[:1] != b"\xe9":
            raise SystemExit(f"invalid ESP image magic for {record['id']}")
        yaml_source = config.read_text()
        required = (
            "name_add_mac_suffix: true",
            "\napi:\n",
            "\nota:\n",
            "\nimprov_serial:",
            "  output_power: 8.5dBm",
            "    web_server_idf: WARN",
            "  power_save_mode: none",
            "  fast_connect: true",
            "  min_auth_mode: WPA",
            "dashboard/?host={{device_name}}.local",
            "\nesp32_improv:\n",
            "\ncaptive_portal:\n",
            "\nweb_server:\n",
            "  local: true",
            "  enable_private_network_access: true",
            "  name: Device Alias",
            'return "DBK " + suffix;',
            "- platform: wifi_signal",
            "- platform: uptime",
            "\ndashboard_import:\n",
            f"sim/canvas/{record['id']}.yaml@main",
        )
        if any(marker not in yaml_source for marker in required):
            raise SystemExit(f"provisioning/telemetry config mismatch for {record['id']}")
        if "packages:" in yaml_source or "!include" in yaml_source or "screen_idx" in yaml_source:
            raise SystemExit(f"non-standalone YAML for {record['id']}")
        part = json.loads(manifest_path.read_text())["builds"][0]["parts"][0]
        if part["offset"] != 0 or part["path"] != f"../../firmware/canvas/{record['id']}.factory.bin":
            raise SystemExit(f"manifest mismatch for {record['id']}")
    print(f"verified {len(records)} YAML + manifest + factory-binary sets")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--generate-only", action="store_true")
    parser.add_argument("--verify", action="store_true")
    parser.add_argument("--only", action="append", default=[], metavar="ID")
    parser.add_argument("--esphome", default=os.environ.get("ESPHOME_CMD", "esphome"))
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    examples = generate()
    if args.verify:
        verify(examples)
    elif not args.generate_only:
        build(examples, args.esphome, set(args.only), args.verbose)


if __name__ == "__main__":
    main()
