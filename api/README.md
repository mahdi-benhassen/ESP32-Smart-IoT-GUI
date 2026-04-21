# ESP32 IoT Gateway - API Integration Guide

## Overview

The GUI connects to the ESP32 Gateway via REST API and Server-Sent Events (SSE).

## Configuration

### Setting Gateway URL

```javascript
// In browser console or script.js
api.baseUrl = 'http://192.168.1.100';
```

### Authentication Token

```javascript
api.setToken('your-auth-token');
```

## Usage

### 1. Initialize API

```javascript
// Basic setup
const api = new GatewayAPI('http://192.168.1.100', 'token');
```

### 2. Get Data

```javascript
// Get system status
const status = await api.getSystemStatus();
console.log(status.wifi.connected);

// Get ZigBee nodes
const nodes = await api.getZigbeeNodes();
nodes.forEach(n => console.log(n.name, n.short_addr));
```

### 3. Update Settings

```javascript
// Update WiFi config
await api.updateWifiConfig({
    ssid: 'MyNetwork',
    password: 'secret123'
});

// Enable MQTT with TLS
await api.updateMqttConfig({
    broker: 'mqtt.example.com',
    port: 8883,
    ssl: true,
    username: 'user',
    password: 'pass'
});
```

### 4. Real-time Events

```javascript
// Connect to event stream
api.connectEvents();

// Listen for sensor updates
api.on('sensor_update', (data) => {
    console.log('Sensor', data.id, '=', data.value);
    updateDashboard(data);
});

// New device joined
api.on('node_joined', (data) => {
    showToast(`New device: ${data.short_addr}`);
    refreshDeviceList();
});

// Alerts
api.on('system_alert', (data) => {
    showToast(data.message, 'warning');
});
```

## API Methods

### System
| Method | Description |
|--------|-------------|
| `api.getSystemInfo()` | Device info |
| `api.getSystemStatus()` | Real-time status |
| `api.restartDevice()` | Reboot |
| `api.factoryReset()` | Reset to defaults |

### WiFi
| Method | Description |
|--------|-------------|
| `api.getWifiConfig()` | Get WiFi settings |
| `api.updateWifiConfig(config)` | Update WiFi |
| `api.scanWifi()` | Scan networks |
| `api.getWifiNetworks()` | Get scan results |

### Bluetooth
| Method | Description |
|--------|-------------|
| `api.getBluetoothConfig()` | Get BLE settings |
| `api.updateBluetoothConfig(config)` | Update BLE |
| `api.scanBLE()` | Scan devices |
| `api.getBleDevices()` | Get devices |

### ZigBee
| Method | Description |
|--------|-------------|
| `api.getZigbeeConfig()` | Get ZigBee settings |
| `api.updateZigbeeConfig(config)` | Update ZigBee |
| `api.getZigbeeNodes()` | Get devices |
| `api.permitJoin(60)` | Enable pairing |
| `api.removeZigbeeNode(addr)` | Remove device |

### MQTT
| Method | Description |
|--------|-------------|
| `api.getMqttConfig()` | Get MQTT settings |
| `api.updateMqttConfig(config)` | Update MQTT |
| `api.testMqtt()` | Test connection |
| `api.publishMqtt(topic, payload)` | Publish message |

### Sensors
| Method | Description |
|--------|-------------|
| `api.getSensors()` | Get all sensors |
| `api.getSensor(id)` | Get specific |
| `api.getSensorHistory(id, from, to)` | History |

## Event Types

| Event | Payload |
|-------|---------|
| `sensor_update` | `{id, value, type, timestamp}` |
| `node_joined` | `{short_addr, ieee_addr, type}` |
| `node_left` | `{short_addr, reason}` |
| `mqtt_message` | `{topic, payload}` |
| `zigbee_message` | `{src, cluster, payload}` |
| `system_alert` | `{level, message}` |

## Offline Mode

If the gateway is unreachable, the GUI falls back to demo mode with sample data.

```javascript
// Force offline mode
api.baseUrl = 'offline';
```

## Example: Full Dashboard

```javascript
class Dashboard {
    constructor(api) {
        this.api = api;
        this.init();
    }
    
    async init() {
        await this.refresh();
        
        // Real-time updates
        this.api.on('sensor_update', (d) => this.updateSensor(d));
        this.api.on('node_joined', (d) => this.addNode(d));
        this.api.on('node_left', (d) => this.removeNode(d));
        
        this.api.connectEvents();
        
        // Refresh every 30s
        setInterval(() => this.refresh(), 30000);
    }
    
    async refresh() {
        const status = await this.api.getSystemStatus();
        this.updateUI(status);
    }
    
    updateUI(status) {
        document.getElementById('wifi').textContent = status.wifi.connected;
        document.getElementById('zigbee').textContent = status.zigbee.node_count;
        document.getElementById('mqtt').textContent = status.mqtt.connected;
        document.getElementById('uptime').textContent = formatUptime(status.uptime_seconds);
    }
    
    updateSensor(data) {
        const el = document.querySelector(`[data-sensor="${data.id}"]`);
        if (el) el.textContent = data.value;
    }
}

const dashboard = new Dashboard(api);
```

## Error Handling

```javascript
try {
    const status = await api.getSystemStatus();
} catch (error) {
    if (error.message.includes('NETWORK')) {
        showToast('Gateway unreachable', 'error');
    } else if (error.message.includes('UNAUTHORIZED')) {
        showToast('Invalid token', 'error');
    }
}
```

## Storage

Token persists in localStorage:

```javascript
localStorage.getItem('gateway_token');  // Get token
localStorage.removeItem('gateway_token');  // Clear
```