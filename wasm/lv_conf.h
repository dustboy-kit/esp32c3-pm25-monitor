/* lv_conf.h for the DustBoy Kit screen in the browser (LVGL v9, Emscripten + SDL2).
 * Only the settings that differ from LVGL's defaults are here; lv_conf_internal.h
 * fills in the rest. */
#ifndef LV_CONF_H
#define LV_CONF_H

#define LV_COLOR_FORMAT_DEFAULT LV_COLOR_FORMAT_XRGB8888   /* 32-bit, replaces LV_COLOR_DEPTH 32 */

/* LVGL's own heap. 256 kB is plenty for one screen of widgets. */
#define LV_USE_STDLIB_MALLOC LV_STDLIB_BUILTIN
#define LV_MEM_SIZE (256 * 1024)

#define LV_USE_OS LV_OS_NONE
#define LV_DEF_REFR_PERIOD 33

/* Fonts the YAML UI uses: montserrat_14 / 20 / 28 / 48. */
#define LV_FONT_MONTSERRAT_14 1
#define LV_FONT_MONTSERRAT_20 1
#define LV_FONT_MONTSERRAT_28 1
#define LV_FONT_MONTSERRAT_48 1
#define LV_FONT_DEFAULT &lv_font_montserrat_14

/* Widgets used: label, arc (obj is always on). */
#define LV_USE_ARC 1
#define LV_USE_LABEL 1

/* SDL2 driver, software renderer (works in headless browsers without WebGL). */
#define LV_USE_SDL 1
#define LV_SDL_INCLUDE_PATH "SDL2/SDL.h"
#define LV_SDL_AUTO_BACKEND 0
#define LV_SDL_BACKEND LV_SDL_BACKEND_SW
#define LV_SDL_RENDER_MODE LV_DISPLAY_RENDER_MODE_DIRECT
#define LV_SDL_BUF_COUNT 1
#define LV_SDL_ACCELERATED 0
#define LV_SDL_FULLSCREEN 0
#define LV_SDL_DIRECT_EXIT 0

#define LV_USE_LOG 0
#define LV_BUILD_EXAMPLES 0
#define LV_BUILD_DEMOS 0

#endif /*LV_CONF_H*/
