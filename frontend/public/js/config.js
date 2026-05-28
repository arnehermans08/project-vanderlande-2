// config.js - Dynamische configuratie vanuit database
let trackConfig = {
    segmentCount: 2,  // Nu 2 segmenten ipv 4
    colors: ['#2E7D32', '#ffb339', '#C62828'],
    currentCart: null,
    carts: []
};






// Simpele converter voor locatie (alleen laatste cijfer)
function convertLocationToSegment(waarde) {
    if (!waarde && waarde !== 0) return null;
    
    // Als het een getal is (1 of 2)
    if (typeof waarde === 'number') {
        return waarde;
    }
    
    // Als het een string is zoals "0001" of "0002"
    if (typeof waarde === 'string') {
        // Pak de laatste 4 cijfers en converteer naar getal
        let laatsteDeel = waarde.slice(-4);
        let segment = parseInt(laatsteDeel);
        if (segment === 1 || segment === 2) {
            return segment;
        }
    }
    
    return null;
}

// Bepaal kleur op basis van waarde en thresholds
function getColorFromThreshold(value, thresholds) {
    if (!thresholds || thresholds.length < 3) return trackConfig.colors[0];
    
    if (value >= thresholds[2]) return trackConfig.colors[2];
    if (value >= thresholds[1]) return trackConfig.colors[1];
    return trackConfig.colors[0];
}

// Haal alle carts op van de database
async function fetchCarts() {
    try {
        let response = await fetch('http://localhost:5000/config/carts');
        let result = await response.json();
        trackConfig.carts = result.success ? result.data : [];
        return trackConfig.carts;
    } catch (err) {
        console.error("Fout bij ophalen carts:", err);
        return [];
    }
}

// Laad configuratie van backend
async function loadConfigFromBackend() {
    try {
        let carts = await fetchCarts();
        
        if (carts.length > 0) {
            if (!trackConfig.currentCart || !carts.find(c => c.cartId === trackConfig.currentCart.cartId)) {
                trackConfig.currentCart = carts[0];
            }
            console.log("✅ Configuratie geladen:", trackConfig.currentCart);
            return true;
        } else {
            console.warn("⚠️ Geen actieve cart configuratie gevonden");
            trackConfig.currentCart = null;
            return false;
        }
    } catch (err) {
        console.error("❌ Config laden mislukt:", err);
        return false;
    }
}

// Check of sensor een locatie sensor is (eindigt op "locatie")
function isLocationSensor(sensorType) {
    return sensorType.toLowerCase().endsWith('locatie');
}