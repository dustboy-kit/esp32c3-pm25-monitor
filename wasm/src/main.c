/* DustBoy Kit screen in the browser.
 *
 * A plain-C copy of screen/lvgl-ui.yaml (320 x 480 portrait, the JC3248W535 panel's
 * shape) on LVGL v9, drawn through LVGL's SDL2 driver and compiled to WebAssembly with
 * Emscripten. The data is fake, the same sweep as screen/lvgl-host.yaml:
 * PM2.5 goes 0..120 and back over 60 s, PM1 = 0.62x, PM10 = 1.45x, once a second.
 * Band edges are the kit's: pm25 <= 25 good, <= 50 fair, else poor.
 */
#include <math.h>
#include <stdio.h>
#include <stdint.h>

#include "lvgl.h"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#define SCREEN_W 320
#define SCREEN_H 480

#define GOOD_LIMIT 25.0f
#define FAIR_LIMIT 50.0f

#define COLOR_GOOD 0x2ECC71
#define COLOR_FAIR 0xF1C40F
#define COLOR_POOR 0xE74C3C

static lv_obj_t * kit_label;
static lv_obj_t * pm25_arc;
static lv_obj_t * pm25_value;
static lv_obj_t * band_label;
static lv_obj_t * pm1_value;
static lv_obj_t * pm10_value;
static lv_obj_t * link_label;

static lv_style_t style_card;
static lv_style_t style_small_text;

/* ---- the UI (lvgl: section of lvgl-ui.yaml) ---------------------------------- */

static lv_obj_t * make_card(lv_obj_t * parent, int32_t x, const char * title, lv_obj_t ** value_out)
{
    lv_obj_t * card = lv_obj_create(parent);
    lv_obj_add_style(card, &style_card, 0);
    lv_obj_set_pos(card, x, 360);
    lv_obj_set_size(card, 142, 76);
    lv_obj_set_scrollable(card, false);

    lv_obj_t * t = lv_label_create(card);
    lv_label_set_text(t, title);
    lv_obj_add_style(t, &style_small_text, 0);

    lv_obj_t * v = lv_label_create(card);
    lv_label_set_text(v, "--");
    lv_obj_set_style_text_color(v, lv_color_hex(0xFFFFFF), 0);
    lv_obj_set_style_text_font(v, &lv_font_montserrat_28, 0);
    lv_obj_align(v, LV_ALIGN_BOTTOM_RIGHT, 0, 0);
    *value_out = v;
    return card;
}

static void build_ui(void)
{
    /* style_definitions */
    lv_style_init(&style_card);
    lv_style_set_bg_color(&style_card, lv_color_hex(0x1B2631));
    lv_style_set_bg_opa(&style_card, LV_OPA_COVER);
    lv_style_set_radius(&style_card, 12);
    lv_style_set_border_width(&style_card, 0);
    lv_style_set_pad_all(&style_card, 8);

    lv_style_init(&style_small_text);
    lv_style_set_text_color(&style_small_text, lv_color_hex(0x95A5A6));
    lv_style_set_text_font(&style_small_text, &lv_font_montserrat_14);

    /* main_page */
    lv_obj_t * scr = lv_screen_active();
    lv_obj_set_style_bg_color(scr, lv_color_hex(0x0B1016), 0);
    lv_obj_set_style_bg_opa(scr, LV_OPA_COVER, 0);
    lv_obj_set_scrollable(scr, false);

    /* top: kit name */
    kit_label = lv_label_create(scr);
    lv_label_set_text(kit_label, "DustBoy Kit  (waiting)");
    lv_obj_set_style_text_color(kit_label, lv_color_hex(0xECF0F1), 0);
    lv_obj_set_style_text_font(kit_label, &lv_font_montserrat_20, 0);
    lv_obj_align(kit_label, LV_ALIGN_TOP_MID, 0, 12);

    /* PM2.5 arc with the number in the middle */
    pm25_arc = lv_arc_create(scr);
    lv_obj_set_size(pm25_arc, 260, 260);
    lv_obj_align(pm25_arc, LV_ALIGN_TOP_MID, 0, 48);
    lv_arc_set_range(pm25_arc, 0, 150);
    lv_arc_set_value(pm25_arc, 0);
    lv_obj_set_clickable(pm25_arc, false); /* adjustable: false */
    lv_obj_set_style_arc_width(pm25_arc, 20, LV_PART_MAIN);
    lv_obj_set_style_arc_width(pm25_arc, 20, LV_PART_INDICATOR);
    lv_obj_set_style_arc_color(pm25_arc, lv_color_hex(COLOR_GOOD), LV_PART_INDICATOR);
    lv_obj_set_style_opa(pm25_arc, LV_OPA_TRANSP, LV_PART_KNOB);

    pm25_value = lv_label_create(pm25_arc);
    lv_label_set_text(pm25_value, "--");
    lv_obj_set_style_text_color(pm25_value, lv_color_hex(0xFFFFFF), 0);
    lv_obj_set_style_text_font(pm25_value, &lv_font_montserrat_48, 0);
    lv_obj_align(pm25_value, LV_ALIGN_CENTER, 0, -10);

    lv_obj_t * unit = lv_label_create(pm25_arc);
    lv_label_set_text(unit, "PM2.5  ug/m3");
    lv_obj_add_style(unit, &style_small_text, 0);
    lv_obj_align(unit, LV_ALIGN_CENTER, 0, 36);

    /* band chip under the arc */
    band_label = lv_label_create(scr);
    lv_label_set_text(band_label, "--");
    lv_obj_set_width(band_label, 200);
    lv_obj_set_style_text_align(band_label, LV_TEXT_ALIGN_CENTER, 0);
    lv_obj_set_style_text_color(band_label, lv_color_hex(0x0B1016), 0);
    lv_obj_set_style_text_font(band_label, &lv_font_montserrat_28, 0);
    lv_obj_set_style_bg_color(band_label, lv_color_hex(0x7F8C8D), 0);
    lv_obj_set_style_bg_opa(band_label, LV_OPA_COVER, 0);
    lv_obj_set_style_radius(band_label, 10, 0);
    lv_obj_set_style_pad_top(band_label, 6, 0);
    lv_obj_set_style_pad_bottom(band_label, 6, 0);
    lv_obj_align(band_label, LV_ALIGN_TOP_MID, 0, 300);

    /* PM1 / PM10 cards side by side */
    make_card(scr, 12, "PM1", &pm1_value);
    make_card(scr, 166, "PM10", &pm10_value);

    /* bottom: link status */
    link_label = lv_label_create(scr);
    lv_label_set_text(link_label, "no link");
    lv_obj_add_style(link_label, &style_small_text, 0);
    lv_obj_align(link_label, LV_ALIGN_BOTTOM_MID, 0, -10);
}

/* ---- the template sensors' on_value actions ---------------------------------- */

/* filters: delta: 1 -- redraw only when the value really changes */
typedef struct { float last; int has; } delta_filter_t;

static int delta_pass(delta_filter_t * f, float x)
{
    if(f->has && fabsf(x - f->last) < 1.0f) return 0;
    f->last = x;
    f->has = 1;
    return 1;
}

static void set_number(lv_obj_t * label, float x)
{
    lv_label_set_text_fmt(label, "%d", (int) lroundf(x)); /* format: "%.0f" */
}

static void publish_pm25(float x)
{
    static delta_filter_t f;
    if(!delta_pass(&f, x)) return;

    uint32_t c = x <= GOOD_LIMIT ? COLOR_GOOD : (x <= FAIR_LIMIT ? COLOR_FAIR : COLOR_POOR);
    lv_arc_set_value(pm25_arc, x > 150 ? 150 : (int32_t) x);
    lv_obj_set_style_arc_color(pm25_arc, lv_color_hex(c), LV_PART_INDICATOR);
    set_number(pm25_value, x);
    lv_label_set_text(band_label, x <= GOOD_LIMIT ? "GOOD" : (x <= FAIR_LIMIT ? "FAIR" : "POOR"));
    lv_obj_set_style_bg_color(band_label, lv_color_hex(c), 0);
}

static void publish_pm1(float x)
{
    static delta_filter_t f;
    if(delta_pass(&f, x)) set_number(pm1_value, x);
}

static void publish_pm10(float x)
{
    static delta_filter_t f;
    if(delta_pass(&f, x)) set_number(pm10_value, x);
}

/* ---- fake data (interval: 1s in lvgl-host.yaml) ------------------------------ */

static void fake_data_cb(lv_timer_t * t)
{
    (void) t;
    const float phase = (lv_tick_get() % 60000UL) / 60000.0f;
    const float pm25 = 60.0f * (1.0f - cosf(phase * 6.2831853f));
    publish_pm25(pm25);
    publish_pm1(pm25 * 0.62f);
    publish_pm10(pm25 * 1.45f);

    static uint32_t n = 0;
    n++;
    if(n == 1) lv_label_set_text(kit_label, "DustBoy Kit  DBK-173e5c");
    lv_label_set_text_fmt(link_label, "ch1 - %us ago - %u frames", (unsigned) (n % 5), (unsigned) (n / 5));
}

/* ---- main loop -------------------------------------------------------------- */

static void loop_once(void)
{
    lv_timer_handler();
}

int main(void)
{
    lv_init();
    lv_display_t * disp = lv_sdl_window_create(SCREEN_W, SCREEN_H);
    lv_sdl_window_set_title(disp, "DustBoy Kit screen");
    lv_sdl_mouse_create();

    build_ui();
    lv_timer_create(fake_data_cb, 1000, NULL);

#ifdef __EMSCRIPTEN__
    /* 30 fps on setTimeout, not requestAnimationFrame: rAF stalls in headless and
     * background tabs, which would freeze the 1 s data timer. 30 fps matches
     * LV_DEF_REFR_PERIOD (33 ms). */
    emscripten_set_main_loop(loop_once, 30, 1);
#else
    while(1) loop_once();   /* native builds: a busy loop is enough for a test */
#endif
    return 0;
}
