// --- 1. AUTENTICACIÓN SIMPLE ---
// ¡CAMBIA 'tu_contraseña_secreta' por tu contraseña real!
const passwordCorrecta = '1234'; 
let password = prompt('Por favor, introduce la contraseña para acceder al visor:');

if (password !== passwordCorrecta) {
    alert('Contraseña incorrecta. No puedes acceder al contenido.');
    // Bloquea el contenido de la página
    document.body.innerHTML = '<h1 style="text-align: center; margin-top: 50px;">Acceso Denegado</h1>';
} else {
    // Si la contraseña es correcta, ejecuta todo el código del mapa.
    iniciarMapa();
}

function iniciarMapa() {
    // --- 2. INICIALIZACIÓN DEL MAPA ---
    // Centra el mapa en una ubicación inicial (ej: Buenos Aires, Argentina)
    const map = L.map('map').setView([-34.60, -58.38], 13);

    // Añade la capa de mapa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // --- 3. CARGA DE CAPAS ---

    // Objeto para guardar las capas y usarlas en el control
    const capas = {};

    // a) Cargar un archivo KMZ estático desde la carpeta /data
    //    Añade tantos como necesites, cambiando 'archivo1.kmz' y el nombre de la capa.
    const capaKMZ1 = omnivore.kmz('data/archivo1.kmz');
    capas['Mi Primer KMZ'] = capaKMZ1; // 'Mi Primer KMZ' es el nombre que aparecerá en el control

    // b) Cargar datos desde Google Sheets
    //    ¡Pega aquí la URL del CSV que copiaste de Google Sheets!
    const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJ1KkaF4pZ-TzAUIUx_pQa97eKT6fp-T_5fIxevgrHUca-arFLQzYnxPY9jXM5Ow567TjX3NGYlyj/pub?gid=0&single=true&output=csv';
    
    // Creamos un grupo de capas para los marcadores de la hoja de cálculo
    const capaGoogleSheet = L.layerGroup();
    capas['Expedientes (Drive)'] = capaGoogleSheet;

    fetch(googleSheetURL)
        .then(response => response.text())
        .then(csvText => {
            // Parsear el CSV
            const filas = csvText.split('\n').slice(1); // .slice(1) para saltar la cabecera
            filas.forEach(fila => {
                const columnas = fila.split(',');
                if (columnas.length >= 4) {
                    const numeroOrden = columnas[0];
                    const lat = parseFloat(columnas[1]);
                    const lon = parseFloat(columnas[2]);
                    const expediente = columnas[3];

                    if (!isNaN(lat) && !isNaN(lon)) {
                        const marker = L.marker([lat, lon]);
                        marker.bindPopup(`<b>Expediente:</b> ${expediente}<br><b>N° Orden:</b> ${numeroOrden}`);
                        capaGoogleSheet.addLayer(marker);
                    }
                }
            });
        })
        .catch(error => console.error('Error al cargar datos de Google Sheets:', error));

    // --- 4. AÑADIR HERRAMIENTAS ---

    // a) Medir distancia y área
    const measureControl = new L.Control.Measure({
        primaryLengthUnit: 'meters',
        secondaryLengthUnit: 'kilometers',
        primaryAreaUnit: 'sqmeters',
        secondaryAreaUnit: 'hectares',
        activeColor: '#db4a39',
        completedColor: '#9d2d20',
        localization: 'es'
    });
    measureControl.addTo(map);

    // b) Dibujar (lo añadimos pero no directamente al mapa, sino al control de capas)
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
        draw: {
            polyline: true,
            polygon: true,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false
        }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, function (event) {
        const layer = event.layer;
        drawnItems.addLayer(layer);
    });
    
    // c) Calcular ruta
    L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        lineOptions: {
            styles: [{color: 'blue', opacity: 0.8, weight: 5}]
        },
        language: 'es'
    }).addTo(map);

    // --- 5. CONTROL DE CAPAS ---
    // Añade el control para activar/desactivar las capas que cargamos
    L.control.layers(null, capas).addTo(map);

    // Añadimos las capas al mapa por defecto
    capaKMZ1.addTo(map);
    capaGoogleSheet.addTo(map);
}