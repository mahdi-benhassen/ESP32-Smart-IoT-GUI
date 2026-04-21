# Communication Protocols

## Overview

The ESP32 IoT Gateway uses multiple communication protocols:
- **HTTP/REST**: GUI to Gateway communication
- **MQTT**: Gateway to Broker communication
- **ZigBee**: Wireless sensor network
- **BLE**: Bluetooth Low Energy
- **UART**: Internal C3 to H2 communication

---

## REST API Protocol

### Request Format

```
METHOD /api/v1/{endpoint} HTTP/1.1
Host: {gateway-ip}
Authorization: Bearer {token}
Content-Type: application/json

{json-body}
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "timestamp": 1713744000
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  },
  "timestamp": 1713744000
}
```

---

## MQTT Protocol

### Default Topics

| Topic | Direction | Description |
|-------|-----------|-------------|
| `{prefix}/gateway/status` | Out | Gateway status |
| `{prefix}/gateway/+/sensor/#` | Out | Sensor data |
| `{prefix}/+/set` | In | Device control |
| `{prefix}/+/availability` | Both | Device availability |

### Payload Format

```json
{
  "device": "sensor_01",
  "type": "temperature",
  "value": 24.5,
  "unit": "°C",
  "timestamp": 1713744000,
  "battery": 85
}
```

### Home Assistant Discovery

```
homeassistant/sensor/{device_id}/config
```

```json
{
  "name": "Living Room Temperature",
  "unique_id": "esp32_temp_01",
  "device_class": "temperature",
  "unit_of_measurement": "°C",
  "state_topic": "iot/gateway/sensor_01",
  "value_template": "{{ value_json.value }}",
  "device": {
    "identifiers": ["esp32_gateway"],
    "name": "ESP32 Gateway",
    "model": "ESP32-C3 + ESP32-H2"
  }
}
```

---

## ZigBee Protocol

### Device Types

| Type | Description | Examples |
|------|-------------|----------|
| Coordinator | Network controller | ESP32-H2 |
| Router | Mesh repeater | Smart plugs |
| End Device | Leaf node | Sensors, switches |

### Cluster Types

| Cluster ID | Name | Description |
|------------|------|-------------|
| 0x0000 | Basic | Device information |
| 0x0003 | Identify | Device identification |
| 0x0004 | Groups | Device groups |
| 0x0005 | Scenes | Scene recall |
| 0x0006 | OnOff | On/Off control |
| 0x0008 | LevelControl | Dimming |
| 0x000A | Time | Real time |
| 0x0019 | OTA | Firmware update |
| 0x0201 | Thermostat | HVAC control |
| 0x0400 | Illuminance | Light level |
| 0x0402 | Temperature | Temperature |
| 0x0403 | Pressure | Atmospheric pressure |
| 0x0405 | Humidity | Relative humidity |
| 0x0406 | Occupancy | Motion detection |

### Message Format

```
ZigBee Packet:
[Preamble][Length][NWK][APS][Profile][Cluster][Data][CRC]

NWK: Network layer header (8 bytes)
APS: Application support header (variable)
Profile: 0x0104 (Home Automation)
Cluster: See cluster types above
```

---

## BLE Protocol

### GATT Services

| UUID | Name | Description |
|------|------|-------------|
| 0x1800 | GAP | Generic Access |
| 0x1801 | GATT | Generic Attribute |
| 0x181A | Environmental | Temperature/Humidity |
| 0x181B | Battery | Battery service |
| 0x181C | Device Info | Device information |

### Characteristics

| UUID | Name | Properties |
|------|------|------------|
| 0x2A00 | Device Name | Read |
| 0x2A01 | Appearance | Read |
| 0x2A19 | Battery Level | Read/Notify |
| 0x2A6E | Temperature | Read/Notify |
| 0x2A6F | Humidity | Read/Notify |
| 0x2A76 | UV Index | Read/Notify |

### Advertisement Data

```
Complete Local Name: ESP32-Gateway
Manufacturer: 0x02E5 (Espressif)
Service UUIDs: 0x181A (Environmental)
```

---

## Internal UART Protocol (ESP32-C3 ↔ ESP32-H2)

### Frame Format

```
[START][CMD][LEN][DATA...][CRC]

START: 0xFE (1 byte)
CMD:   Command ID (1 byte)
LEN:   Payload length (1 byte)
DATA:  Payload (N bytes)
CRC:   CRC-8 (1 byte)
```

### Commands

| CMD | Name | Direction | Description |
|-----|------|-----------|-------------|
| 0x01 | ZB_GET_STATUS | C3→H2 | Get ZigBee status |
| 0x02 | ZB_SET_CONFIG | C3→H2 | Set configuration |
| 0x03 | ZB_PERMIT_JOIN | C3→H2 | Enable pairing |
| 0x04 | ZB_REMOVE_NODE | C3→H2 | Remove device |
| 0x05 | ZB_NODE_INFO | H2→C3 | Node information |
| 0x06 | ZB_DATA_IND | H2→C3 | Data from device |
| 0x07 | ZB_DEVICE Annc | H2→C3 | New device joined |
| 0x08 | ZB_DEVICE_LEFT | H2→C3 | Device left network |

### Example: Get Status

Request (C3 → H2):
```
FE 01 01 01 CRC
```

Response (H2 → C3):
```
FE 05 0A [status_bytes] CRC
```

---

## WebSocket Events (SSE)

### Event Types

| Event | Description | Payload |
|-------|-------------|---------|
| sensor_update | Sensor data changed | `{id, value, type, timestamp}` |
| node_joined | New node joined | `{short_addr, ieee_addr, type}` |
| node_left | Node removed | `{short_addr, reason}` |
| mqtt_message | MQTT message received | `{topic, payload}` |
| zigbee_message | ZigBee device message | `{src, cluster, payload}` |
| system_alert | System alert | `{level, message}` |

### Format

```
event: sensor_update
data: {"id":"temp_01","value":24.5,"timestamp":1713744000}
```

---

## Security

### Authentication

- Bearer token in Authorization header
- Token stored in SPIFFS
- Default token: `esp32-gateway-token`

### Encryption

- MQTT over TLS (port 8883)
- HTTPS for web interface
- ZigBee NWK key encryption

### Best Practices

1. Change default token on first use
2. Enable HTTPS in production
3. Use strong WiFi passwords
4. Keep firmware updated