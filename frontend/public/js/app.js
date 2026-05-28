console.log("📱 Website geladen met Track Visual!");

const API_URL = 'http://localHost:5000';

// ===========================================
// KARRETJE VERPLAATSEN (originele CSS stijl)
// ===========================================
function moveCartTo(cartId, segmentNumber) {
    let cart = document.getElementById(cartId.toString());
    if (!cart) return;

    let container = cart.parentElement;
    let track = container.querySelector('.track');
    if (!track) return;

    let trackWidth = track.offsetWidth;
    if (trackWidth === 0) {
        setTimeout(() => moveCartTo(cartId, segmentNumber), 100);
        return;
    }

    let segments = track.children.length;
    let segmentWidth = trackWidth / segments;
    let cartWidth = cart.offsetWidth;

    // Originele formule die werkte
    let left = 12.5 + (25 * (segmentNumber - 1)) - 4;
    cart.style.left = `${left}%`;
    cart.dataset.segment = segmentNumber;

    console.log(`karretje ${cartId} naar segment ${segmentNumber} (left: ${left}%)`);
}

// ===========================================
// SEGMENT KLEUR AANPASSEN
// ===========================================
function setSegmentColor(segmentNumber, color) {
    let segment = document.getElementById('segment' + segmentNumber);
    if (segment) {
        segment.style.backgroundColor = color;
    }
}

// ===========================================
// DROPDOWN FUNCTIES - CART SELECTOR
// ===========================================

// Vul de dropdown met alle beschikbare carts
async function vulCartSelector() {
    const selector = document.getElementById('cartSelector');
    if (!selector) return;
    
    try {
        const response = await fetch(API_URL + '/config/carts');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            selector.innerHTML = '';
            
            for (const cart of result.data) {
                const option = document.createElement('option');
                option.value = cart.cartId;
                option.textContent = `Cart ${cart.cartId} (ESPs: ${cart.espIds.join(', ')})`;
                selector.appendChild(option);
            }
            
            if (trackConfig.currentCart) {
                selector.value = trackConfig.currentCart.cartId;
            }
            
            selector.disabled = false;
            console.log("✅ Dropdown gevuld met", result.data.length, "carts");
        } else {
            selector.innerHTML = '<option value="">Geen carts - maak er een aan in config</option>';
            selector.disabled = true;
        }
    } catch (err) {
        console.error("❌ Dropdown vullen mislukt:", err);
        selector.innerHTML = '<option value="">Fout bij laden</option>';
    }
}

// Wissel van cart
async function switchCart(cartId) {
    console.log(`🔄 Wisselen naar Cart ${cartId}`);
    
    const carts = await fetchCarts();
    const nieuweCart = carts.find(c => c.cartId === parseInt(cartId));
    
    if (nieuweCart) {
        trackConfig.currentCart = nieuweCart;
        console.log("✅ Huidige cart is nu:", trackConfig.currentCart);
        
        // Reset de track
        createTrack();
        
        // Haal direct nieuwe data op
        await haalData();
    } else {
        console.error("❌ Cart niet gevonden:", cartId);
    }
}

// ===========================================
// DATA VERWERKEN - DIRECT UIT LATESTVALUES (omzeilt API locationValue)
// ===========================================
async function haalData() {
    if (!trackConfig.currentCart) {
        console.log("⚠️ Geen cart geselecteerd");
        return;
    }
    
    try {
        const response = await fetch(API_URL + '/grouped-data');
        const result = await response.json();
        
        if (!result.success || !result.data) {
            console.error("Geen data");
            return;
        }
        
        const cartData = result.data[trackConfig.currentCart.cartId];
        if (!cartData) {
            console.log("Geen data voor cart", trackConfig.currentCart.cartId);
            return;
        }
        
        console.log("Cart data:", cartData);
        
        // Toon alle metingen in tabel
        toonData(cartData.latestValues);
        
        // ===== DIRECT UIT LATESTVALUES HALEN (omzeilt API) =====
        let locatie = null;
        
        // Zoek in latestValues naar sensor die eindigt op "locatie"
        for (let [sensorType, waarde] of Object.entries(cartData.latestValues)) {
            if (sensorType.toLowerCase().endsWith('locatie')) {
                // Converteer op basis van sensor type
                if (sensorType.toLowerCase() === 'huskylenslocatie') {
                    locatie = convertHuskylensToSegment(waarde);
                    console.log(`📍 Huskylens locatie: ${sensorType} = ${waarde} → segment ${locatie}`);
                } else {
                    locatie = convertNfcToSegment(waarde);
                    console.log(`📍 NFC/RFID locatie: ${sensorType} = ${waarde} → segment ${locatie}`);
                }
                break;
            }
        }
        
        // Als geen locatie sensor gevonden, gebruik dan de locationValue van API
        if (locatie === null && cartData.locationValue !== null) {
            console.log("⚠️ Geen locatie sensor in latestValues, gebruik API locationValue:", cartData.locationValue);
            locatie = convertNfcToSegment(cartData.locationValue);
        }
        
        // Verplaats karretje
        if (locatie !== null && locatie >= 1 && locatie <= trackConfig.segmentCount) {
            moveCartTo(trackConfig.currentCart.cartId, locatie);
            console.log(`✅ Karretje bewogen naar segment ${locatie}`);
        } else {
            console.log("⚠️ Geen geldige locatie:", locatie);
        }
        
        // Bepaal kleur
        let kleurWaarde = null;
        
        // Zoek eerst naar colorSensor uit config
        if (trackConfig.currentCart.colorSensor) {
            kleurWaarde = cartData.latestValues[trackConfig.currentCart.colorSensor];
        }
        
        // Zoek anders automatisch een numerieke sensor
        if (kleurWaarde === undefined) {
            for (let [sensorType, waarde] of Object.entries(cartData.latestValues)) {
                if (!sensorType.toLowerCase().endsWith('locatie') && typeof waarde === 'number') {
                    kleurWaarde = waarde;
                    console.log(`🎨 Automatische kleur sensor: ${sensorType} = ${kleurWaarde}`);
                    break;
                }
            }
        }
        
        if (kleurWaarde !== undefined && locatie !== null) {
            const thresholds = trackConfig.currentCart.colorThresholds || [10, 30, 50];
            const kleur = getColorFromThreshold(kleurWaarde, thresholds);
            setSegmentColor(locatie, kleur);
            console.log(`🎨 Kleur voor segment ${locatie}: ${kleur} (waarde=${kleurWaarde})`);
        }
        
    } catch (fout) {
        console.error("Fout bij ophalen data:", fout);
        document.getElementById('realtime').innerHTML = '<p style="color:red">Kan niet verbinden met API</p>';
    }
}

// ===========================================
// TABEL MAKEN
// ===========================================
function toonData(sensorValues) {
    let html = '<table><tr><th>Sensor Type</th><th>Waarde</th></tr>';
    
    for (let [type, waarde] of Object.entries(sensorValues)) {
        html += `<tr>
        <td>${type}</td>
        <td>${waarde}</td>
        </tr>`;
    }
    
    document.getElementById('realtime').innerHTML = html;
}

// ===========================================
// TRACK AANMAKEN (originele stijl)
// ===========================================
function createTrack() {
    let container = document.getElementById('homeTrackContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!trackConfig.currentCart) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">⚠️ Geen carts gevonden. Ga naar de config pagina om er een aan te maken.</p>';
        return;
    }

    // Maak karretje eerst
    let cart = document.createElement('div');
    cart.className = 'cart';
    cart.id = trackConfig.currentCart.cartId.toString();
    container.appendChild(cart);

    let lading = document.createElement('div');
    lading.className = 'lading';
    cart.appendChild(lading);

    // Maak track
    let track = document.createElement('div');
    track.className = 'track';
    container.appendChild(track);

    // Maak segmenten
    for (let i = 1; i <= trackConfig.segmentCount; i++) {
        let segment = document.createElement('div');
        segment.className = 'track-segment';
        segment.id = 'segment' + i;
        segment.innerHTML = 'Segment ' + i;
        track.appendChild(segment);
    }

    console.log("Track klaar - karretje heeft id='" + trackConfig.currentCart.cartId + "'");

    setTimeout(() => moveCartTo(trackConfig.currentCart.cartId, 1), 200);
}

// ===========================================
// GRAFIEK
// ===========================================
async function maakGrafiek() {
    try {
        const response = await fetch(API_URL + '/grafiekendata');
        const data = await response.json();

        if (data.labels && data.labels.length > 0) {
            const ctx = document.getElementById('grafiek').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: data,
                options: { responsive: true }
            });
        }
    } catch (fout) {
        console.log("Grafiek fout:", fout);
    }
}

// ===========================================
// CONFIGURATIE PAGINA FUNCTIES
// ===========================================

async function toonCartsOverzicht() {
    const container = document.getElementById('cartsList');
    if (!container) return;
    
    const carts = await fetchCarts();
    
    if (carts.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">Geen carts gevonden. Klik op "+ Nieuwe Cart" om er een toe te voegen.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    for (const cart of carts) {
        const cartCard = document.createElement('div');
        cartCard.style.cssText = 'border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #fafafa;';
        
        const espBadges = cart.espIds.map(id => 
            `<span style="display: inline-block; background: #FA8112; color: white; padding: 4px 10px; border-radius: 20px; margin: 0 5px 5px 0; font-size: 12px;">ESP ${id}</span>`
        ).join('');
        
        cartCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="font-size: 18px;">📦 Cart ${cart.cartId}</strong>
                    <div style="margin-top: 10px;">
                        ${espBadges || '<span style="color: #999;">Geen ESPs</span>'}
                    </div>
                </div>
                <div>
                    <button class="editCartBtn" data-cartid="${cart.cartId}" style="width: auto; background: #007bff; margin-right: 5px;">✏️ Bewerk</button>
                    <button class="deleteCartBtn" data-cartid="${cart.cartId}" style="width: auto; background: #dc3545;">🗑️ Verwijder</button>
                </div>
            </div>
        `;
        
        container.appendChild(cartCard);
    }
    
    document.querySelectorAll('.editCartBtn').forEach(btn => {
        btn.addEventListener('click', () => openModal(parseInt(btn.dataset.cartid)));
    });
    
    document.querySelectorAll('.deleteCartBtn').forEach(btn => {
        btn.addEventListener('click', () => deleteCartConfirm(parseInt(btn.dataset.cartid)));
    });
}

async function saveCart(cartId, espIds) {
    try {
        const response = await fetch(`http://localhost:5000/config/carts/${cartId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cartId: cartId,
                espIds: espIds,
                active: true,
                name: `Cart ${cartId}`,
                locationSensor: "huskylensLocatie",
                colorSensor: "az1",
                colorThresholds: [10, 30, 50]
            })
        });
        const result = await response.json();
        return result.success;
    } catch (err) {
        console.error("Fout bij opslaan:", err);
        return false;
    }
}

async function deleteCart(cartId) {
    try {
        const response = await fetch(`http://localhost:5000/config/carts/${cartId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        return result.success;
    } catch (err) {
        console.error("Fout bij verwijderen:", err);
        return false;
    }
}

function maakCheckboxes(container, geselecteerdeIds) {
    container.innerHTML = '';
    
    for (let i = 1; i <= 7; i++) {
        const label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; gap: 5px; cursor: pointer; min-width: 70px;';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = i;
        checkbox.checked = geselecteerdeIds.includes(i);
        
        const span = document.createElement('span');
        span.textContent = `ESP ${i}`;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    }
}

let huidigeEditCartId = null;

async function openModal(cartId = null) {
    const modal = document.getElementById('cartModal');
    const modalTitle = document.getElementById('modalTitle');
    const cartIdInput = document.getElementById('modalCartId');
    const espContainer = document.getElementById('modalEspCheckboxes');
    
    huidigeEditCartId = cartId;
    
    if (cartId) {
        modalTitle.textContent = `✏️ Cart ${cartId} bewerken`;
        cartIdInput.value = cartId;
        cartIdInput.disabled = true;
        
        const carts = await fetchCarts();
        const cart = carts.find(c => c.cartId === cartId);
        const geselecteerdeESPids = cart ? cart.espIds : [];
        maakCheckboxes(espContainer, geselecteerdeESPids);
    } else {
        modalTitle.textContent = '➕ Nieuwe Cart toevoegen';
        cartIdInput.value = '';
        cartIdInput.disabled = false;
        maakCheckboxes(espContainer, []);
    }
    
    modal.style.display = 'block';
}

async function opslaanUitModal() {
    const cartIdInput = document.getElementById('modalCartId');
    const espContainer = document.getElementById('modalEspCheckboxes');
    
    const cartId = parseInt(cartIdInput.value);
    
    if (isNaN(cartId) || cartId < 1) {
        alert('Voer een geldig Cart ID in (getal groter dan 0)');
        return;
    }
    
    const geselecteerdeESPids = [];
    const checkboxes = espContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (cb.checked) geselecteerdeESPids.push(parseInt(cb.value));
    });
    
    if (geselecteerdeESPids.length === 0) {
        alert('Selecteer minstens 1 ESP voor deze cart');
        return;
    }
    
    const success = await saveCart(cartId, geselecteerdeESPids);
    
    if (success) {
        alert(`✅ Cart ${cartId} opgeslagen met ESPs: ${geselecteerdeESPids.map(id => `ESP ${id}`).join(', ')}`);
        sluitModal();
        toonCartsOverzicht();
        await loadConfigFromBackend();
        await vulCartSelector();
        createTrack();
    } else {
        alert('❌ Fout bij opslaan. Check of het Cart ID al bestaat?');
    }
}

async function deleteCartConfirm(cartId) {
    if (confirm(`Weet je zeker dat je Cart ${cartId} wilt verwijderen?`)) {
        const success = await deleteCart(cartId);
        if (success) {
            alert(`✅ Cart ${cartId} verwijderd`);
            toonCartsOverzicht();
            await loadConfigFromBackend();
            await vulCartSelector();
            createTrack();
        } else {
            alert('❌ Fout bij verwijderen');
        }
    }
}

function sluitModal() {
    document.getElementById('cartModal').style.display = 'none';
    huidigeEditCartId = null;
}

function initConfigPagina() {
    if (!document.getElementById('cartsList')) return;
    
    toonCartsOverzicht();
    
    const nieuweBtn = document.getElementById('nieuweCartBtn');
    if (nieuweBtn) nieuweBtn.onclick = () => openModal();
    
    const opslaanBtn = document.getElementById('modalOpslaanBtn');
    if (opslaanBtn) opslaanBtn.onclick = opslaanUitModal;
    
    const annulerenBtn = document.getElementById('modalAnnulerenBtn');
    if (annulerenBtn) annulerenBtn.onclick = sluitModal;
    
    window.onclick = (event) => {
        const modal = document.getElementById('cartModal');
        if (event.target === modal) sluitModal();
    };
}

// ===========================================
// SCROLL FUNCTIE
// ===========================================
function scrollToSection(sectionId) {
    let element = document.getElementById(sectionId);
    if (!element) return;

    let elementPosition = element.getBoundingClientRect().top + window.scrollY;
    let offsetPosition = elementPosition - 80;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// ===========================================
// WINDOW RESIZE
// ===========================================
window.addEventListener('resize', () => {
    if (trackConfig.currentCart) {
        let cart = document.getElementById(trackConfig.currentCart.cartId.toString());
        if (cart && cart.dataset.segment) {
            moveCartTo(trackConfig.currentCart.cartId, parseInt(cart.dataset.segment));
        }
    }
});

// ===========================================
// STARTUP
// ===========================================
window.addEventListener('DOMContentLoaded', async () => {
    await loadConfigFromBackend();
    await vulCartSelector();
    createTrack();
    haalData();
    maakGrafiek();
    initConfigPagina();
    
    setInterval(haalData, 1000);
    
    const selector = document.getElementById('cartSelector');
    if (selector) {
        selector.addEventListener('change', (e) => {
            if (e.target.value) {
                switchCart(e.target.value);
            }
        });
    }
});