// js/main.js

document.addEventListener('DOMContentLoaded', function () {
    // 1. URL de tu hoja de cálculo de Google publicada como CSV
    // ¡¡¡IMPORTANTE!!! Pega aquí la URL que copiaste en el Paso 1.
    const googleSheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRHJ1KkaF4pZ-TzAUIUx_pQa97eKT6fp-T_5fIxevgrHUca-arFLQzYnxPY9jXM5Ow567TjX3NGYlyj/pub?gid=0&single=true&output=csv';

    // 2. Inicializar el mapa
    const map = L.map('map').setView([40.416775, -3.703790], 6); // Centrado en España

    // 3. Añadir capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 4. Cargar y mostrar los datos del Google Sheet usando PapaParse
    Papa.parse(googleSheetURL, {
        download: true, // Le decimos que descargue el archivo de la URL
        header: true,   // Le decimos que la primera fila es el encabezado (Numero de orden, Latitud, etc.)
        complete: function (results) {
            // Esta función se ejecuta cuando los datos se han cargado y procesado
            console.log("Datos cargados:", results.data); // Para que veas en la consola (F12) que todo va bien

            // Creamos una capa para agrupar todos los marcadores
            const markers = L.featureGroup().addTo(map);

            results.data.forEach(function (fila) {
                // Verificamos que la fila tenga latitud y longitud
                if (fila.Latitud && fila.Longitud) {
                    const lat = parseFloat(fila.Latitud.replace(',', '.')); // Convierte " -53,62 " a -53.62
                    const lon = parseFloat(fila.Longitud.replace(',', '.')); // Convierte " -48,32 " a -48.32

                    // Creamos el marcador
                    const marker = L.marker([lat, lon]);

                    // Creamos el contenido del popup
                    const popupContent = `
                        <b>Orden:</b> ${fila['Numero de orden']}<br>
                        <b>Expediente:</b> ${fila.Expediente}
                    `;
                    marker.bindPopup(popupContent);

                    // Añadimos el marcador al grupo
                    markers.addLayer(marker);
                }
            });

            // Hacemos zoom para que todos los marcadores se vean en el mapa
            if (markers.getLayers().length > 0) {
                map.fitBounds(markers.getBounds()).pad(0.1); // pad(0.1) añade un pequeño margen
            }
        },
        error: function(err) {
            console.error("Error al cargar o procesar los datos:", err);
            alert("No se pudieron cargar los datos de la hoja de cálculo. Revisa la URL y que esté bien publicada.");
        }
    });
});