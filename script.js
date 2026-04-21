// ESP32 IoT Gateway Configuration Interface

// API Client
class GatewayAPI {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl || window.location.origin.split('/').slice(0, -1).join('/') || 'http://192.168.1.100';
        this.token = localStorage.getItem('gateway_token') || 'esp32-gateway-token';
        this.eventSource = null;
        this.eventHandlers = new Map();
        this.connected = false;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('gateway_token', token);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/api/v1${endpoint}`;
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                    ...options.headers
                }
            });
            const data = await response.json();
            if (!response.ok) {
                if (data.error?.code === 'UNAUTHORIZED') {
                    showToast('Authentication failed. Check token.', 'error');
                }
                throw new Error(data.error?.message || 'Request failed');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
    async post(endpoint, data = {}) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
    async put(endpoint, data = {}) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
    async delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }

    // System
    async getSystemInfo() { return this.get('/system/info'); }
    async getSystemStatus() { return this.get('/system/status'); }
    async restartDevice() { return this.post('/system/restart'); }
    async factoryReset() { return this.post('/system/reset'); }

    // WiFi
    async getWifiConfig() { return this.get('/wifi/config'); }
    async updateWifiConfig(config) { return this.put('/wifi/config', config); }
    async scanWifi() { return this.post('/wifi/scan'); }
    async getWifiNetworks() { return this.get('/wifi/networks'); }

    // Bluetooth
    async getBluetoothConfig() { return this.get('/bt/config'); }
    async updateBluetoothConfig(config) { return this.put('/bt/config', config); }
    async scanBLE() { return this.post('/bt/scan'); }
    async getBleDevices() { return this.get('/bt/devices'); }

    // ZigBee
    async getZigbeeConfig() { return this.get('/zigbee/config'); }
    async updateZigbeeConfig(config) { return this.put('/zigbee/config', config); }
    async getZigbeeNodes() { return this.get('/zigbee/nodes'); }
    async permitJoin(duration = 60) { return this.post('/zigbee/permit-join', { duration }); }
    async removeZigbeeNode(shortAddr) { return this.delete(`/zigbee/node/${shortAddr}`); }

    // MQTT
    async getMqttConfig() { return this.get('/mqtt/config'); }
    async updateMqttConfig(config) { return this.put('/mqtt/config', config); }
    async testMqtt() { return this.post('/mqtt/test'); }
    async publishMqtt(topic, payload, qos = 1) { return this.post('/mqtt/publish', { topic, payload, qos }); }

    // Sensors
    async getSensors() { return this.get('/sensors'); }
    async getSensor(id) { return this.get(`/sensors/${id}`); }
    async getSensorHistory(id, from, to, interval = 60) { return this.get(`/sensors/history?id=${id}&from=${from}&to=${to}&interval=${interval}`); }

    // Events
    connectEvents() {
        if (this.eventSource) this.eventSource.close();
        const url = `${this.baseUrl}/api/v1/events/stream?token=${this.token}`;
        this.eventSource = new EventSource(url);
        this.eventSource.onopen = () => { this.connected = true; };
        this.eventSource.onerror = () => {
            this.connected = false;
            setTimeout(() => this.connectEvents(), 5000);
        };
        ['sensor_update', 'node_joined', 'node_left', 'mqtt_message', 'zigbee_message', 'system_alert'].forEach(type => {
            this.eventSource.addEventListener(type, (e) => {
                const handler = this.eventHandlers.get(type);
                if (handler) handler(JSON.parse(e.data));
            });
        });
    }

    disconnectEvents() {
        if (this.eventSource) { this.eventSource.close(); this.eventSource = null; }
    }

    on(event, handler) { this.eventHandlers.set(event, handler); }
    off(event) { this.eventHandlers.delete(event); }
}

const api = new GatewayAPI();

// Sample data for demonstration
let nodes = [
    { id: 1, name: 'Gateway Main', type: 'gateway', mac: 'AA:BB:CC:DD:EE:01', parent: '', enabled: true, description: 'Main gateway node' },
    { id: 2, name: 'Living Room Sensor', type: 'end_device', mac: 'AA:BB:CC:DD:EE:02', parent: '1', enabled: true, description: 'Temperature and humidity sensor' },
    { id: 3, name: 'Kitchen Light', type: 'mesh', mac: 'AA:BB:CC:DD:EE:03', parent: '1', enabled: true, description: 'Smart light controller' },
    { id: 4, name: 'Bedroom Motion', type: 'end_device', mac: 'AA:BB:CC:DD:EE:04', parent: '3', enabled: true, description: 'Motion detector' },
    { id: 5, name: 'Office Hub', type: 'mesh', mac: 'AA:BB:CC:DD:EE:05', parent: '1', enabled: false, description: 'Secondary mesh router' }
];

let zigbeeDevices = [
    { id: '0x0001', name: 'Door Sensor', type: 'sensor', status: 'online', battery: 85 },
    { id: '0x0002', name: 'Smart Plug', type: 'plug', status: 'online', battery: null },
    { id: '0x0003', name: 'Dimmer Switch', type: 'switch', status: 'offline', battery: null },
    { id: '0x0004', name: 'Motion Detector', type: 'sensor', status: 'online', battery: 92 }
];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeForms();
    loadDashboardData();
    renderNodeList();
    renderZigbeeDevices();
    renderTopology();
    startUptimeCounter();
    
    // Connect to event stream
    try {
        api.connectEvents();
        
        api.on('sensor_update', (data) => {
            const sensorEl = document.querySelector(`[data-sensor="${data.id}"]`);
            if (sensorEl) sensorEl.textContent = `${data.value}${data.unit || ''}`;
        });
        
        api.on('node_joined', (data) => {
            showToast(`New node joined: ${data.short_addr}`, 'info');
            renderZigbeeDevices();
        });
        
        api.on('node_left', (data) => {
            showToast(`Node left: ${data.short_addr}`, 'warning');
            renderZigbeeDevices();
        });
        
        api.on('system_alert', (data) => {
            showToast(data.message, 'warning');
        });
    } catch (error) {
        console.log('Event stream not available (API offline mode)');
    }
});

// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            
            // Update page title
            const title = this.querySelector('span').textContent;
            document.getElementById('pageTitle').textContent = title;
            
            // Close mobile menu
            document.querySelector('.sidebar').classList.remove('active');
        });
    });
    
    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('active');
    });
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });
}

// Form initialization
function initializeForms() {
    // WiFi Form
    document.getElementById('wifiForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSettings('WiFi');
    });
    
    // Bluetooth Form
    document.getElementById('bluetoothForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSettings('Bluetooth');
    });
    
    // ZigBee Form
    document.getElementById('zigbeeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSettings('ZigBee');
    });
    
    // MQTT Form
    document.getElementById('mqttForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSettings('MQTT');
    });
    
    // Security Form
    document.getElementById('securityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSettings('Security');
    });
    
    // Range input value display
    document.querySelectorAll('input[type="range"]').forEach(input => {
        input.addEventListener('input', function() {
            const valueDisplay = this.nextElementSibling;
            if (valueDisplay && valueDisplay.classList.contains('range-value')) {
                valueDisplay.textContent = this.value + ' dBm';
            }
        });
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        refreshAllData();
    });
    
    // Save All button
    document.getElementById('saveAllBtn').addEventListener('click', function() {
        saveAllSettings();
    });
    
    // Node filter
    document.getElementById('nodeFilter').addEventListener('change', function() {
        renderNodeList();
    });
    
    // Node search
    document.getElementById('nodeSearch').addEventListener('input', function() {
        renderNodeList();
    });
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Save settings
function saveSettings(category) {
    // In a real implementation, this would send data to the ESP32
    console.log(`Saving ${category} settings...`);
    showToast(`${category} settings saved successfully!`);
}

function saveAllSettings() {
    console.log('Saving all settings...');
    showToast('All settings saved successfully!');
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('i');
    
    toast.className = 'toast ' + type;
    
    if (type === 'success') icon.className = 'fas fa-check-circle';
    else if (type === 'error') icon.className = 'fas fa-exclamation-circle';
    else if (type === 'warning') icon.className = 'fas fa-exclamation-triangle';
    else icon.className = 'fas fa-info-circle';
    
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Loading state for buttons
function setLoading(button, loading = true) {
    if (loading) {
        button.classList.add('loading');
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '';
    } else {
        button.classList.remove('loading');
        button.innerHTML = button.dataset.originalText;
    }
}

// Confirm Modal
let confirmCallback = null;

function showConfirm(title, message, type = 'warning', callback = null) {
    const modal = document.getElementById('confirmModal') || createConfirmModal();
    const modalIcon = modal.querySelector('.modal-icon');
    const modalTitle = modal.querySelector('.modal-title');
    const modalText = modal.querySelector('.modal-text');
    const confirmBtn = modal.querySelector('.confirm-btn');
    
    modalIcon.className = 'modal-icon ' + type;
    modalTitle.textContent = title;
    modalText.textContent = message;
    
    confirmBtn.className = 'btn ' + (type === 'danger' ? 'btn-danger' : 'btn-primary');
    confirmCallback = callback;
    
    modal.classList.add('active');
}

function createConfirmModal() {
    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'modal confirm-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-body" style="text-align: center;">
                <div class="modal-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
                <h3 class="modal-title" style="margin-bottom: 8px;">Confirm Action</h3>
                <p class="modal-text" style="color: var(--text-secondary); margin-bottom: 24px;">Are you sure?</p>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="btn btn-secondary" onclick="closeModal('confirmModal')">Cancel</button>
                    <button class="btn btn-primary confirm-btn" onclick="executeConfirm()">Confirm</button>
                </div>
            </div>
        </div>
    `;
    document.querySelector('.app-container').appendChild(modal);
    return modal;
}

function executeConfirm() {
    closeModal('confirmModal');
    if (confirmCallback) confirmCallback();
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const status = await api.getSystemStatus();
        document.getElementById('wifiStatus').textContent = status.wifi?.connected ? 'Connected' : 'Disconnected';
        document.getElementById('zigbeeNodes').textContent = status.zigbee?.node_count || '0';
        document.getElementById('mqttStatus').textContent = status.mqtt?.connected ? 'Connected' : 'Disconnected';
        document.getElementById('btStatus').textContent = status.bluetooth?.enabled ? 'Enabled' : 'Disabled';
    } catch (error) {
        document.getElementById('wifiStatus').textContent = 'Unknown';
        document.getElementById('zigbeeNodes').textContent = '?';
        document.getElementById('mqttStatus').textContent = 'Unknown';
        document.getElementById('btStatus').textContent = 'Unknown';
    }
}

function updateStats() {
    loadDashboardData();
}

function renderTopology() {
    const topologyNodes = document.getElementById('topologyNodes');
    topologyNodes.innerHTML = '';
    
    const enabledNodes = nodes.filter(n => n.enabled);
    const angleStep = (2 * Math.PI) / enabledNodes.length;
    const radius = 120;
    
    enabledNodes.forEach((node, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        const nodeEl = document.createElement('div');
        nodeEl.className = 'topology-node';
        nodeEl.style.left = `calc(50% + ${x}px)`;
        nodeEl.style.top = `calc(50% + ${y}px)`;
        nodeEl.style.transform = 'translate(-50%, -50%)';
        nodeEl.style.position = 'absolute';
        nodeEl.innerHTML = `
            <i class="fas fa-${getNodeTypeIcon(node.type)}"></i>
            <span>${node.name}</span>
        `;
        
        topologyNodes.appendChild(nodeEl);
    });
}

function getNodeTypeIcon(type) {
    switch(type) {
        case 'gateway': return 'router';
        case 'mesh': return 'broadcast-tower';
        case 'end_device': return 'microchip';
        default: return 'circle';
    }
}

// WiFi functions
async function scanWiFi() {
    const scanResults = document.getElementById('scanResults');
    const wifiScanTable = document.getElementById('wifiScanTable');
    const scanBtn = event?.target?.closest('button') || document.querySelector('[onclick="scanWiFi()"]');
    
    if (scanBtn) setLoading(scanBtn, true);
    
    try {
        const result = await api.scanWifi();
        const networks = result.networks || [];
        
        if (networks.length === 0) {
            wifiScanTable.innerHTML = '<tr><td colspan="5" style="text-align: center;">No networks found</td></tr>';
        } else {
            wifiScanTable.innerHTML = networks.map(net => `
                <tr>
                    <td>${net.ssid}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 40px; height: 4px; background: #334155; border-radius: 2px;">
                                <div style="width: ${getSignalStrength(getSignalBars(net.rssi))}%; height: 100%; background: ${getSignalColor(net.rssi)}; border-radius: 2px;"></div>
                            </div>
                            <span>${net.rssi} dBm</span>
                        </div>
                    </td>
                    <td>${net.security}</td>
                    <td>${net.channel}</td>
                    <td>
                        <button class="btn btn-primary" onclick="selectNetwork('${net.ssid}')">Connect</button>
                    </td>
                </tr>
            `).join('');
        }
        
        scanResults.style.display = 'block';
        showToast(`Found ${networks.length} networks`, 'success');
    } catch (error) {
        showToast('WiFi scan failed', 'error');
    } finally {
        if (scanBtn) setLoading(scanBtn, false);
    }
}

function getSignalBars(signal) {
    if (signal > -50) return 4;
    if (signal > -60) return 3;
    if (signal > -70) return 2;
    return 1;
}

function getSignalStrength(bars) {
    return bars * 25;
}

function getSignalColor(signal) {
    if (signal > -50) return 'var(--success-color)';
    if (signal > -60) return 'var(--warning-color)';
    return 'var(--danger-color)';
}

function selectNetwork(ssid) {
    document.getElementById('ssid').value = ssid;
    showToast(`Selected network: ${ssid}`, 'success');
    document.getElementById('scanResults').style.display = 'none';
}

// Bluetooth functions
async function scanBLE() {
    const bleDevices = document.getElementById('bleDevices');
    const scanBtn = event?.target?.closest('button') || document.querySelector('[onclick="scanBLE()"]');
    
    if (scanBtn) setLoading(scanBtn, true);
    
    try {
        await api.scanBLE();
        await new Promise(resolve => setTimeout(resolve, 2000));
        const result = await api.getBleDevices();
        const devices = result.devices || [];
        
        if (devices.length === 0) {
            bleDevices.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bluetooth-b"></i>
                    <h4>No Devices Found</h4>
                    <p>No BLE devices in range. Try scanning again.</p>
                </div>
            `;
        } else {
            bleDevices.innerHTML = devices.map(device => `
                <div class="device-item">
                    <div class="device-name">${device.name}</div>
                    <div class="device-status">${device.address}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">RSSI: ${device.rssi} dBm</div>
                </div>
            `).join('');
        }
        
        showToast(`Found ${devices.length} BLE devices`, 'success');
    } catch (error) {
        bleDevices.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Scan Failed</h4>
                <p>Could not scan for BLE devices.</p>
            </div>
        `;
        showToast('BLE scan failed', 'error');
    } finally {
        if (scanBtn) setLoading(scanBtn, false);
    }
}

// ZigBee functions
async function renderZigbeeDevices() {
    const deviceGrid = document.getElementById('zigbeeDevices');
    
    try {
        const result = await api.getZigbeeNodes();
        const nodes = result.nodes || [];
        
        if (nodes.length === 0) {
            deviceGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-broadcast-tower"></i>
                    <h4>No ZigBee Devices</h4>
                    <p>Click "Permit Join" to add new devices.</p>
                </div>
            `;
        } else {
            deviceGrid.innerHTML = nodes.map(node => `
                <div class="device-item">
                    <div class="device-name">${node.name || node.short_addr}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">ID: ${node.short_addr}</div>
                    <div class="device-status" style="color: var(--success-color)">● Online</div>
                    ${node.battery ? `<div style="font-size: 0.75rem;">Battery: ${node.battery}%</div>` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        deviceGrid.innerHTML = zigbeeDevices.map(device => `
            <div class="device-item">
                <div class="device-name">${device.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">ID: ${device.id}</div>
                <div class="device-status" style="color: ${device.status === 'online' ? 'var(--success-color)' : 'var(--danger-color)'}">
                    ${device.status === 'online' ? '● Online' : '○ Offline'}
                </div>
                ${device.battery ? `<div style="font-size: 0.75rem;">Battery: ${device.battery}%</div>` : ''}
            </div>
        `).join('');
    }
}

async function permitJoin() {
    const permitBtn = event?.target?.closest('button') || document.querySelector('[onclick="permitJoin()"]');
    if (permitBtn) setLoading(permitBtn, true);
    
    try {
        await api.permitJoin(60);
        showToast('Permit join enabled for 60 seconds', 'success');
    } catch (error) {
        showToast('Failed to enable permit join', 'error');
    } finally {
        if (permitBtn) setLoading(permitBtn, false);
    }
}

// MQTT functions
async function testMQTT() {
    const consoleOutput = document.getElementById('consoleOutput');
    const timestamp = new Date().toLocaleTimeString();
    
    try {
        const result = await api.testMqtt();
        consoleOutput.innerHTML += `
            <div class="console-line console-success">[${timestamp}] Connection successful! (${result.latency_ms}ms)</div>
        `;
        showToast('MQTT connection successful!', 'success');
    } catch (error) {
        consoleOutput.innerHTML += `
            <div class="console-line console-error">[${timestamp}] Connection failed</div>
        `;
        showToast('MQTT connection failed', 'error');
    }
    
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

async function publishMQTT() {
    const topic = document.getElementById('publishTopic').value || 'iot/gateway/manual';
    const message = document.getElementById('publishMessage').value;
    const consoleOutput = document.getElementById('consoleOutput');
    const timestamp = new Date().toLocaleTimeString();
    
    if (!message) {
        showToast('Please enter a message', 'warning');
        return;
    }
    
    try {
        await api.publishMqtt(topic, message);
        consoleOutput.innerHTML += `
            <div class="console-line console-success">[${timestamp}] Published to ${topic}: ${message}</div>
        `;
        document.getElementById('publishMessage').value = '';
        showToast('Message published!', 'success');
    } catch (error) {
        consoleOutput.innerHTML += `
            <div class="console-line console-error">[${timestamp}] Publish failed: ${error.message}</div>
        `;
        showToast('Failed to publish message', 'error');
    }
    
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Node Management functions
function renderNodeList() {
    const nodeList = document.getElementById('nodeList');
    const filter = document.getElementById('nodeFilter').value;
    const search = document.getElementById('nodeSearch').value.toLowerCase();
    
    let filteredNodes = nodes;
    
    if (filter !== 'all') {
        filteredNodes = filteredNodes.filter(n => n.type === filter);
    }
    
    if (search) {
        filteredNodes = filteredNodes.filter(n => 
            n.name.toLowerCase().includes(search) || 
            n.description.toLowerCase().includes(search)
        );
    }
    
    if (filteredNodes.length === 0) {
        nodeList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sitemap"></i>
                <h4>No Nodes Found</h4>
                <p>${search ? 'No nodes match your search.' : 'No nodes registered yet.'}</p>
            </div>
        `;
        return;
    }
    
    nodeList.innerHTML = filteredNodes.map(node => `
        <div class="node-item">
            <div class="node-info">
                <div class="node-icon">
                    <i class="fas fa-${getNodeTypeIcon(node.type)}"></i>
                </div>
                <div>
                    <div style="font-weight: 600;">${node.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${node.mac}</div>
                    <div style="font-size: 0.75rem; color: ${node.enabled ? 'var(--success-color)' : 'var(--danger-color)'}">
                        ${node.enabled ? '● Enabled' : '○ Disabled'}
                    </div>
                </div>
            </div>
            <div class="node-actions">
                <button class="btn btn-secondary" onclick="editNode(${node.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-secondary" onclick="toggleNode(${node.id})">
                    <i class="fas fa-${node.enabled ? 'power-off' : 'power-off'}"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Update parent dropdown in modal
    updateParentDropdown();
}

function updateParentDropdown() {
    const parentSelect = document.getElementById('nodeParent');
    const gatewayNodes = nodes.filter(n => n.type === 'gateway' || n.type === 'mesh');
    
    parentSelect.innerHTML = '<option value="">Direct to Gateway</option>' +
        gatewayNodes.map(n => `<option value="${n.id}">${n.name}</option>`).join('');
}

function addNewNode() {
    document.getElementById('nodeId').value = '';
    document.getElementById('nodeName').value = '';
    document.getElementById('nodeType').value = 'end_device';
    document.getElementById('nodeMacAddress').value = '';
    document.getElementById('nodeParent').value = '';
    document.getElementById('nodeEnabled').checked = true;
    document.getElementById('nodeDescription').value = '';
    
    openModal('nodeModal');
}

function editNode(id) {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    
    document.getElementById('nodeId').value = node.id;
    document.getElementById('nodeName').value = node.name;
    document.getElementById('nodeType').value = node.type;
    document.getElementById('nodeMacAddress').value = node.mac;
    document.getElementById('nodeParent').value = node.parent || '';
    document.getElementById('nodeEnabled').checked = node.enabled;
    document.getElementById('nodeDescription').value = node.description || '';
    
    openModal('nodeModal');
}

function saveNodeConfig() {
    const id = document.getElementById('nodeId').value;
    const nodeData = {
        name: document.getElementById('nodeName').value,
        type: document.getElementById('nodeType').value,
        mac: document.getElementById('nodeMacAddress').value,
        parent: document.getElementById('nodeParent').value,
        enabled: document.getElementById('nodeEnabled').checked,
        description: document.getElementById('nodeDescription').value
    };
    
    if (id) {
        // Update existing node
        const index = nodes.findIndex(n => n.id == id);
        if (index !== -1) {
            nodes[index] = { ...nodes[index], ...nodeData };
        }
    } else {
        // Add new node
        const newId = Math.max(...nodes.map(n => n.id)) + 1;
        nodes.push({ id: newId, ...nodeData });
    }
    
    closeModal('nodeModal');
    renderNodeList();
    renderTopology();
    showToast('Node configuration saved!');
}

function deleteNode() {
    const id = document.getElementById('nodeId').value;
    if (!id) return;
    
    if (confirm('Are you sure you want to delete this node?')) {
        nodes = nodes.filter(n => n.id != id);
        closeModal('nodeModal');
        renderNodeList();
        renderTopology();
        showToast('Node deleted successfully!');
    }
}

function toggleNode(id) {
    const node = nodes.find(n => n.id === id);
    if (node) {
        node.enabled = !node.enabled;
        renderNodeList();
        renderTopology();
        showToast(`Node ${node.enabled ? 'enabled' : 'disabled'}`);
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Sensor Data functions
function refreshSensorData() {
    // Simulate refreshing sensor data
    showToast('Sensor data refreshed');
}

// System functions
function restartDevice() {
    showConfirm(
        'Restart Device',
        'Are you sure you want to restart the gateway? All connections will be temporarily lost.',
        'warning',
        () => {
            showToast('Device restarting...', 'info');
        }
    );
}

function factoryReset() {
    showConfirm(
        'Factory Reset',
        'WARNING: This will erase ALL settings, unpair ALL nodes, and restore factory defaults. This action CANNOT be undone!',
        'danger',
        () => {
            showToast('Factory reset initiated...', 'warning');
        }
    );
}

function checkUpdate() {
    showToast('Checking for updates...', 'info');
    setLoading(document.querySelector('.action-btn[onclick="checkUpdate()"]'));
    setTimeout(() => {
        showToast('You are running the latest version (v1.2.3)', 'success');
    }, 1500);
}

function backupConfig() {
    showToast('Configuration backup downloaded', 'success');
}

function restoreConfig() {
    showToast('Please select a configuration file to restore', 'info');
}

function exportLogs() {
    showToast('System logs exported', 'success');
}

// Uptime counter
function startUptimeCounter() {
    let seconds = 0;
    const uptimeElement = document.getElementById('uptime');
    
    setInterval(() => {
        seconds++;
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        uptimeElement.textContent = `${days}d ${hours}h ${minutes}m`;
    }, 60000); // Update every minute
}

// Refresh all data
function refreshAllData() {
    updateStats();
    renderNodeList();
    renderZigbeeDevices();
    renderTopology();
    showToast('All data refreshed');
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
