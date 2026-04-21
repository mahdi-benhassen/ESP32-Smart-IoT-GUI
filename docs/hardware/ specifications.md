# Hardware Documentation

## Overview

The ESP32 IoT Gateway uses a dual-processor architecture:
- **ESP32-C3/S3**: Main processor for WiFi, BLE, MQTT, and network management
- **ESP32-H2**: Co-processor dedicated to ZigBee networking

## Hardware Specifications

### ESP32-C3 (Main Processor)

| Specification | Value |
|--------------|-------|
| Processor | 32-bit RISC-V @ 160 MHz |
| SRAM | 400 KB |
| Flash | 4 MB |
| WiFi | 802.11 b/g/n |
| Bluetooth | BLE 5.0 |
| GPIO | 22 |
| ADC | 6 channels (12-bit) |
| Operating Voltage | 3.0V - 3.6V |
| Operating Temp | -40°C - 85°C |

### ESP32-H2 (ZigBee Co-Processor)

| Specification | Value |
|--------------|-------|
| Processor | 32-bit RISC-V @ 96 MHz |
| SRAM | 512 KB |
| Flash | 4 MB |
| ZigBee | IEEE 802.15.4 |
| GPIO | 16 |
| Operating Voltage | 3.0V - 3.6V |
| Operating Temp | -40°C - 85°C |

## Pinout

### ESP32-C3 Pinout

```
     +-------------------+
     |                  |
     |    ESP32-C3      |
     |                  |
 1  -| EN          3V3 |- 2
 3  -| GPIO0       GND  |- 4
 5  -| GPIO1/TOUT RXD0 |- 6
 7  -| GPIO2       TXD0 |- 8
 9  -| GPIO3       GPIO4|- 10
 11 -| GND        GPIO5 |- 12
 13 -| GPIO6       GPIO7|- 14
 15 -| GPIO8       GPIO9|- 16
 17 -| GND        GND   |- 18
 19 -| GPIO10     GPIO18|- 20
 21 -| GND        GND   |- 22
 23 -| EN         GPIO21|- 24
     |                  |
     +-------------------+

Key GPIOs:
- GPIO0: Boot button (active low)
- GPIO9: Status LED
- GPIO21: ESP-H2 UART RX
- GPIO18: ESP-H2 UART TX
```

### ESP32-H2 Pinout

```
     +-------------------+
     |                  |
     |    ESP32-H2      |
     |                  |
 1  -| EN          3V3 |- 2
 3  -| GPIO0       GND  |- 4
 5  -| GPIO1       RXD0 |- 6
 7  -| GPIO2       TXD0 |- 8
 9  -| GPIO3       GPIO4|- 10
 11 -| GND        GPIO5 |- 12
 13 -| GPIO6       GPIO7|- 14
 15 -| GPIO8       GPIO9|- 16
 17 -| GND        GND   |- 18
 19 -| GPIO10     GPIO18|- 20
     |                  |
     +-------------------+

Key GPIOs:
- GPIO1: Boot button (active low)
- GPIO9: Status LED
- GPIO10: Antenna RF pin
```

## Communication

### ESP32-C3 <-> ESP32-H2 UART

| Signal | ESP32-C3 | ESP32-H2 |
|--------|----------|----------|
| UART RX | GPIO21 | GPIO2 |
| UART TX | GPIO18 | GPIO1 |
| Baud Rate | 115200 | 115200 |
| Format | 8N1 | 8N1 |

### Protocol (UART)

Command format: `[CMD][LEN][DATA][CRC]`

```
CMD:  1 byte command ID
LEN:  1 byte payload length
DATA: N bytes payload
CRC:  1 byte CRC-8
```

Commands:
- `0x01`: Get status
- `0x02`: Set config
- `0x03`: Permit join
- `0x04`: Remove node
- `0x05`: Node info response
- `0x06`: Data received

## Power Consumption

| Mode | Current | Power |
|------|---------|-------|
| WiFi Idle | 15 mA | 55 mW |
| WiFi Active | 120 mA | 440 mW |
| BLE Idle | 10 mA | 37 mW |
| BLE TX | 80 mA | 290 mW |
| ZigBee Idle | 8 mA | 29 mW |
| ZigBee TX | 45 mA | 165 mW |
| Deep Sleep | 10 µA | 36 µW |

## Power Supply

Recommended: 5V DC @ 500mA

| Component | Voltage | Current |
|----------|---------|--------|
| ESP32-C3 | 3.3V | 300mA peak |
| ESP32-H2 | 3.3V | 100mA peak |
| Status LED | 3.3V | 20mA |
| Total | 3.3V | 500mA |

## Dimensions

```
ESP32-C3: 21mm x 18mm
ESP32-H2: 18mm x 18mm
Antenna:   External whip (2.4GHz)
```

## Memory Map

### ESP32-C3 Flash

| Address | Size | Usage |
|---------|------|-------|
| 0x00000 | 64 KB | Bootloader |
| 0x10000 | 320 KB | Firmware |
| 0x50000 | 64 KB | OTA Partition |
| 0x60000 | 64 KB | OTA Partition 2 |
| 0x70000 | 256 KB | SPIFFS (config) |
| 0xB0000 | 3 MB | Reserved |

### ESP32-H2 Flash

| Address | Size | Usage |
|---------|------|-------|
| 0x00000 | 64 KB | Bootloader |
| 0x10000 | 256 KB | Firmware |
| 0x50000 | 256 KB | NVRAM |
| 0x90000 | 3.5 MB | Reserved |