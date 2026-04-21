/**
 * ESP32 IoT Gateway API Client
 * Handles communication between GUI and ESP32 Gateway
 */

class GatewayAPI {
    constructor(baseUrl = '', token = '') {
        this.baseUrl = baseUrl || window.location.origin;
        this.token = token || localStorage.getItem('gateway_token') || '';
        this.ws = null;
        this.eventHandlers = new Map();
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('gateway_token', token);
    }

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/api/v1${endpoint}`;
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new APIError(data.error?.code || 'REQUEST_FAILED', data.error?.message || 'Request failed');
            }

            return data;
        } catch (error) {
            if (error instanceof APIError) throw error;
            throw new APIError('NETWORK_ERROR', error.message);
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ==================== SYSTEM ====================

    async getSystemInfo() {
        return this.get('/system/info');
    }

    async getSystemStatus() {
        return this.get('/system/status');
    }

    async restartDevice() {
        return this.post('/system/restart');
    }

    async factoryReset() {
        return this.post('/system/reset');
    }

    // ==================== WIFI ====================

    async getWifiStatus() {
        return this.get('/wifi/status');
    }

    async getWifiConfig() {
        return this.get('/wifi/config');
    }

    async updateWifiConfig(config) {
        return this.put('/wifi/config', config);
    }

    async scanWifi() {
        return this.post('/wifi/scan');
    }

    async getWifiNetworks() {
        return this.get('/wifi/networks');
    }

    // ==================== BLUETOOTH ====================

    async getBluetoothStatus() {
        return this.get('/bt/status');
    }

    async getBluetoothConfig() {
        return this.get('/bt/config');
    }

    async updateBluetoothConfig(config) {
        return this.put('/bt/config', config);
    }

    async scanBLE() {
        return this.post('/bt/scan');
    }

    async getBleDevices() {
        return this.get('/bt/devices');
    }

    // ==================== ZIGBEE ====================

    async getZigbeeStatus() {
        return this.get('/zigbee/status');
    }

    async getZigbeeConfig() {
        return this.get('/zigbee/config');
    }

    async updateZigbeeConfig(config) {
        return this.put('/zigbee/config', config);
    }

    async getZigbeeNodes() {
        return this.get('/zigbee/nodes');
    }

    async permitJoin(duration = 60) {
        return this.post('/zigbee/permit-join', { duration });
    }

    async removeZigbeeNode(shortAddr) {
        return this.delete(`/zigbee/node/${shortAddr}`);
    }

    // ==================== MQTT ====================

    async getMqttStatus() {
        return this.get('/mqtt/status');
    }

    async getMqttConfig() {
        return this.get('/mqtt/config');
    }

    async updateMqttConfig(config) {
        return this.put('/mqtt/config', config);
    }

    async testMqtt() {
        return this.post('/mqtt/test');
    }

    async publishMqtt(topic, payload, qos = 1) {
        return this.post('/mqtt/publish', { topic, payload, qos });
    }

    // ==================== SENSORS ====================

    async getSensors() {
        return this.get('/sensors');
    }

    async getSensor(id) {
        return this.get(`/sensors/${id}`);
    }

    async getSensorHistory(id, from, to, interval = 60) {
        return this.get(`/sensors/history?id=${id}&from=${from}&to=${to}&interval=${interval}`);
    }

    // ==================== NODES ====================

    async getNodes() {
        return this.get('/nodes');
    }

    async getNode(id) {
        return this.get(`/nodes/${id}`);
    }

    async updateNode(id, config) {
        return this.put(`/nodes/${id}`, config);
    }

    async deleteNode(id) {
        return this.delete(`/nodes/${id}`);
    }

    // ==================== EVENT STREAMING ====================

    /**
     * Connect to server-sent events
     */
    connectEvents() {
        if (this.ws) {
            this.ws.close();
        }

        const url = `${this.baseUrl}/api/v1/events/stream?token=${this.token}`;
        this.eventSource = new EventSource(url);

        this.eventSource.onopen = () => {
            console.log('Event stream connected');
            this.emit('connected');
        };

        this.eventSource.onerror = (error) => {
            console.error('Event stream error:', error);
            this.emit('error', error);
            
            setTimeout(() => this.connectEvents(), 5000);
        };

        this.eventSource.addEventListener('sensor_update', (e) => {
            this.emit('sensor_update', JSON.parse(e.data));
        });

        this.eventSource.addEventListener('node_joined', (e) => {
            this.emit('node_joined', JSON.parse(e.data));
        });

        this.eventSource.addEventListener('node_left', (e) => {
            this.emit('node_left', JSON.parse(e.data));
        });

        this.eventSource.addEventListener('mqtt_message', (e) => {
            this.emit('mqtt_message', JSON.parse(e.data));
        });

        this.eventSource.addEventListener('zigbee_message', (e) => {
            this.emit('zigbee_message', JSON.parse(e.data));
        });

        this.eventSource.addEventListener('system_alert', (e) => {
            this.emit('system_alert', JSON.parse(e.data));
        });
    }

    /**
     * Disconnect from event stream
     */
    disconnectEvents() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    /**
     * Subscribe to event
     */
    on(event, handler) {
        this.eventHandlers.set(event, handler);
    }

    /**
     * Unsubscribe from event
     */
    off(event) {
        this.eventHandlers.delete(event);
    }

    /**
     * Emit event to handlers
     */
    emit(event, data) {
        const handler = this.eventHandlers.get(event);
        if (handler) handler(data);
    }
}

/**
 * API Error class
 */
class APIError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'APIError';
    }
}

/**
 * Default API instance
 */
const api = new GatewayAPI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GatewayAPI, APIError, api };
}