"""qemu_rgb: an ESPHome display that paints into Espressif QEMU's virtual RGB panel.

Only for the QEMU board simulator (sim/qemu/). On real hardware the addresses below are
not a display. Registers and framebuffer as in espressif/esp_lcd_qemu_rgb 1.0.2.
"""
import esphome.codegen as cg
from esphome.components import display
import esphome.config_validation as cv
from esphome.const import CONF_ID, CONF_LAMBDA, CONF_WIDTH, CONF_HEIGHT

CONF_SCALE = "scale"
CONF_MONO = "mono"

qemu_rgb_ns = cg.esphome_ns.namespace("qemu_rgb")
QemuRGBDisplay = qemu_rgb_ns.class_("QemuRGBDisplay", display.Display)

CONFIG_SCHEMA = display.FULL_DISPLAY_SCHEMA.extend(
    {
        cv.GenerateID(): cv.declare_id(QemuRGBDisplay),
        cv.Required(CONF_WIDTH): cv.int_range(min=1, max=1024),
        cv.Required(CONF_HEIGHT): cv.int_range(min=1, max=1024),
        cv.Optional(CONF_SCALE, default=1): cv.int_range(min=1, max=8),
        cv.Optional(CONF_MONO, default=True): cv.boolean,   # OLED look; false = full colour (LVGL)
    }
).extend(cv.polling_component_schema("1s"))


async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await display.register_display(var, config)
    cg.add(var.set_size(config[CONF_WIDTH], config[CONF_HEIGHT], config[CONF_SCALE]))
    cg.add(var.set_mono(config[CONF_MONO]))
    if CONF_LAMBDA in config:
        lambda_ = await cg.process_lambda(
            config[CONF_LAMBDA], [(display.DisplayRef, "it")], return_type=cg.void
        )
        cg.add(var.set_writer(lambda_))
