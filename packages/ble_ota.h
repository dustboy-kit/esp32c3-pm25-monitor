// Firmware update over BLE for the DBK Bluetooth line.
//
// The ESPHome 4 MB layout already has two app slots (app0 / app1, 0x1C0000
// each). A client streams an ESPHome .ota.bin into the idle slot through the
// GATT characteristics declared in packages/ble.yaml; this header does the
// esp_ota_* work and the SHA-256 check. The running slot is never touched
// until the whole image has arrived and its hash matches, so a lost link, a
// wrong file or a wrong chip leaves the board on its current firmware.
//
// Not covered: bootloader auto-rollback (the arduino framework ships without
// it), so an image that hashes correctly but crashes at boot needs a USB flash.

#pragma once

#include <string>
#include <vector>
#include <cstring>
#include <cstdio>
#include <cstdlib>

#include "esp_ota_ops.h"
#include "esp_partition.h"
#include "esp_system.h"
#include "mbedtls/sha256.h"

namespace dbk_ble_ota {

enum State { IDLE, RECEIVING, VERIFYING, DONE, FAILED };

struct Session {
  State state = IDLE;
  esp_ota_handle_t handle = 0;
  const esp_partition_t *target = nullptr;
  size_t expected = 0;
  size_t received = 0;
  uint8_t expected_sha[32] = {0};
  mbedtls_sha256_context sha;
  std::string error;
};

static Session g;

static bool hex_to_bytes(const std::string &hex, uint8_t *out, size_t n) {
  if (hex.size() != n * 2) return false;
  for (size_t i = 0; i < n; i++) {
    unsigned v;
    if (sscanf(hex.substr(i * 2, 2).c_str(), "%2x", &v) != 1) return false;
    out[i] = (uint8_t) v;
  }
  return true;
}

static void fail(const std::string &why) {
  if (g.state == RECEIVING) {
    esp_ota_abort(g.handle);
    mbedtls_sha256_free(&g.sha);
  }
  g.state = FAILED;
  g.error = why;
  g.handle = 0;
  g.target = nullptr;
}

// "BEGIN <size> <sha256hex> <passcode>"
static void begin(size_t size, const std::string &sha_hex) {
  if (g.state == RECEIVING) fail("restart");
  g = Session();
  if (!hex_to_bytes(sha_hex, g.expected_sha, 32)) { fail("bad sha"); return; }
  g.target = esp_ota_get_next_update_partition(nullptr);
  if (g.target == nullptr) { fail("no slot"); return; }
  if (size == 0 || size > g.target->size) { fail("bad size"); return; }
  esp_err_t err = esp_ota_begin(g.target, size, &g.handle);
  if (err != ESP_OK) { fail(std::string("begin ") + esp_err_to_name(err)); return; }
  mbedtls_sha256_init(&g.sha);
  mbedtls_sha256_starts(&g.sha, 0);
  g.expected = size;
  g.received = 0;
  g.state = RECEIVING;
}

static void write(const std::vector<uint8_t> &chunk) {
  if (g.state != RECEIVING) return;
  if (g.received + chunk.size() > g.expected) { fail("overflow"); return; }
  esp_err_t err = esp_ota_write(g.handle, chunk.data(), chunk.size());
  if (err != ESP_OK) { fail(std::string("write ") + esp_err_to_name(err)); return; }
  mbedtls_sha256_update(&g.sha, chunk.data(), chunk.size());
  g.received += chunk.size();
}

// Returns true when the board is about to reboot into the new image.
static bool end() {
  if (g.state != RECEIVING) { fail("not receiving"); return false; }
  if (g.received != g.expected) { fail("short"); return false; }
  g.state = VERIFYING;
  uint8_t sum[32];
  mbedtls_sha256_finish(&g.sha, sum);
  mbedtls_sha256_free(&g.sha);
  if (memcmp(sum, g.expected_sha, 32) != 0) {
    esp_ota_abort(g.handle);
    g.state = FAILED; g.error = "sha mismatch"; g.handle = 0;
    return false;
  }
  esp_err_t err = esp_ota_end(g.handle);
  g.handle = 0;
  if (err != ESP_OK) { g.state = FAILED; g.error = std::string("end ") + esp_err_to_name(err); return false; }
  err = esp_ota_set_boot_partition(g.target);
  if (err != ESP_OK) { g.state = FAILED; g.error = std::string("boot ") + esp_err_to_name(err); return false; }
  g.state = DONE;
  return true;
}

static void abort_session() { fail("abort"); g.error = "aborted"; }

static std::string status() {
  char buf[96];
  switch (g.state) {
    case IDLE: return "IDLE";
    case RECEIVING:
      snprintf(buf, sizeof(buf), "RX %u/%u", (unsigned) g.received, (unsigned) g.expected);
      return buf;
    case VERIFYING: return "VERIFY";
    case DONE: return "OK";
    case FAILED: return "ERR " + g.error;
  }
  return "?";
}

static std::string running_slot() {
  const esp_partition_t *p = esp_ota_get_running_partition();
  return p ? std::string(p->label) : std::string("?");
}

}  // namespace dbk_ble_ota
