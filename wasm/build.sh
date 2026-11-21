#!/usr/bin/env bash
# Build the DustBoy Kit screen for the browser: LVGL v9 + SDL2 -> WebAssembly.
# Re-runnable. Output: wasm/dist/index.html, index.js, index.wasm
#   LVGL_DIR=/path/to/lvgl ./build.sh      (default below; pin a v9.x tag there)
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
LVGL_DIR="${LVGL_DIR:-/opt/tmp/dustboy-kit-oracle/lvgl-src}"
OUT="$HERE/dist"
OBJ="$HERE/build/obj"

if [ ! -f "$LVGL_DIR/lvgl.h" ]; then
  echo "LVGL not found at $LVGL_DIR" >&2
  echo "clone it: git clone --depth 1 --branch v9.6.0 https://github.com/lvgl/lvgl \"$LVGL_DIR\"" >&2
  exit 1
fi
command -v emcc >/dev/null || { echo "emcc not on PATH (install Emscripten)" >&2; exit 1; }

echo "LVGL: $LVGL_DIR ($(git -C "$LVGL_DIR" describe --tags 2>/dev/null || echo 'no git tag'))"
echo "emcc: $(emcc --version | head -1)"

CFLAGS=(-O2 -sUSE_SDL=2 -DLV_CONF_INCLUDE_SIMPLE -I"$HERE" -I"$LVGL_DIR" -I"$LVGL_DIR/..")

mkdir -p "$OUT" "$OBJ"

# Compile LVGL's C sources into objects; later runs only rebuild what changed.
objs=()
stale=()
while IFS= read -r src; do
  rel="${src#"$LVGL_DIR"/}"
  obj="$OBJ/${rel%.c}.o"
  objs+=("$obj")
  if [ ! -f "$obj" ] || [ "$src" -nt "$obj" ] || [ "$HERE/lv_conf.h" -nt "$obj" ]; then
    mkdir -p "$(dirname "$obj")"
    stale+=("$src")
  fi
done < <(find "$LVGL_DIR/src" -name '*.c' | sort)

if [ "${#stale[@]}" -gt 0 ]; then
  echo "compiling ${#stale[@]} LVGL files"
  export LVGL_DIR OBJ
  export CFLAGS_STR="${CFLAGS[*]}"
  printf '%s\n' "${stale[@]}" | xargs -P "$(sysctl -n hw.ncpu 2>/dev/null || nproc)" -I{} \
    sh -c 'src="$1"; rel="${src#"$LVGL_DIR"/}"; emcc $CFLAGS_STR -c "$src" -o "$OBJ/${rel%.c}.o"' _ {}
fi
echo "LVGL objects: ${#objs[@]}"

emcc "${CFLAGS[@]}" "$HERE/src/main.c" "${objs[@]}" \
  -sALLOW_MEMORY_GROWTH=1 \
  -sINITIAL_MEMORY=16MB \
  --shell-file "$HERE/shell.html" \
  -o "$OUT/index.html"

ls -l "$OUT"
