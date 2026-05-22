## API BE ports: 
  - API DB: 8080

## DB ports:
  - DB: 27017
  
## Webserver: 3000

## DB naam: dbVdl

## API FE ports: 
  - API FE: 5000

## API-Fe-endpoints: 
  - /realtimedata
  - /grafiekendata

<br>

<br>

<br>



# 🏗️ Project Vanderlanden - Architectuuroverzicht

<p align="center">
  <img src="https://img.shields.io/badge/DataInput-ESP32-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/backend-Node.js-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/database-MongoDB-darkgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/containers-Docker-2496ED?style=for-the-badge" />
</p>

## 📡 Volledige Dataflow: Van Sensor tot Scherm

```mermaid
flowchart TB
    subgraph SENSOR [🔄 Sensorlaag]
        style SENSOR color:#000000,font-weight:bold
        A[("📊 Sensor<br/>(meet data)")] --> B[("📡 Zender ESP<br/>(verstuurt data)")]
        B -- "RF-signaal" --> C[("📡 Ontvanger ESP<br/>(via USB)")]
    end

    subgraph PI [🥧 Raspberry Pi - Backend]
        style PI color:#000000,font-weight:bold
        D["📟 serialHandler.js<br/>(leest seriële poort)"] --> E["⚙️ API-BE<br/>(poort 8080)<br/>data ontvangen & insert"]
        E --> F[("💾 MongoDB<br/>(poort 27017)<br/>dbVdl")]
        F --> G["🔌 API-FE<br/>(poort 5000)<br/>endpoints voor frontend"]
    end

    subgraph WEB [🌐 Webserver Laag]
        style WEB color:#000000,font-weight:bold
        H["🚀 Node.js Webserver<br/>(poort 3000)<br/>server.js"] --> I["📁 Statische bestanden<br/>• index.html<br/>• css/style.css<br/>• js/app.js"]
    end

    subgraph CLIENT [🖥️ Browser - Client]
        style CLIENT color:#000000,font-weight:bold
        J["📄 index.html"] --> K["⚡ app.js"]
        K --> L["📈 Data visualisatie<br/>• Realtime view<br/>• Grafieken"]
    end

    C -- "USB (JSON)" --> D
    G -- "JSON data" --> K
    K -- "fetch()" --> G
    I -- "geserveerd aan" --> J

    style SENSOR fill:#ffe6e6,stroke:#ff4d4d,stroke-width:2px
    style PI fill:#e6f3ff,stroke:#0066cc,stroke-width:2px
    style WEB fill:#e6ffe6,stroke:#00cc00,stroke-width:2px
    style CLIENT fill:#fff0e6,stroke:#ff9933,stroke-width:2px



