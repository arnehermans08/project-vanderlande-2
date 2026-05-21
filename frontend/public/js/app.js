console.log("📱 Website geladen met Track Visual!");

const API_URL = 'http://localHost:5000';

// ===========================================
// KARRETJE VERPLAATSEN
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

    let left = 12.5 + (25 * (segmentNumber - 1)) - 4;
    cart.style.left = `${left}%`;
    cart.dataset.segment = segmentNumber;

    console.log(`karretje ${cartId} naar segment ${segmentNumber}`);
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
// KLEUR BEPALEN (met thresholds 1,2,3)
// ===========================================
function bepaalKleur(sensorType, waarde) {
    if (!trackConfig || !trackConfig.sensorThresholds || !trackConfig.colors) {
        return 'green';
    }

    let thresholds = trackConfig.sensorThresholds[sensorType];
    if (!thresholds) return trackConfig.colors[0];

    if (waarde >= thresholds[3]) {
        return trackConfig.colors[2];
    } else if (waarde >= thresholds[2]) {
        return trackConfig.colors[1];
    } else {
        return trackConfig.colors[0];
    }
}

// ===========================================
// LOCATIE BEPALEN VANUIT HUSKYLENS METING
// ===========================================
function getLocatie(meting) {
    if (meting.type === "huskylensLocatie") {
        let delen = String(meting.waarde).split(".");
        if (delen.length >= 3) {
            return parseInt(delen[2]);
        }
    }
    return null;
}

// ===========================================
// DATA VERWERKEN - ALLEEN DE NIEUWSTE METING
// ===========================================
async function haalData() {
    try {
        const response = await fetch(API_URL + '/realtimedata');
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            let nieuwste = data.data[0];

            console.log("Nieuwste meting:", nieuwste);

            toonData(data.data);

            let locatie = getLocatie(nieuwste);
            if (locatie !== null) {
                moveCartTo(nieuwste.id, locatie);
                let kleur = bepaalKleur(nieuwste.type, nieuwste.waarde);
                setSegmentColor(locatie, kleur);
            }

        } else {
            document.getElementById('realtime').innerHTML = '<p style="color:red">Geen data</p>';
        }
    } catch (fout) {
        document.getElementById('realtime').innerHTML = '<p style="color:red">Kan niet verbinden</p>';
        console.error("Fout:", fout);
    }
}

// ===========================================
// TABEL MAKEN (optioneel, maar handig voor overzicht)
// ===========================================
function toonData(metingen) {
    let html = '<table><tr><th>Time</th><th>Type</th><th>Value</th></tr>';

    for (let m of metingen) {
        let tijd = new Date(m.tijd).toLocaleTimeString();
        html += `<tr>
        <td>${tijd}</td>
        <td>${m.type}</td>
        <td>${m.waarde}</td>
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

    let cart = document.createElement('div');
    cart.className = 'cart';
    cart.id = '1';
    container.appendChild(cart);

    let lading = document.createElement('div');
    lading.className = 'lading';
    cart.appendChild(lading);

    let track = document.createElement('div');
    track.className = 'track';
    container.appendChild(track);

    for (let i = 1; i <= 4; i++) {
        let segment = document.createElement('div');
        segment.className = 'track-segment';
        segment.id = 'segment' + i;
        segment.innerHTML = 'Segment ' + i;
        track.appendChild(segment);
    }

    console.log("Track klaar - karretje heeft id='1'");

    setTimeout(() => moveCartTo(1, 1), 200);
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
// SHOW PAGE FUNCTIE
// ===========================================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('visible'));
    document.getElementById(pageId).classList.add('visible');
}

// ===========================================
// WINDOW RESIZE
// ===========================================
window.addEventListener('resize', () => {
    let cart = document.getElementById('1');
    if (cart && cart.dataset.segment) {
        moveCartTo(1, parseInt(cart.dataset.segment));
    }
});

// ===========================================
// SCROLL FUNCTIE - MET EXTRA RUIMTE BOVEN
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
// STARTUP
// ===========================================
window.addEventListener('DOMContentLoaded', () => {
    createTrack();
    haalData();
    maakGrafiek();
    setInterval(haalData, 1000);
});