// ESP32 IoT Gateway Configuration Interface

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
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Dashboard functions
function loadDashboardData() {
    // Simulate loading dashboard data
    updateStats();
}

function updateStats() {
    // Update statistics cards with real data from ESP32
    document.getElementById('wifiStatus').textContent = 'Connected';
    document.getElementById('zigbeeNodes').textContent = zigbeeDevices.length.toString();
    document.getElementById('mqttStatus').textContent = 'Connected';
    document.getElementById('btStatus').textContent = 'Enabled';
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
function scanWiFi() {
    const scanResults = document.getElementById('scanResults');
    const wifiScanTable = document.getElementById('wifiScanTable');
    
    // Simulate WiFi scan
    const networks = [
        { ssid: 'Home_Network', signal: -45, security: 'WPA2', channel: 6 },
        { ssid: 'Neighbor_WiFi', signal: -72, security: 'WPA2', channel: 11 },
        { ssid: 'Guest_Network', signal: -58, security: 'WPA2', channel: 1 },
        { ssid: 'IoT_Devices', signal: -50, security: 'WPA3', channel: 6 }
    ];
    
    wifiScanTable.innerHTML = networks.map(net => `
        <tr>
            <td>${net.ssid}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 40px; height: 4px; background: #334155; border-radius: 2px;">
                        <div style="width: ${getSignalStrength(getSignalBars(net.signal))}%; height: 100%; background: ${getSignalColor(net.signal)}; border-radius: 2px;"></div>
                    </div>
                    <span>${net.signal} dBm</span>
                </div>
            </td>
            <td>${net.security}</td>
            <td>${net.channel}</td>
            <td>
                <button class="btn btn-primary" onclick="selectNetwork('${net.ssid}')">Connect</button>
            </td>
        </tr>
    `).join('');
    
    scanResults.style.display = 'block';
    showToast('WiFi scan completed');
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
    if (signal > -50) return '#10B981';
    if (signal > -60) return '#F59E0B';
    return '#EF4444';
}

function selectNetwork(ssid) {
    document.getElementById('ssid').value = ssid;
    showToast(`Selected network: ${ssid}`);
    document.getElementById('scanResults').style.display = 'none';
}

// Bluetooth functions
function scanBLE() {
    const bleDevices = document.getElementById('bleDevices');
    
    // Simulate BLE scan
    const devices = [
        { name: 'ESP32-Node-01', address: 'AA:BB:CC:11:22:33', rssi: -65 },
        { name: 'ESP32-Node-02', address: 'AA:BB:CC:44:55:66', rssi: -72 },
        { name: 'Smart Watch', address: 'DD:EE:FF:77:88:99', rssi: -58 }
    ];
    
    bleDevices.innerHTML = devices.map(device => `
        <div class="device-item">
            <div class="device-name">${device.name}</div>
            <div class="device-status">${device.address}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">RSSI: ${device.rssi} dBm</div>
        </div>
    `).join('');
    
    showToast('BLE scan completed');
}

// ZigBee functions
function renderZigbeeDevices() {
    const deviceGrid = document.getElementById('zigbeeDevices');
    
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

function permitJoin() {
    showToast('Permitting new devices to join for 60 seconds...');
    // In real implementation, this would enable ZigBee joining mode
}

// MQTT functions
function testMQTT() {
    const consoleOutput = document.getElementById('consoleOutput');
    const timestamp = new Date().toLocaleTimeString();
    
    consoleOutput.innerHTML += `
        <div class="console-line system">[${timestamp}] Testing connection to broker...</div>
        <div class="console-line system">[${timestamp}] Connected to broker.iot.local:1883</div>
        <div class="console-line message">[${timestamp}] Test message published to iot/gateway/test</div>
    `;
    
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    showToast('MQTT connection successful!');
}

function publishMQTT() {
    const topic = document.getElementById('publishTopic').value || 'iot/gateway/manual';
    const message = document.getElementById('publishMessage').value;
    const consoleOutput = document.getElementById('consoleOutput');
    const timestamp = new Date().toLocaleTimeString();
    
    if (!message) {
        showToast('Please enter a message');
        return;
    }
    
    consoleOutput.innerHTML += `
        <div class="console-line message">[${timestamp}] Publishing to ${topic}: ${message}</div>
    `;
    
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
    document.getElementById('publishMessage').value = '';
    showToast('Message published!');
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
    if (confirm('Are you sure you want to restart the device?')) {
        showToast('Device restarting...');
        // In real implementation, send restart command to ESP32
    }
}

function factoryReset() {
    if (confirm('WARNING: This will reset all settings to factory defaults. Continue?')) {
        showToast('Factory reset initiated...');
        // In real implementation, send factory reset command to ESP32
    }
}

function checkUpdate() {
    showToast('Checking for updates...');
    // Simulate update check
    setTimeout(() => {
        showToast('You are running the latest version (v1.2.3)');
    }, 1500);
}

function backupConfig() {
    showToast('Configuration backup downloaded');
    // In real implementation, download config file
}

function restoreConfig() {
    showToast('Please select a configuration file to restore');
    // In real implementation, open file picker
}

function exportLogs() {
    showToast('System logs exported');
    // In real implementation, download log file
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
