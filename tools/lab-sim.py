#!/usr/bin/env python3
"""Run a device's display lambda in ESPHome's native SDL simulator.

The point of this script is one line of YAML surgery: lift the `display:` lambda
out of a real device config and drop it, unchanged, into a host-platform config
that renders to an SDL window instead of an I2C panel.

Why that matters: a hand-written simulator drifts from the firmware the moment
someone edits the lambda, and the drift is invisible until a board is flashed.
Here the lambda is not reimplemented, translated, or approximated — the same
characters compile into both binaries. If the sim is wrong, the firmware is wrong
the same way.

What the host platform cannot do (measured 2026-08-26, ESPHome 2026.8.1):
  wifi   — validates, then fails to compile: wifi_component.cpp includes lwip/dns.h
  mqtt   — rejected at validation; host is not in its platform list
  uart   — compiles, but rejects rx_pin/tx_pin; needs port: /dev/…
so the template drops those and stands `wifi_component` up as a shim global. The
lambda still calls id(wifi_component).is_connected() and never knows.
"""

import argparse
import os
import re
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIM_DIR = os.path.join(REPO, "sim")
TEMPLATE = os.path.join(SIM_DIR, "dbk-sim.yaml")
LAB = os.path.expanduser(os.environ.get("LAB_DIR", "~/.haos-oracle/lab"))


def extract_lambda(path):
    """Return the display lambda's body lines from a device config.

    Deliberately naive: find the `display:` block, then the first `lambda: |-`
    inside it, then take every line more indented than the `lambda:` key. A YAML
    parser would be more correct but would also normalise the block scalar, and
    the whole promise here is that the text is passed through untouched.
    """
    lines = open(path).read().split("\n")

    start = next((i for i, l in enumerate(lines) if re.match(r"^display:\s*$", l)), None)
    if start is None:
        sys.exit(f"no top-level 'display:' block in {path}")

    lam = None
    for i in range(start + 1, len(lines)):
        if re.match(r"^[a-z_]+:", lines[i]):       # left the display block
            break
        if re.search(r"lambda:\s*\|-?\s*$", lines[i]):
            lam = i
            break
    if lam is None:
        sys.exit(f"no 'lambda:' inside the display block of {path}")

    key_indent = len(lines[lam]) - len(lines[lam].lstrip())
    body = []
    for i in range(lam + 1, len(lines)):
        l = lines[i]
        if l.strip() and (len(l) - len(l.lstrip())) <= key_indent:
            break
        body.append(l)
    while body and not body[-1].strip():
        body.pop()
    if not body:
        sys.exit(f"the display lambda in {path} is empty")
    return body


def reindent(body, to):
    """Re-indent a block scalar to the target column, preserving inner structure."""
    base = min((len(l) - len(l.lstrip()) for l in body if l.strip()), default=0)
    out = []
    for l in body:
        out.append("" if not l.strip() else " " * to + l[base:])
    return out


def graft(template_lines, body):
    """Replace the template's display lambda body with `body`."""
    start = next(i for i, l in enumerate(template_lines) if re.match(r"^display:\s*$", l))
    lam = next(i for i in range(start + 1, len(template_lines))
               if re.search(r"lambda:\s*\|-?\s*$", template_lines[i]))
    key_indent = len(template_lines[lam]) - len(template_lines[lam].lstrip())
    end = lam + 1
    while end < len(template_lines):
        l = template_lines[end]
        if l.strip() and (len(l) - len(l.lstrip())) <= key_indent:
            break
        end += 1
    return template_lines[:lam + 1] + reindent(body, key_indent + 2) + template_lines[end:]


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("device", nargs="?", default="dbk",
                    help="device name in the lab dir (default: dbk)")
    ap.add_argument("--build-only", action="store_true",
                    help="compile but do not open the SDL window")
    args = ap.parse_args()

    # Prefer a checked-in simulator/fixture; fall back to the private lab dir.
    local = os.path.join(REPO, "sim", args.device + ".yaml")
    src = local if os.path.exists(local) else os.path.join(LAB, args.device + ".yaml")
    if not os.path.exists(src):
        sys.exit(f"no such device config: {src}\n"
                 f"expected sim/{args.device}.yaml or LAB_DIR/{args.device}.yaml")

    body = extract_lambda(src)
    out_path = os.path.join(SIM_DIR, "_active-sim.yaml")
    grafted = graft(open(TEMPLATE).read().split("\n"), body)
    open(out_path, "w").write("\n".join(grafted))

    print(f"lambda: {len(body)} lines from {src}")
    print(f"sim:    {out_path}")

    # A real compile, not `esphome config`. "Configuration is valid" has shipped
    # broken firmware in this project before; only an emitted binary proves it.
    #
    # And "compiled" has to mean compiled. platformio will happily report
    # SUCCESS in a third of a second with `program is up to date`, which reads
    # exactly like a pass and proves nothing about the lambda just grafted in.
    # A build tool that lies about building is worse than no build tool, so the
    # binary's mtime is checked against the config it should have been built
    # from, and a stale artifact is reported as the failure it is.
    env = dict(os.environ, COPYFILE_DISABLE="1")
    binary = os.path.join(SIM_DIR, ".esphome", "build", "dbk", ".pioenvs", "dbk", "program")
    before = os.path.getmtime(binary) if os.path.exists(binary) else 0

    esphome_cmd = os.environ.get("ESPHOME_CMD", "esphome")
    cmd = [esphome_cmd, "run" if not args.build_only else "compile", out_path]
    print(f"$ {' '.join(cmd)}\n")
    rc = subprocess.call(cmd, cwd=SIM_DIR, env=env)
    if rc != 0:
        sys.exit(rc)

    if args.build_only:
        if not os.path.exists(binary):
            sys.exit(f"\nFAIL: esphome reported success but {binary} does not exist.")
        if os.path.getmtime(binary) <= before:
            sys.exit(f"\nFAIL: {binary} was NOT rebuilt — it predates this run.\n"
                     f"esphome reported success against a stale artifact. Delete it and retry:\n"
                     f"  rm {binary}")
        print(f"\nverified rebuilt: {binary} ({os.path.getsize(binary)} bytes)")
    sys.exit(0)


if __name__ == "__main__":
    main()
