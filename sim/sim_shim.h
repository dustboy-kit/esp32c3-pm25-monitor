#pragma once
// Simulator stand-in for the real wifi component, which does not build on
// platform: host (wifi_component.cpp includes lwip/dns.h). Declared as an
// ESPHome global with id: wifi_component so that the display lambda's
// `id(wifi_component).is_connected()` keeps compiling BYTE-FOR-BYTE unchanged.
// ESPHome expands id(<global>) to <global>->value(), which yields WifiShim&.
struct WifiShim {
  bool connected{true};
  bool is_connected() const { return this->connected; }
};
