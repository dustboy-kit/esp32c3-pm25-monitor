#!/usr/bin/env python3
"""Generate sim/qemu/dbk-qemu.yaml: the kit firmware for Espressif QEMU (esp32c3).

Lifts the display lambda AND the font block out of packages/oled.yaml unchanged and drops
them into sim/qemu/dbk-qemu.template.yaml, like tools/lab-sim.py does for the host SDL
simulator. Same characters, so the emulated screen cannot drift from the real one.
"""
import importlib.util, os, re, sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("labsim", os.path.join(REPO, "tools", "lab-sim.py"))
labsim = importlib.util.module_from_spec(spec); spec.loader.exec_module(labsim)

OLED = os.path.join(REPO, "packages", "oled.yaml")
TPL = os.path.join(REPO, "sim", "qemu", "dbk-qemu.template.yaml")
OUT = os.path.join(REPO, "sim", "qemu", "dbk-qemu.yaml")


def top_block(lines, key):
    i = next(i for i, l in enumerate(lines) if re.match(rf"^{key}:\s*$", l))
    j = i + 1
    while j < len(lines) and (not lines[j].strip() or lines[j].startswith((" ", "#"))):
        j += 1
    return lines[i:j]


oled_lines = open(OLED).read().split("\n")
body = labsim.extract_lambda(OLED)
fonts = top_block(oled_lines, "font")
tpl = open(TPL).read().split("\n")
m = next(i for i, l in enumerate(tpl) if "@@OLED_LAMBDA@@" in l)
indent = len(tpl[m]) - len(tpl[m].lstrip())
out = tpl[:m] + labsim.reindent(body, indent) + tpl[m + 1:] + [""] + fonts
open(OUT, "w").write("\n".join(out).rstrip() + "\n")
print(f"lambda: {len(body)} lines, fonts: {len(fonts)} lines -> {OUT}")
