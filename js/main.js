document.addEventListener('DOMContentLoaded', function () {
    console.log("Página cargada. Iniciando script main.js...");

    // --- CONFIGURACIÓN ---
    const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJ1KkaF4pZ-TzAUIUx_pQa97eKT6fp-T_5fIxevgrHUca-arFLQzYnxPY9jXM5Ow567TjX3NGYlyj/pub?gid=0&single=true&output=csv';
    const rutaKMZ = 'data/archivo1.kmz';

    // --- 1. INICIALIZACIÓN DEL MAPA ---
    try {
        const map = L.map('map').setView([-34.5, -64], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        console.log("Mapa base inicializado correctamente.");

        // --- 2. CARGAR CAPAS DE DATOS ---
        const todasLasCapas = L.featureGroup().addTo(map);

        // a) Cargar el archivo KMZ
        try {
            console.log("Intentando cargar KMZ desde:", rutaKMZ);
            const kmzLayer = omnivore.kmz(rutaKMZ)
                .on('ready', function() {
                    console.log("ÉXITO: KMZ cargado y listo.");
                    this.eachLayer(layer => todasLasCapas.addLayer(layer));
                    if (todasLasCapas.getLayers().length > 0) {
                        map.fitBounds(todasLasCapas.getBounds()).pad(0.1);
                    }
                })
                .on('error', (e) => console.error("FALLO CARGANDO KMZ:", e));
        } catch (error) {
            console.error("ERROR CRÍTICO AL INICIAR OMNIVORE (KMZ):", error);
        }

        // b) Cargar datos del Google Sheet
        try {
            console.log("Intentando cargar datos de Google Sheet...");
            Papa.parse(googleSheetURL, {
                download: true,
                header: true,
                complete: function (results) {
                    console.log("ÉXITO: Google Sheet procesado.");
                    results.data.forEach(function (fila) {
                        if (fila.Latitud && fila.Longitud && fila['Numero de orden']) {
                            const lat = parseFloat(fila.Latitud.replace(',', '.'));
                            const lon = parseFloat(fila.Longitud.replace(',', '.'));
                            const marker = L.marker([lat, lon]).bindPopup(`<b>Orden:</b> ${fila['Numero de orden']}`);
                            todasLasCapas.addLayer(marker);
                        }
                    });
                    if (todasLasCapas.getLayers().length > 0) {
                        map.fitBounds(todasLasCapas.getBounds()).pad(0.1);
                        console.log("Mapa ajustado a todas las capas.");
                    }
                },
                error: (err) => console.error("FALLO CARGANDO GOOGLE SHEET:", err)
            });
        } catch (error) {
            console.error("ERROR CRÍTICO AL INICIAR PAPAPARSE (Google Sheet):", error);
        }

        // --- 3. AÑADIR TODAS LAS HERRAMIENTAS ---

        // a) Herramienta de Medición
        try {
            new L.Control.Measure({ position: 'topright', primaryLengthUnit: 'meters', localization: 'es' }).addTo(map);
            console.log("Herramienta de Medición añadida.");
        } catch (error) {
            console.error("FALLO al añadir herramienta de Medición:", error);
        }

        // b) Herramientas de Dibujo
        try {
            const drawnItems = new L.FeatureGroup().addTo(map);
            new L.Control.Draw({ edit: { featureGroup: drawnItems } }).addTo(map);
            map.on(L.Draw.Event.CREATED, (event) => drawnItems.addLayer(event.layer));
            console.log("Herramienta de Dibujo añadida.");
        } catch (error) {
            console.error("FALLO al añadir herramienta de Dibujo:", error);
        }

        // c) Herramienta de Rutas
        try {
            L.Routing.control({ waypoints: [], language: 'es', geocoder: L.Control.Geocoder.nominatim() }).addTo(map);
            console.log("Herramienta de Rutas añadida.");
        } catch (error) {
            console.error("FALLO al añadir herramienta de Rutas:", error);
        }

    } catch (error) {
        console.error("ERROR CRÍTICO: No se pudo inicializar el mapa base de Leaflet.", error);
        alert("Hubo un error fatal al crear el mapa. Revisa la consola (F12).");
    }
});