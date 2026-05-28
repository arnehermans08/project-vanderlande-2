// config.js - Dynamische configuratie vanuit database
let trackConfig = {
    segmentCount: 4,
    colors: ['#2E7D32', '#ffb339', '#C62828'],
    currentCart: null,
    carts: []
};

// Converteer huskylens string naar segment nummer
function convertHuskylensToSegment(rawValue) {
    if (!rawValue || rawValue === 0) return null;
    
    const stringValue = String(rawValue);
    const parts = stringValue.split(".");
    
    if (parts.length >= 3) {
        return parseInt(parts[2]);
    }
    return null;
}

// Converteer NFC locatie naar segment
function convertNfcToSegment(rawValue) {
    if (!rawValue && rawValue !== 0) return null;
    return parseInt(rawValue);
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
        const response = await fetch('http://localhost:5000/config/carts');
        const result = await response.json();
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
        const carts = await fetchCarts();
        
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

// ===========================================
// CHECK OF SENSOR EEN LOCATIE SENSOR IS (eindigt op "locatie")
// ===========================================
function isLocationSensor(sensorType) {
    // Kijk of de sensor naam eindigt op "locatie" (hoofdlettergevoeligheid negeren)
    return sensorType.toLowerCase().endsWith('locatie');
}

// Bepaal automatisch welke sensor de locatie geeft
function findLocationSensor(latestValues) {
    for (let [sensorType, waarde] of Object.entries(latestValues)) {
        if (isLocationSensor(sensorType)) {
            return { sensorType, waarde };
        }
    }
    return null;
}