# API Endpoints Specification

## System Endpoints

### GET /system/info

Get system information.

**Response:**
```json
{
  "model": "ESP32-C3/S3 + ESP32-H2",
  "firmware_version": "v1.2.3",
  "chip_revision": "v3.0",
  "cpu_frequency": 160,
  "flash_size": 4194304,
  "free_heap": 251904,
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "ip_address": "192.168.1.100",
  "hostname": "esp32-gateway"
}
```

---

### GET /system/status

Get real-time system status.

**Response:**
```json
{
  "uptime_seconds": 191520,
  "wifi": {
    "connected": true,
    "ssid": "Home_Network",
    "rssi": -45,
    "channel": 6
  },
  "zigbee": {
    "active": true,
    "channel": 15,
    "pan_id": "0x1A2B",
    "node_count": 12
  },
  "bluetooth": {
    "enabled": true,
    "connected_devices": 2
  },
  "mqtt": {
    "connected": true,
    "broker": "broker.iot.local",
    "port": 1883
  },
  "memory": {
    "heap_used": 74240,
    "heap_free": 251904
  }
}
```

---

### POST /system/restart

Restart the device.

**Request:** `{}`

**Response:**
```json
{
  "message": "Device restart initiated"
}
```

---

### POST /system/reset

Factory reset all settings.

**Request:** `{}`

**Response:**
```json
{
  "message": "Factory reset initiated. Device will reboot."
}
```

---

## WiFi Endpoints

### GET /wifi/status

**Response:**
```json
{
  "mode": "station",
  "connected": true,
  "ssid": "Home_Network",
  "rssi": -45,
  "bssid": "AA:BB:CC:DD:EE:FF",
  "ip": "192.168.1.100",
  "gateway": "192.168.1.1",
  "dns": "192.168.1.1"
}
```

---

### GET /wifi/config

**Response:**
```json
{
  "mode": "station_ap",
  "station": {
    "ssid": "Home_Network",
    "channel": "auto",
    "power": 15
  },
  "ap": {
    "ssid": "ESP32-GW-Setup",
    "channel": 11,
    "max_clients": 4
  }
}
```

---

### PUT /wifi/config

**Request:**
```json
{
  "mode": "station",
  "station": {
    "ssid": "MyNetwork",
    "password": "secret123",
    "channel": "auto",
    "power": 15
  }
}
```

**Response:**
```json
{
  "message": "WiFi configuration updated"
}
```

---

### POST /wifi/scan

Scan for available networks.

**Response:**
```json
{
  "networks": [
    {
      "ssid": "Home_Network",
      "rssi": -45,
      "security": "WPA2",
      "channel": 6
    },
    {
      "ssid": "Guest_WiFi",
      "rssi": -58,
      "security": "WPA2",
      "channel": 1
    }
  ]
}
```

---

## ZigBee Endpoints

### GET /zigbee/nodes

**Response:**
```json
{
  "nodes": [
    {
      "short_addr": "0x1A3F",
      "ieee_addr": "AA:BB:CC:DD:EE:FF:00:01",
      "type": "router",
      "name": "Living Room",
      "rssi": -52,
      "last_seen": 1713743900,
      "endpoints": [
        {
          "id": 1,
          "clusters": ["genOnOff", "genLevel"]
        }
      ]
    }
  ]
}
```

---

### POST /zigbee/permit-join

Enable pairing mode for new devices.

**Request:**
```json
{
  "duration": 60
}
```

**Response:**
```json
{
  "message": "Permit join enabled for 60 seconds"
}
```

---

### DELETE /zigbee/node/{short_addr}

Remove a node from the network.

**Response:**
```json
{
  "message": "Node 0x1A3F removed"
}
```

---

## MQTT Endpoints

### POST /mqtt/test

Test MQTT connection.

**Response:**
```json
{
  "success": true,
  "latency_ms": 15
}
```

---

### POST /mqtt/publish

Publish a message.

**Request:**
```json
{
  "topic": "home/bedroom/light/set",
  "payload": {"state": "ON"},
  "qos": 1,
  "retain": false
}
```

**Response:**
```json
{
  "message_id": 12345
}
```

---

## Sensor Endpoints

### GET /sensors

**Response:**
```json
{
  "sensors": [
    {
      "id": "temp_01",
      "type": "temperature",
      "node_id": "0x2B4E",
      "value": 24.5,
      "unit": "°C",
      "timestamp": 1713744000
    },
    {
      "id": "humidity_01",
      "type": "humidity",
      "node_id": "0x2B4E",
      "value": 65,
      "unit": "%",
      "timestamp": 1713744000
    }
  ]
}
```

---

### GET /sensors/history

**Query Parameters:**
- `id`: Sensor ID
- `from`: Start timestamp
- `to`: End timestamp
- `interval`: Aggregation interval (seconds)

**Response:**
```json
{
  "sensor_id": "temp_01",
  "data": [
    {"timestamp": 1713743400, "value": 24.2},
    {"timestamp": 1713743700, "value": 24.4},
    {"timestamp": 1713744000, "value": 24.5}
  ]
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing token |
| `INVALID_CONFIG` | Invalid configuration value |
| `NETWORK_ERROR` | Network communication error |
| `DEVICE_BUSY` | Device is busy, try again |
| `NODE_NOT_FOUND` | Requested node not found |
| `MQTT_DISCONNECTED` | MQTT broker not connected |
| `WIFI_DISCONNECTED` | WiFi not connected |
| `PERMISSION_DENIED` | Operation not allowed |