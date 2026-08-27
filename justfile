# Native ESPHome display simulator. The same display lambda is grafted into
# sim/dbk-sim.yaml; no browser reimplementation is used for this validation.
lab-sim NAME="gallery":
    @python3 {{justfile_directory()}}/tools/lab-sim.py {{NAME}}

lab-sim-build NAME="gallery":
    @python3 {{justfile_directory()}}/tools/lab-sim.py {{NAME}} --build-only

# Generate, locally compile, and verify all 33 browser Canvas examples.
canvas-generate:
    @python3 {{justfile_directory()}}/tools/canvas-firmware.py --generate-only

canvas-build:
    @python3 {{justfile_directory()}}/tools/canvas-firmware.py

canvas-verify:
    @python3 {{justfile_directory()}}/tools/canvas-firmware.py --verify
