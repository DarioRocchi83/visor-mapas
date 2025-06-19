// Función para cargar un script. Es una herramienta interna.
function cargarScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Función principal que se ejecutará solo cuando todo esté cargado
function construirMapa() {
    console.log("Todas las librerías cargadas. Construyendo el mapa...");

    // --- CONFIGURACIÓN ---
    const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJ1KkaF4pZ-TzAUIUx_pQa97eKT6fp-T_5fIxevgrHUca-arFLQzYnxPY9jXM5Ow567TjX3NGYlyj/pub?gid=0&single=true&output=csv';
    const rutaKMZ = 'data/archivo1.kmz';

    // --- MAPA BASE ---
    const map = L.map('map').setView([-34.5, -64], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const capasParaAjuste = L.featureGroup().addTo(map);

    // --- CARGAR KMZ ---
    omnivore.kmz(rutaKMZ)
        .on('ready', function() {
            capasParaAjuste.addLayer(this);
            map.fitBounds(capasParaAjuste.getBounds());
            console.log("ÉXITO: Capa KMZ cargada.");
        })
        .on('error', e => console.error("ERROR AL CARGAR KMZ:", e))
        .addTo(map);

    // --- CARGAR GOOGLE SHEET ---
    Papa.parse(googleSheetURL, {
        download: true, header: true,
        complete: function (results) {
            results.data.forEach(function (fila) {
                if (fila.Latitud && fila.Longitud) {
                    const lat = parseFloat(fila.Latitud.replace(',', '.'));
                    const lon = parseFloat(fila.Longitud.replace(',', '.'));
                    const marker = L.marker([lat, lon]).bindPopup(`<b>Orden:</b> ${fila['Numero de orden']}`);
                    capasParaAjuste.addLayer(marker);
                }
            });
            if (capasParaAjuste.getLayers().length > 0) map.fitBounds(capasParaAjuste.getBounds());
            console.log("ÉXITO: Puntos de Google Sheet cargados.");
        }
    });

    // --- HERRAMIENTAS ---
    new L.Control.Measure({ position: 'topright', localization: 'es' }).addTo(map);
    new L.Control.Draw({ edit: { featureGroup: new L.FeatureGroup().addTo(map) } }).addTo(map);
    L.Routing.control({ language: 'es', geocoder: L.Control.Geocoder.nominatim() }).addTo(map);
    console.log("Todas las herramientas añadidas.");
}

// --- ARRANQUE ---
// Esto se ejecuta en cuanto la página empieza a cargar.
// Carga todas las librerías en orden y solo al final llama a construirMapa().
async function iniciar() {
    try {
        console.log("Iniciando carga de librerías...");
        await cargarScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
        await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js");
        await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet-omnivore/0.3.4/leaflet-omnivore.min.js");
        await cargarScript("https://unpkg.com/leaflet-measure/dist/leaflet-measure.js");
        await cargarScript("https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js");
        await cargarScript("https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js");
        await cargarScript("https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js");
        
        // Una vez que todas se han cargado, llamamos a la función principal.
        construirMapa();

    } catch (error) {
        console.error("FALLO CRÍTICO: Una librería no se pudo cargar. El mapa no puede iniciar.", error);
        document.body.innerHTML = "<h1>Error: No se pudieron cargar los componentes del mapa. Revisa la consola (F12).</h1>";
    }
}

// Lanzamos el proceso.
iniciar();