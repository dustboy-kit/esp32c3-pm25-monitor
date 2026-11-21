#pragma once
// Paints into Espressif QEMU's virtual RGB panel (QEMU >= 8.1.3-20231206).
// Register block and framebuffer addresses from espressif/esp_lcd_qemu_rgb 1.0.2.
#include "esphome/components/display/display.h"
#include "esphome/core/component.h"
#include "esphome/core/log.h"
#include "esphome/core/time.h"

// QEMU has no Wi-Fi radio and no SNTP. The OLED lambda calls id(wifi_component).is_connected()
// and id(network_time).now(); these stand in, as sim/sim_shim.h does for the host simulator.
struct WifiShim {
  bool connected{false};
  bool is_connected() const { return this->connected; }
};
struct TimeShim {
  esphome::ESPTime now() const { return esphome::ESPTime{}; }   // invalid: the lambda shows --:--
};

namespace esphome {
namespace qemu_rgb {

struct RgbQemuDev {
  volatile uint32_t version;
  volatile uint32_t size;          // width << 16 | height
  volatile uint32_t update_from;   // x << 16 | y
  volatile uint32_t update_to;     // x << 16 | y
  volatile uint32_t update_content;
  volatile uint32_t update_st;     // bit 0: ena
  volatile uint32_t bpp;
};

class QemuRGBDisplay : public display::Display {
 public:
  void set_size(int w, int h, int scale) { this->w_ = w; this->h_ = h; this->scale_ = scale; }

  void setup() override {
    RgbQemuDev *dev = reinterpret_cast<RgbQemuDev *>(0x21000000);
    uint32_t v = dev->version;
    dev->size = ((uint32_t) (this->w_ * this->scale_) << 16) | (uint32_t) (this->h_ * this->scale_);
    dev->bpp = 32;
    ESP_LOGI("qemu_rgb", "virtual panel v%u.%u, %dx%d (x%d)", (unsigned) (v >> 16), (unsigned) (v & 0xFFFF),
             this->w_ * this->scale_, this->h_ * this->scale_, this->scale_);
  }

  void update() override {
    uint32_t *fb = reinterpret_cast<uint32_t *>(0x20000000);
    const int W = this->w_ * this->scale_, H = this->h_ * this->scale_;
    for (int i = 0; i < W * H; i++) fb[i] = 0xFF000000;   // black
    this->do_update_();
    RgbQemuDev *dev = reinterpret_cast<RgbQemuDev *>(0x21000000);
    dev->update_from = 0;
    dev->update_to = ((uint32_t) W << 16) | (uint32_t) H;
    dev->update_content = 0x20000000;
    dev->update_st = 1;
    while (dev->update_st & 1) {
    }
  }

  void draw_pixel_at(int x, int y, Color color) override {
    if (x < 0 || y < 0 || x >= this->w_ || y >= this->h_) return;
    uint32_t *fb = reinterpret_cast<uint32_t *>(0x20000000);
    // OLED look: any lit pixel is pale blue-white, like an SSD1306.
    uint32_t px = (color.r | color.g | color.b) ? 0xFFDCEBFF : 0xFF000000;
    const int W = this->w_ * this->scale_;
    for (int dy = 0; dy < this->scale_; dy++)
      for (int dx = 0; dx < this->scale_; dx++)
        fb[(y * this->scale_ + dy) * W + x * this->scale_ + dx] = px;
  }

  display::DisplayType get_display_type() override { return display::DisplayType::DISPLAY_TYPE_COLOR; }
  float get_setup_priority() const override { return setup_priority::PROCESSOR; }

 protected:
  int get_width_internal() override { return this->w_; }
  int get_height_internal() override { return this->h_; }
  int w_{128}, h_{32}, scale_{1};
};

}  // namespace qemu_rgb
}  // namespace esphome
