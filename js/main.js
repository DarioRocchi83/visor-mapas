document.addEventListener('DOMContentLoaded', function () {
    // --- CONFIGURACIÓN ---
    // ¡¡¡IMPORTANTE!!! Pega aquí la URL de tu Google Sheet publicada como CSV.
    const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJ1KkaF4pZ-TzAUIUx_pQa97eKT6fp-T_5fIxevgrHUca-arFLQzYnxPY9jXM5Ow567TjX3NGYlyj/pub?gid=0&single=true&output=csv';
    const rutaKMZ = 'data/archivo1.kmz'; // Asegúrate que tu archivo se llama así

    // --- MAPA BASE ---
    const map = L.map('map').setView([-34.5, -64], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const capasParaAjuste = L.featureGroup(); // Grupo para hacer zoom a los datos

    // --- CARGAR KMZ ---
    const capaKmz = omnivore.kmz(rutaKMZ)
        .on('ready', function() {
            capasParaAjuste.addLayer(this);
            map.fitBounds(capasParaAjuste.getBounds());
            console.log("ÉXITO: Capa KMZ cargada.");
        })
        .on('error', function(e) {
            console.error("ERROR AL CARGAR KMZ: El archivo no se encontró o es inválido.", e);
        })
        .addTo(map);

    // --- CARGAR GOOGLE SHEET ---
    Papa.parse(googleSheetURL, {
        download: true,
        header: true,
        complete: function (results) {
            results.data.forEach(function (fila) {
                if (fila.Latitud && fila.Longitud) {
                    const lat = parseFloat(fila.Latitud.replace(',', '.'));
                    const lon = parseFloat(fila.Longitud.replace(',', '.'));
                    const marker = L.marker([lat, lon]).bindPopup(`<b>Orden:</b> ${fila['Numero de orden']}`);
                    capasParaAjuste.addLayer(marker);
                }
            });
            map.fitBounds(capasParaAjuste.getBounds());
            console.log("ÉXITO: Puntos de Google Sheet cargados.");
        }
    });

    // --- HERRAMIENTAS ---
    new L.Control.Measure({ position: 'topright', localization: 'es' }).addTo(map);
    new L.Control.Draw({ edit: { featureGroup: new L.FeatureGroup().addTo(map) } }).addTo(map);
    L.Routing.control({ language: 'es', geocoder: L.Control.Geocoder.nominatim() }).addTo(map);
});