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
    // Asegúrate de que esta URL es la correcta y que la hoja está publicada como CSV
    const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJ1KkaF4pZ-TzAUIUx_pQa97eKT6fp-T_5fIxevgrHUca-arFLQzYnxPY9jXM5Ow567TjX3NGYlyj/pub?gid=0&single=true&output=csv';
    // Asegúrate de que este archivo existe en tu GitHub en esa ruta exacta
    const rutaKMZ = 'data/archivo1.kmz';

    // --- MAPA BASE ---
    const map = L.map('map').setView([-34.5, -64], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const capasParaAjuste = L.featureGroup().addTo(map);

    // --- CARGAR KMZ CON MANEJO DE ERRORES MEJORADO ---
    omnivore.kmz(rutaKMZ)
        .on('ready', function() {
            capasParaAjuste.addLayer(this);
            if (capasParaAjuste.getLayers().length > 0) map.fitBounds(capasParaAjuste.getBounds());
            console.log("ÉXITO: Capa KMZ cargada.");
        })
        .on('error', function(e) {
            console.error("ERROR AL CARGAR KMZ:", e);
            alert("ALERTA: No se pudo cargar el archivo KMZ.\n\nCausas posibles:\n1. El archivo 'data/archivo1.kmz' no existe en tu repositorio de GitHub.\n2. El nombre del archivo o la carpeta está mal escrito.\n3. El archivo KMZ está corrupto.");
        })
        .addTo(map);

    // --- CARGAR GOOGLE SHEET CON MANEJO DE ERRORES MEJORADO ---
    Papa.parse(googleSheetURL, {
        download: true, header: true,
        complete: function (results) {
            if (!results.data || results.data.length === 0) {
                 alert("ALERTA: Se conectó al Google Sheet, pero está vacío o el formato es incorrecto. Revisa que tenga datos y esté publicado como CSV.");
                 return;
            }
            results.data.forEach(function (fila) {
                if (fila.Latitud && fila.Longitud) {
                    const lat = parseFloat(fila.Latitud.replace(',', '.'));
                    const lon = parseFloat(fila.Longitud.replace(',', '.'));
                    
                    // Popup mejorado con más datos
                    const popupContent = `<b>Orden:</b> ${fila['Numero de orden'] || 'N/A'}<br><b>Expediente:</b> ${fila.Expediente || 'N/A'}`;
                    const marker = L.marker([lat, lon]).bindPopup(popupContent);
                    capasParaAjuste.addLayer(marker);
                }
            });
            if (capasParaAjuste.getLayers().length > 0) map.fitBounds(capasParaAjuste.getBounds());
            console.log("ÉXITO: Puntos de Google Sheet cargados.");
        },
        error: function(err) {
            console.error("ERROR AL CARGAR GOOGLE SHEET:", err);
            alert("ALERTA: No se pudo acceder a la URL del Google Sheet.\n\nCausas posibles:\n1. La URL está mal copiada.\n2. La hoja de cálculo ya no está 'Publicada en la web'.");
        }
    });

    // --- HERRAMIENTAS ---
    new L.Control.Measure({ position: 'topright', localization: 'es' }).addTo(map);
    new L.Control.Draw({ edit: { featureGroup: new L.FeatureGroup().addTo(map) } }).addTo(map);
    L.Routing.control({ language: 'es', geocoder: L.Control.Geocoder.nominatim() }).addTo(map);
    console.log("Todas las herramientas añadidas.");
}

// --- ARRANQUE ---
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
        construirMapa();
    } catch (error) {
        console.error("FALLO CRÍTICO: Una librería no se pudo cargar.", error);
        document.body.innerHTML = "<h1>Error: No se pudieron cargar los componentes del mapa. Revisa la consola (F12).</h1>";
    }
}

iniciar();