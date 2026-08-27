# Native ESPHome display simulator. The same display lambda is grafted into
# sim/dbk-sim.yaml; no browser reimplementation is used for this validation.
lab-sim NAME="gallery":
    @python3 {{justfile_directory()}}/tools/lab-sim.py {{NAME}}

lab-sim-build NAME="gallery":
    @python3 {{justfile_directory()}}/tools/lab-sim.py {{NAME}} --build-only
