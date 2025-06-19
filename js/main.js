// Función para cargar un script y esperar a que esté listo
function cargarScript(url) {
    return new Promise(function (resolve, reject) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve; // Se ejecuta si el script se carga bien
        script.onerror = reject; // Se ejecuta si hay un error
        document.head.appendChild(script);
    });
}

// Función principal que construye el mapa
function inicializarMapa() {
    // --- CONFIGURACIÓN ---
    const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJ1KkaF4pZ-TzAUIUx_pQa97eKT6fp-T_5fIxevgrHUca-arFLQzYnxPY9jXM5Ow567TjX3NGYlyj/pub?gid=0&single=true&output=csv';
    const rutaKMZ = 'data/archivo1.kmz';

    // --- MAPA BASE ---
    const map = L.map('map').setView([-34.5, -64], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const capasParaAjuste = L.featureGroup();

    // --- CARGAR KMZ ---
    // ESTA ES LA PARTE IMPORTANTE: AHORA OMNIVORE ESTÁ DEFINIDO
    try {
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
    } catch(e) {
        console.error("FALLO CRÍTICO EN OMNIVORE:", e);
    }

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
            if (capasParaAjuste.getLayers().length > 0) {
                 map.fitBounds(capasParaAjuste.getBounds());
            }
            console.log("ÉXITO: Puntos de Google Sheet cargados.");
        }
    });

    // --- HERRAMIENTAS ---
    new L.Control.Measure({ position: 'topright', localization: 'es' }).addTo(map);
    new L.Control.Draw({ edit: { featureGroup: new L.FeatureGroup().addTo(map) } }).addTo(map);
    L.Routing.control({ language: 'es', geocoder: L.Control.Geocoder.nominatim() }).addTo(map);
}

// --- ARRANQUE DE LA APLICACIÓN ---
// Primero nos aseguramos de que TODAS las librerías críticas estén cargadas
// antes de intentar usarlas.
Promise.all([
    cargarScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"),
    cargarScript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js"),
    cargarScript("https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"),
    cargarScript("https://unpkg.com/leaflet-measure/dist/leaflet-measure.js"),
    cargarScript("https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"),
    cargarScript("https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"),
    // Omnivore es la última, ya que parece ser la que da problemas
    cargarScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet-omnivore/0.3.4/leaflet-omnivore.min.js") 
])
.then(() => {
    console.log("¡Todas las librerías han sido cargadas exitosamente!");
    // Solo cuando todas las promesas se cumplen, inicializamos el mapa
    inicializarMapa();
})
.catch(error => {
    console.error("Una de las librerías principales no pudo cargarse. El mapa no puede iniciar.", error);
    alert("Error crítico: no se pudo cargar una librería esencial. Revisa la consola (F12).");
});