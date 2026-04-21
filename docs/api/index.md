# ESP32 IoT Gateway API

REST API for ESP32 IoT Gateway Configuration and Monitoring.

## Base URL

```
http://{gateway-ip}/api/v1
```

## Authentication

All endpoints (except `/auth/login`) require Bearer token authentication:

```
Authorization: Bearer <token>
```

---

## Endpoints

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/system/info` | Get system information |
| GET | `/system/status` | Get system status |
| POST | `/system/restart` | Restart device |
| POST | `/system/reset` | Factory reset |
| GET | `/system/uptime` | Get uptime |

### WiFi

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wifi/status` | Get WiFi status |
| GET | `/wifi/config` | Get WiFi configuration |
| PUT | `/wifi/config` | Update WiFi configuration |
| POST | `/wifi/scan` | Scan for networks |
| GET | `/wifi/networks` | Get scan results |

### Bluetooth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bt/status` | Get BLE status |
| GET | `/bt/config` | Get BLE configuration |
| PUT | `/bt/config` | Update BLE configuration |
| POST | `/bt/scan` | Scan for devices |
| GET | `/bt/devices` | Get discovered devices |

### ZigBee

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/zigbee/status` | Get ZigBee status |
| GET | `/zigbee/config` | Get ZigBee configuration |
| PUT | `/zigbee/config` | Update ZigBee configuration |
| GET | `/zigbee/nodes` | Get connected nodes |
| POST | `/zigbee/permit-join` | Enable permit join |
| DELETE | `/zigbee/node/{id}` | Remove node |

### MQTT

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mqtt/status` | Get MQTT status |
| GET | `/mqtt/config` | Get MQTT configuration |
| PUT | `/mqtt/config` | Update MQTT configuration |
| POST | `/mqtt/test` | Test connection |
| POST | `/mqtt/publish` | Publish message |

### Sensors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sensors` | Get all sensor data |
| GET | `/sensors/{id}` | Get specific sensor |
| GET | `/sensors/history` | Get sensor history |

### Nodes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nodes` | Get all nodes |
| GET | `/nodes/{id}` | Get specific node |
| PUT | `/nodes/{id}` | Update node config |
| DELETE | `/nodes/{id}` | Delete node |

---

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "timestamp": 1713744000
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CONFIG",
    "message": "Invalid WiFi password"
  },
  "timestamp": 1713744000
}
```

---

## Event Streaming (SSE)

Subscribe to real-time events:

```
GET /events/stream
```

Event types:
- `sensor_update`
- `node_joined`
- `node_left`
- `mqtt_message`
- `zigbee_message`
- `system_alert`

---

## Examples

### cURL

```bash
# Get system info
curl -X GET http://192.168.1.100/api/v1/system/info \
  -H "Authorization: Bearer <token>"

# Update WiFi config
curl -X PUT http://192.168.1.100/api/v1/wifi/config \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"ssid": "MyNetwork", "password": "secret"}'

# Enable permit join
curl -X POST http://192.168.1.100/api/v1/zigbee/permit-join \
  -H "Authorization: Bearer <token>" \
  -d '{"duration": 60}'
```

### JavaScript

```javascript
const API_BASE = 'http://192.168.1.100/api/v1';
const TOKEN = 'your-token';

async function api(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return res.json();
}

// Get system info
const system = await api('/system/info');

// Update WiFi
await api('/wifi/config', {
  method: 'PUT',
  body: JSON.stringify({ ssid: 'MyNetwork', password: 'secret' })
});

// Subscribe to events
const events = new EventSource(`${API_BASE}/events/stream?token=${TOKEN}`);
events.addEventListener('sensor_update', (e) => {
  console.log('Sensor update:', JSON.parse(e.data));
});
```