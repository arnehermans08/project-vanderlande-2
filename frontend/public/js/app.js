console.log("📱 Website geladen met Track Visual!");

let API_URL = 'http://localHost:5000';

// ===========================================
// KARRETJE VERPLAATSEN (flexibel voor elk aantal segmenten)
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
    let cartWidth = cart.offsetWidth;

    let segmentWidth = trackWidth / segments;
    let leftPosition = (segmentNumber - 1) * segmentWidth;
    leftPosition = leftPosition + (segmentWidth / 2) - (cartWidth / 2);
    let leftPercentage = (leftPosition / trackWidth) * 100;

    cart.style.left = `${leftPercentage}%`;
    cart.dataset.segment = segmentNumber;

    console.log(`karretje ${cartId} naar segment ${segmentNumber} (${segments} segmenten, left: ${leftPercentage.toFixed(1)}%)`);
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

async function vulCartSelector() {
    let selector = document.getElementById('cartSelector');
    if (!selector) return;

    try {
        let response = await fetch(API_URL + '/config/carts');
        let result = await response.json();

        if (result.success && result.data.length > 0) {
            selector.innerHTML = '';

            for (let cart of result.data) {
                let option = document.createElement('option');
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

async function switchCart(cartId) {
    console.log(`🔄 Wisselen naar Cart ${cartId}`);

    let carts = await fetchCarts();
    let nieuweCart = carts.find(c => c.cartId === parseInt(cartId));

    if (nieuweCart) {
        trackConfig.currentCart = nieuweCart;
        console.log("✅ Huidige cart is nu:", trackConfig.currentCart);

        createTrack();
        await haalData();
    } else {
        console.error("❌ Cart niet gevonden:", cartId);
    }
}

// ===========================================
// DATA VERWERKEN - Vereenvoudigd voor 2 segmenten
// ===========================================
let laatsteLocatiePerCart = {};

async function haalData() {
    if (!trackConfig.currentCart) {
        console.log("⚠️ Geen cart geselecteerd");
        return;
    }

    try {
        let response = await fetch(API_URL + '/grouped-data');
        let result = await response.json();

        if (!result.success || !result.data) {
            console.error("Geen data");
            return;
        }

        let cartData = result.data[trackConfig.currentCart.cartId];
        if (!cartData) {
            console.log("Geen data voor cart", trackConfig.currentCart.cartId);
            return;
        }

        console.log("Cart data:", cartData);

        toonData(cartData.latestValues);

        let locatie = null;

        for (let [sensorType, waarde] of Object.entries(cartData.latestValues)) {
            if (isLocationSensor(sensorType)) {
                locatie = convertLocationToSegment(waarde);
                console.log(`📍 Locatie sensor: ${sensorType} = ${waarde} → segment ${locatie}`);
                break;
            }
        }

        if (locatie === null && cartData.locationValue !== null) {
            locatie = convertLocationToSegment(cartData.locationValue);
            console.log(`📍 Backup locationValue = ${cartData.locationValue} → segment ${locatie}`);
        }

        if (locatie !== null && locatie >= 1 && locatie <= trackConfig.segmentCount) {
            if (laatsteLocatiePerCart[trackConfig.currentCart.cartId] !== locatie) {
                console.log(`🔄 Locatie veranderd naar segment ${locatie}`);
                moveCartTo(trackConfig.currentCart.cartId, locatie);
                laatsteLocatiePerCart[trackConfig.currentCart.cartId] = locatie;
            }
        }

        let kleurWaarde = null;

        for (let [sensorType, waarde] of Object.entries(cartData.latestValues)) {
            if (!isLocationSensor(sensorType) && typeof waarde === 'number') {
                kleurWaarde = waarde;
                console.log(`🎨 Kleur sensor: ${sensorType} = ${kleurWaarde}`);
                break;
            }
        }

        if (kleurWaarde !== null && locatie !== null) {
            let thresholds = trackConfig.currentCart?.colorThresholds || [10, 30, 50];
            let kleur = getColorFromThreshold(kleurWaarde, thresholds);
            setSegmentColor(locatie, kleur);
            console.log(`🎨 Kleur voor segment ${locatie}: ${kleur}`);
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
// TRACK AANMAKEN
// ===========================================
function createTrack() {
    let container = document.getElementById('homeTrackContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!trackConfig.currentCart) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">⚠️ Geen carts gevonden. Ga naar de config pagina om er een aan te maken.</p>';
        return;
    }

    let cart = document.createElement('div');
    cart.className = 'cart';
    cart.id = trackConfig.currentCart.cartId.toString();
    container.appendChild(cart);

    let lading = document.createElement('div');
    lading.className = 'lading';
    cart.appendChild(lading);

    let track = document.createElement('div');
    track.className = 'track';
    container.appendChild(track);

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
// GRAFIEK - SENSOR SELECTIE (VERBETERD)
// ===========================================

let grafiek = null;

// Vul de dropdown met beschikbare sensoren
async function vulSensorDropdown() {
    let selector = document.getElementById('sensorSelect');
    if (!selector) return;

    try {
        let response = await fetch(API_URL + '/available-sensors');
        let result = await response.json();

        if (result.success && result.data.length > 0) {
            selector.innerHTML = '<option value="">-- Selecteer een sensor --</option>';

            // Sorteer op ESP ID en dan sensor type
            let sortedSensors = result.data.sort((a, b) => {
                if (a.id !== b.id) return a.id - b.id;
                return a.type.localeCompare(b.type);
            });

            for (let sensor of sortedSensors) {
                let option = document.createElement('option');
                option.value = `${sensor.id}|${sensor.type}`;
                option.textContent = `ESP${sensor.id} - ${sensor.type}`;
                selector.appendChild(option);
            }

            selector.disabled = false;
            console.log("✅ Dropdown gevuld met", result.data.length, "sensoren");
        } else {
            selector.innerHTML = '<option value="">Geen sensoren gevonden</option>';
            selector.disabled = true;
        }
    } catch (err) {
        console.error("❌ Dropdown vullen mislukt:", err);
        selector.innerHTML = '<option value="">Fout bij laden</option>';
    }
}

// Grafiek updaten op basis van geselecteerde sensor
async function updateGrafiek(espId, sensorType) {
    try {
        let response = await fetch(`${API_URL}/sensor-data/${espId}/${sensorType}`);
        let result = await response.json();

        if (result.success && result.data.length > 0) {
            let metingen = result.data;

            let labels = metingen.map(m => {
                let date = new Date(m.tijd);
                return date.toLocaleTimeString();
            });
            let waarden = metingen.map(m => m.waarde);

            if (grafiek) {
                grafiek.destroy();
            }

            let ctx = document.getElementById('grafiek').getContext('2d');
            grafiek = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `ESP${espId} - ${sensorType}`,
                        data: waarden,
                        borderColor: '#FA8112',
                        backgroundColor: 'rgba(250, 129, 18, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return `${context.dataset.label}: ${context.raw}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Waarde'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Tijd'
                            }
                        }
                    }
                }
            });
            console.log(`✅ Grafiek bijgewerkt: ESP${espId} - ${sensorType} (${metingen.length} metingen)`);
        } else {
            console.log("⚠️ Geen data voor deze sensor");
            if (grafiek) {
                grafiek.destroy();
                grafiek = null;
            }
            let ctx = document.getElementById('grafiek').getContext('2d');
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('Geen data beschikbaar voor deze sensor', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
    } catch (err) {
        console.error("❌ Grafiek update mislukt:", err);
        let ctx = document.getElementById('grafiek').getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText('Fout bij laden van data', ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
}

// Event listener voor dropdown
function initGrafiekSelector() {
    let selector = document.getElementById('sensorSelect');
    if (!selector) return;

    selector.addEventListener('change', async (e) => {
        let value = e.target.value;
        if (value && value !== '') {
            let [espId, sensorType] = value.split('|');
            await updateGrafiek(parseInt(espId), sensorType);
        } else {
            if (grafiek) {
                grafiek.destroy();
                grafiek = null;
            }
            let ctx = document.getElementById('grafiek').getContext('2d');
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    });
}

// Initialiseer grafiek
async function initGrafiek() {
    await vulSensorDropdown();
    initGrafiekSelector();
}

// ===========================================
// CONFIGURATIE PAGINA FUNCTIES
// ===========================================

async function toonCartsOverzicht() {
    let container = document.getElementById('cartsList');
    if (!container) return;

    let carts = await fetchCarts();

    if (carts.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">Geen carts gevonden. Klik op "+ Nieuwe Cart" om er een toe te voegen.</p>';
        return;
    }

    container.innerHTML = '';

    for (let cart of carts) {
        let cartCard = document.createElement('div');
        cartCard.style.cssText = 'border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #fafafa;';

        let espBadges = cart.espIds.map(id =>
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
        let response = await fetch(`http://localhost:5000/config/carts/${cartId}`, {
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
        let result = await response.json();
        return result.success;
    } catch (err) {
        console.error("Fout bij opslaan:", err);
        return false;
    }
}

async function deleteCart(cartId) {
    try {
        let response = await fetch(`http://localhost:5000/config/carts/${cartId}`, {
            method: 'DELETE'
        });
        let result = await response.json();
        return result.success;
    } catch (err) {
        console.error("Fout bij verwijderen:", err);
        return false;
    }
}

function maakCheckboxes(container, geselecteerdeIds) {
    container.innerHTML = '';

    for (let i = 1; i <= 7; i++) {
        let label = document.createElement('label');
        label.style.cssText = 'display: flex; align-items: center; gap: 5px; cursor: pointer; min-width: 70px;';

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = i;
        checkbox.checked = geselecteerdeIds.includes(i);

        let span = document.createElement('span');
        span.textContent = `ESP ${i}`;

        label.appendChild(checkbox);
        label.appendChild(span);
        container.appendChild(label);
    }
}

let huidigeEditCartId = null;

async function openModal(cartId = null) {
    let modal = document.getElementById('cartModal');
    let modalTitle = document.getElementById('modalTitle');
    let cartIdInput = document.getElementById('modalCartId');
    let espContainer = document.getElementById('modalEspCheckboxes');

    huidigeEditCartId = cartId;

    if (cartId) {
        modalTitle.textContent = `✏️ Cart ${cartId} bewerken`;
        cartIdInput.value = cartId;
        cartIdInput.disabled = true;

        let carts = await fetchCarts();
        let cart = carts.find(c => c.cartId === cartId);
        let geselecteerdeESPids = cart ? cart.espIds : [];
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
    let cartIdInput = document.getElementById('modalCartId');
    let espContainer = document.getElementById('modalEspCheckboxes');

    let cartId = parseInt(cartIdInput.value);

    if (isNaN(cartId) || cartId < 1) {
        alert('Voer een geldig Cart ID in (getal groter dan 0)');
        return;
    }

    let geselecteerdeESPids = [];
    let checkboxes = espContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (cb.checked) geselecteerdeESPids.push(parseInt(cb.value));
    });

    if (geselecteerdeESPids.length === 0) {
        alert('Selecteer minstens 1 ESP voor deze cart');
        return;
    }

    let success = await saveCart(cartId, geselecteerdeESPids);

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
        let success = await deleteCart(cartId);
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

    let nieuweBtn = document.getElementById('nieuweCartBtn');
    if (nieuweBtn) nieuweBtn.onclick = () => openModal();

    let opslaanBtn = document.getElementById('modalOpslaanBtn');
    if (opslaanBtn) opslaanBtn.onclick = opslaanUitModal;

    let annulerenBtn = document.getElementById('modalAnnulerenBtn');
    if (annulerenBtn) annulerenBtn.onclick = sluitModal;

    window.onclick = (event) => {
        let modal = document.getElementById('cartModal');
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
    initGrafiek();
    initConfigPagina();

    setInterval(haalData, 1000);

    let selector = document.getElementById('cartSelector');
    if (selector) {
        selector.addEventListener('change', (e) => {
            if (e.target.value) {
                switchCart(e.target.value);
            }
        });
    }
});