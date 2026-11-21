#pragma once
// Paints into Espressif QEMU's virtual RGB panel (QEMU >= 8.1.3-20231206).
// Register block and framebuffer addresses from espressif/esp_lcd_qemu_rgb 1.0.2.
#include "esphome/components/display/display.h"
#include "esphome/core/component.h"
#include "esphome/core/log.h"
#include "esphome/core/time.h"
#include <cstring>
#include <vector>

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
  void set_mono(bool mono) { this->mono_ = mono; }

  void setup() override {
    RgbQemuDev *dev = reinterpret_cast<RgbQemuDev *>(0x21000000);
    uint32_t v = dev->version;
    dev->size = ((uint32_t) (this->w_ * this->scale_) << 16) | (uint32_t) (this->h_ * this->scale_);
    dev->bpp = 32;
    ESP_LOGI("qemu_rgb", "virtual panel v%u.%u, %dx%d (x%d)", (unsigned) (v >> 16), (unsigned) (v & 0xFFFF),
             this->w_ * this->scale_, this->h_ * this->scale_, this->scale_);
  }

  // Lambda displays (the kit OLED): clear, run the lambda, push the whole frame.
  void update() override {
    uint32_t *fb = reinterpret_cast<uint32_t *>(0x20000000);
    const int W = this->w_ * this->scale_, H = this->h_ * this->scale_;
    for (int i = 0; i < W * H; i++) fb[i] = 0xFF000000;   // black
    this->do_update_();
    this->push_(0, 0, W, H);
  }

  // LVGL hands over a block of pixels per flush: draw them, then push that rectangle.
  void draw_pixels_at(int x_start, int y_start, int w, int h, const uint8_t *ptr, display::ColorOrder order,
                      display::ColorBitness bitness, bool big_endian, int x_offset, int y_offset,
                      int x_pad) override {
    display::Display::draw_pixels_at(x_start, y_start, w, h, ptr, order, bitness, big_endian, x_offset, y_offset,
                                     x_pad);
    this->push_(x_start * this->scale_, y_start * this->scale_, (x_start + w) * this->scale_,
                (y_start + h) * this->scale_);
  }

  void draw_pixel_at(int x, int y, Color color) override {
    if (x < 0 || y < 0 || x >= this->w_ || y >= this->h_) return;
    uint32_t *fb = reinterpret_cast<uint32_t *>(0x20000000);
    uint32_t px;
    if (this->mono_) {
      px = (color.r | color.g | color.b) ? 0xFFDCEBFF : 0xFF000000;   // OLED look, like an SSD1306
    } else {
      px = 0xFF000000 | ((uint32_t) color.r << 16) | ((uint32_t) color.g << 8) | color.b;
    }
    const int W = this->w_ * this->scale_;
    for (int dy = 0; dy < this->scale_; dy++)
      for (int dx = 0; dx < this->scale_; dx++)
        fb[(y * this->scale_ + dy) * W + x * this->scale_ + dx] = px;
  }

  display::DisplayType get_display_type() override { return display::DisplayType::DISPLAY_TYPE_COLOR; }
  float get_setup_priority() const override { return setup_priority::PROCESSOR; }

 protected:
  void push_(int x0, int y0, int x1, int y1) {
    RgbQemuDev *dev = reinterpret_cast<RgbQemuDev *>(0x21000000);
    uint32_t *fb = reinterpret_cast<uint32_t *>(0x20000000);
    const int W = this->w_ * this->scale_, H = this->h_ * this->scale_;
    // QEMU takes update_content as a PACKED (x1-x0)*(y1-y0) buffer, like esp_lcd_qemu_rgb's
    // draw_bitmap. The whole frame is already packed; a sub-rectangle is copied out first.
    uint32_t content = 0x20000000;
    if (!(x0 == 0 && y0 == 0 && x1 == W && y1 == H)) {
      const int rw = x1 - x0, rh = y1 - y0;
      this->scratch_.resize((size_t) rw * rh);
      for (int y = 0; y < rh; y++)
        memcpy(&this->scratch_[(size_t) y * rw], &fb[(y0 + y) * W + x0], 4u * rw);
      content = (uint32_t) (uintptr_t) this->scratch_.data();
    }
    dev->update_from = ((uint32_t) x0 << 16) | (uint32_t) y0;
    dev->update_to = ((uint32_t) x1 << 16) | (uint32_t) y1;
    dev->update_content = content;
    dev->update_st = 1;
    while (dev->update_st & 1) {
    }
  }
  int get_width_internal() override { return this->w_; }
  int get_height_internal() override { return this->h_; }
  int w_{128}, h_{32}, scale_{1};
  bool mono_{true};
  std::vector<uint32_t> scratch_;
};

}  // namespace qemu_rgb
}  // namespace esphome
