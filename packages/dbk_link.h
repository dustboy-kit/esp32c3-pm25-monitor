// DBK link v1, kit side: the table of pets (screens) the kit talks to point to point.
// Protocol and amendments: Soul-Brews-Studio/esp32-oracle#32.
#pragma once
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>

namespace dbklink {

struct Pet {
  uint8_t mac[6];
  char id[8];               // last 2 MAC bytes, lower-case hex, e.g. "ad48" (the "to" field)
  uint32_t last_status_ms;  // last {"t":"pet"} broadcast heard
  uint32_t last_mac_ack_ms; // last unicast the pet's radio acknowledged (send callback ESP_OK)
  uint32_t last_ack_ms;     // last {"t":"ack"} reply
  uint32_t last_ack_seq;
  uint32_t sent, mac_acked, acked;
};

inline std::vector<Pet> &pets() {
  static std::vector<Pet> p;
  return p;
}

inline void mac_str(const uint8_t *m, char *out) {  // out: 18 bytes
  snprintf(out, 18, "%02X:%02X:%02X:%02X:%02X:%02X", m[0], m[1], m[2], m[3], m[4], m[5]);
}

// Find a pet by MAC, adding it when `add` is true. Returns nullptr if absent and not added.
inline Pet *find(const uint8_t *mac, bool add) {
  for (auto &p : pets())
    if (memcmp(p.mac, mac, 6) == 0) return &p;
  if (!add) return nullptr;
  Pet p{};
  memcpy(p.mac, mac, 6);
  snprintf(p.id, sizeof(p.id), "%02x%02x", mac[4], mac[5]);
  pets().push_back(p);
  return &pets().back();
}

// Tiny field readers for the flat JSON objects of the protocol (no nesting, no escapes).
// Position just after `"key":` and any spaces, or npos.
inline size_t value_at(const std::string &js, const char *key) {
  std::string k = std::string("\"") + key + "\"";
  size_t a = js.find(k);
  if (a == std::string::npos) return a;
  a += k.size();
  while (a < js.size() && js[a] == ' ') a++;
  if (a >= js.size() || js[a] != ':') return std::string::npos;
  a++;
  while (a < js.size() && js[a] == ' ') a++;
  return a;
}
inline std::string str_field(const std::string &js, const char *key) {
  size_t a = value_at(js, key);
  if (a == std::string::npos || a >= js.size() || js[a] != '"') return "";
  size_t b = js.find('"', a + 1);
  return b == std::string::npos ? "" : js.substr(a + 1, b - a - 1);
}
inline long num_field(const std::string &js, const char *key, long dflt = -1) {
  size_t a = value_at(js, key);
  if (a == std::string::npos) return dflt;
  return strtol(js.c_str() + a, nullptr, 10);
}

// Pets "linked" = heard (status or ack) within `window_ms`.
inline int linked(uint32_t now, uint32_t window_ms) {
  int n = 0;
  for (auto &p : pets()) {
    uint32_t last = p.last_status_ms > p.last_ack_ms ? p.last_status_ms : p.last_ack_ms;
    if (p.last_mac_ack_ms > last) last = p.last_mac_ack_ms;
    if (last != 0 && now - last < window_ms) n++;
  }
  return n;
}

}  // namespace dbklink
