document.addEventListener('DOMContentLoaded', function () {
    // --- CONFIGURACIÓN ---
    // ¡¡¡IMPORTANTE!!! Pega aquí la URL de tu Google Sheet publicada como CSV.
    // (Archivo > Compartir > Publicar en la web > CSV)
    const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJ1KkaF4pZ-TzAUIUx_pQa97eKT6fp-T_5fIxevgrHUca-arFLQzYnxPY9jXM5Ow567TjX3NGYlyj/pub?gid=0&single=true&output=csv';
    const rutaKMZ = 'data/archivo1.kmz'; // Ruta a tu archivo KMZ

    // --- 1. INICIALIZACIÓN DEL MAPA ---
    const map = L.map('map').setView([-34.5, -64], 4); // Vista inicial centrada en Argentina

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // --- 2. CARGAR CAPAS DE DATOS ---
    const todasLasCapas = L.featureGroup().addTo(map); // Un grupo para meter TODO

    // a) Cargar el archivo KMZ
    const kmzLayer = omnivore.kmz(rutaKMZ)
        .on('ready', function() {
            console.log("KMZ cargado exitosamente.");
            this.eachLayer(layer => todasLasCapas.addLayer(layer)); // Añadir al grupo
            if (todasLasCapas.getLayers().length > 0) {
                 map.fitBounds(todasLasCapas.getBounds()).pad(0.1);
            }
        })
        .on('error', (e) => console.error("Error al cargar KMZ:", e));

    // b) Cargar datos del Google Sheet
    Papa.parse(googleSheetURL, {
        download: true,
        header: true,
        complete: function (results) {
            console.log("Google Sheet cargado exitosamente:", results.data);
            results.data.forEach(function (fila) {
                if (fila.Latitud && fila.Longitud && fila['Numero de orden']) {
                    const lat = parseFloat(fila.Latitud.replace(',', '.'));
                    const lon = parseFloat(fila.Longitud.replace(',', '.'));
                    
                    const popupContent = `
                        <b>Orden:</b> ${fila['Numero de orden']}<br>
                        <b>Expediente:</b> ${fila.Expediente || 'N/A'}<br>
                        <b>Coordenadas:</b> ${lat.toFixed(4)}, ${lon.toFixed(4)}
                    `;
                    
                    const marker = L.marker([lat, lon]).bindPopup(popupContent);
                    todasLasCapas.addLayer(marker); // Añadir al mismo grupo
                }
            });
            // Ajustar el zoom para que se vean TODAS las capas (KMZ + Puntos)
            if (todasLasCapas.getLayers().length > 0) {
                map.fitBounds(todasLasCapas.getBounds()).pad(0.1);
            }
        },
        error: (err) => console.error("Error al cargar Google Sheet:", err)
    });

    // --- 3. AÑADIR TODAS LAS HERRAMIENTAS ---

    // a) Herramienta de Medición
    new L.Control.Measure({
        position: 'topright',
        primaryLengthUnit: 'meters',
        secondaryLengthUnit: 'kilometers',
        primaryAreaUnit: 'sqmeters',
        localization: 'es'
    }).addTo(map);

    // b) Herramientas de Dibujo
    const drawnItems = new L.FeatureGroup().addTo(map);
    map.addControl(new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: { polygon: true, polyline: true, rectangle: true, circle: true, marker: true, circlemarker: false }
    }));
    map.on(L.Draw.Event.CREATED, (event) => drawnItems.addLayer(event.layer));

    // c) Herramienta de Rutas
    L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        language: 'es',
        geocoder: L.Control.Geocoder.nominatim()
    }).addTo(map);
});