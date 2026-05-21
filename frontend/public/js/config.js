// config.js
let trackConfig = {
    segmentCount: 4,
    cartCount: 1,
    segmentNames: ["appel"],
    colors: ['#2E7D32', '#ffb339', '#C62828'],  // index 0=green, 1=orange, 2=red
    
    sensorThresholds: {
        temp: { 
            1: 0,    // waarde >=0  → kleur op index 0 (green)
            2: 60,   // waarde >=60 → kleur op index 1 (orange)
            3: 80    // waarde >=80 → kleur op index 2 (red)
        }
    }
};