mapboxgl.accessToken = 'pk.eyJ1IjoicGlhbm9tYW4yNCIsImEiOiJjbHhjYjRnNHQwOWttMnFvbjlzc2Z2bXkwIn0.mOh5fw5vP2zvcN2Go09w8A';

let defaultZoom;
function updateDefaultZoom() {
    if (window.innerWidth > 1024) {
        defaultZoom = 14;
    } else if (window.innerWidth > 768) {
        defaultZoom = 13.8;
    } else if (window.innerWidth > 600) {
        defaultZoom = 13.5;
    } else {
        defaultZoom = 13.1;
    }
}
updateDefaultZoom()
window.addEventListener('resize', updateDefaultZoom);

const defaultCenter = [-71.585, 43.19]

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    center: defaultCenter, // default center [lng, lat]
    zoom: defaultZoom, // default zoom
    pitch: 0,
    bearing: 0
});

let path;
if (window.location.protocol === 'file:') {
    console.log('Running on local machine');
    path = "http://localhost:8000/"
    // You can also set specific variables or execute code meant for local development here
} else {
    path = "https://pianoman244.github.io/map-stpauls/"
    console.log('Running on the web');
    // You can also set specific variables or execute code meant for web deployment here
}

// Function to update the layer visibility based on zoom level
function updateLayerVisibility() {
    var zoom = map.getZoom();
    if (15 > zoom && zoom >= 13.5) {
        map.setPaintProperty('trees-layer', 'circle-opacity', 1, {
            'duration': 500
        });
        map.setPaintProperty('trees-layer', 'circle-stroke-width', 1, {
            'duration': 500
        });
    } else if (zoom < 13.5) {
        map.setPaintProperty('trees-layer', 'circle-opacity', 0, {
            'duration': 500
        });
        map.setPaintProperty('trees-layer', 'circle-stroke-width', 0, {
            'duration': 500
        });
    }
}

/*
// Update layer visibility on zoom events
map.on('zoom', function () {
    updateLayerVisibility();
});
*/

fetch(path + 'admissions_clone/maps/data/trails_demo.geojson')
    .then(response => response.json())
    .then(data => {
        // Add the trail data as a source
        map.on('load', () => {
            map.addSource('trails', {
                type: 'geojson',
                data: data // Use the fetched GeoJSON data
            });

            map.addLayer({
                'id': 'trail-layer',
                'type': 'line',
                'source': 'trails',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': [
                        'case',
                        ['any', ['==', ['get', 'blaze'], 'none'], ['!', ['has', 'name']]], '#4F85F6', // Set color manually for "none"
                        ['has', 'blaze'], ['get', 'blaze'], // Use the attribute value if it exists
                        '#004200' // Default color for features without the tag
                    ],
                    'line-width': [
                        'case',
                        ['any', ['==', ['get', 'informal'], 'yes'], ['!', ['has', 'name']]],
                        2, // Line width for informal trails or when 'name' is not present
                        4  // Line width for formal trails
                    ],
                    'line-dasharray': [
                        'case',
                        ['any', ['==', ['get', 'informal'], 'yes'], ['!', ['has', 'name']]],
                        [2, 2], // Dotted line pattern for informal trails
                        [1, 0]  // Solid line pattern for formal trails
                    ]
                },
                'filter': ['all',
                    ['!=', ['get', 'trail_type'], 'streamed']
                ]
            });

            map.addSource('points', {
                'type': 'geojson',
                'data': path + 'utility/tree_extractions/all_trees.geojson'
            });

            // Define the colors for each zone
            const colorMapping = {
                'A': 'rgba(191, 105, 108, 1)', // Red
                'B': 'rgba(111, 194, 193, 1)', // Cyan
                'C': 'rgba(109, 136, 108, 1)', // Dark green
                'D': 'rgba(222, 195, 108, 1)', // Yellow
                'E': 'rgba(110, 166, 108, 1)', // Light green
                'F': 'rgba(186, 154, 154, 1)', // Gray
                'G': 'rgba(108, 134, 163, 1)', // Blue
                'H': 'rgba(159, 160, 134, 1)'  // Tan
            };

            // Function to find the first label layer
            function findFirstLabelLayer(layers) {
                for (let i = 0; i < layers.length; i++) {
                    if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                        return layers[i].id;
                    }
                }
                return null;
            }

            const minzoom_trees = 13.5;
            // Add a circle layer
            map.addLayer({
                'id': 'trees-layer',
                'type': 'circle',
                'source': 'points',
                'paint': {
                    // Circle radius changes with zoom level
                    /*
                    'circle-radius': [
                        'interpolate',
                        ['exponential', 2],
                        ['zoom'],
                        15, ['^', ['coalesce', ['to-number', ['get', 'DBH (inches)']], 8], 0.2],
                        22, ['*', ['^', ['coalesce', ['to-number', ['get', 'DBH (inches)']], 8], 0.2], 20]
                    ],*/
                    'circle-radius': [
                        'interpolate',
                        ['exponential', 2],
                        ['zoom'],
                        15, ['*', 1, ['^', ['to-number', ['get', 'DBH (inches)'], 8], 0.3]],
                        22, ['*', 20, ['^', ['to-number', ['get', 'DBH (inches)'], 8], 0.3]]
                    ],
                    // Define the circle color based on the first character of Tree ID
                    'circle-color': [
                        'match',
                        ['slice', ['get', 'Tree ID'], 0, 1],
                        'A', colorMapping['A'],
                        'B', colorMapping['B'],
                        'C', colorMapping['C'],
                        'D', colorMapping['D'],
                        'E', colorMapping['E'],
                        'F', colorMapping['F'],
                        'G', colorMapping['G'],
                        'H', colorMapping['H'],
                        /* default */ '#FFFFFF' // Default to white if none match
                    ],
                    'circle-pitch-scale': 'map', // Scale circles with the map
                    'circle-pitch-alignment': 'map', // Align circles with the map pitch
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#000000'
                }
            }, findFirstLabelLayer(map.getStyle().layers));

            // Create a legend
            const legend = document.getElementById('legend');
            const trails = {};


            data.features.forEach((feature, index) => {
                console.log("building legend");
                const blaze = feature.properties.blaze || '#006400';
                const name = feature.properties.name || 'Unknown';
                const letter = String.fromCharCode(65 + index); // Generate letters A, B, C, etc.

                if (feature.properties.name && feature.properties.informal !== 'yes') {
                    if (!trails[name]) {
                        trails[name] = blaze;

                        const item = document.createElement('div');
                        item.className = 'legend-item';
                        item.dataset.name = name;
                        item.innerHTML = `
                <div class="legend-color" style="color: ${blaze};">
                    <!-- <span>${letter}</span> -->
                </div>
                <div>${name}</div>
            `;
                        legend.appendChild(item);
                    }
                }
            });

            map.addLayer({
                'id': 'trail-labels',
                'type': 'symbol',
                'source': 'trails',
                'layout': {
                    'symbol-placement': 'line',
                    'text-field': ['get', 'name'], // Assuming 'label' is the property containing the letter
                    'text-size': 12,
                    'text-font': ['Roboto Bold'], // Use the desired font
                    'text-keep-upright': true
                },
                'paint': {
                    'text-color': 'black',
                    'text-halo-color': 'white',
                    'text-halo-width': 1
                },
                'filter': ['all',
                    ['!=', ['get', 'trail_type'], 'streamed']
                ]
            });

            // Initialize the info box element
            const infoBox = document.getElementById('info-box');

            // Flag to determine if the info box is fixed
            let isInfoBoxFixed = false;

            // Variable to store the fixed info content
            let fixedInfoContent = '';

            // Add mousemove event listener to the trees layer
            map.on('mousemove', 'trees-layer', (e) => {
                if (!isInfoBoxFixed) {
                    infoBox.className = 'selected';
                    const properties = e.features[0].properties;
                    infoBox.innerHTML = `
                        <strong>Tree ID:</strong> ${properties["Tree ID"]}<br>
                        <strong>Botanical Name:</strong> ${properties["Botanical Name"]}<br>
                        <strong>Common Name:</strong> ${properties["Common Name"]}<br>
                        <strong>DBH (inches):</strong> ${properties["DBH (inches)"]}
                    `;
                }
            });

            // Add click event listener to the trees layer
            map.on('click', 'trees-layer', (e) => {
                const properties = e.features[0].properties;
                fixedInfoContent = `
                    <strong>Tree ID:</strong> ${properties["Tree ID"]}<br>
                    <strong>Botanical Name:</strong> ${properties["Botanical Name"]}<br>
                    <strong>Common Name:</strong> ${properties["Common Name"]}<br>
                    <strong>DBH (inches):</strong> ${properties["DBH (inches)"]}
                `;
                infoBox.innerHTML = fixedInfoContent;
                infoBox.className = 'selected';
                isInfoBoxFixed = true;
            });

            // Add mouseleave event listener to reset the info box when the mouse leaves the trees layer
            map.on('mouseleave', 'trees-layer', () => {
                map.getCanvas().style.cursor = '';
                if (!isInfoBoxFixed) {
                    infoBox.className = 'default';
                    infoBox.innerHTML = 'Select a tree!  &#x1F333;  &#x1F535;  &#x1F7E2;  &#x1F7E1;';
                }
            });

            // Add an event listener to reset the info box when clicking outside of a tree
            map.on('click', (e) => {
                // Check if the click was outside the trees-layer
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['trees-layer']
                });

                if (features.length === 0) {
                    isInfoBoxFixed = false;
                    infoBox.className = 'default';
                    infoBox.innerHTML = 'Select a tree!  &#x1F333;  &#x1F535;  &#x1F7E2;  &#x1F7E1;';
                }
            });

            /*
                        // Extract start and end points from the trails
                        const markerFeatures = [];
                        data.features.forEach(feature => {
                            const coordinates = feature.geometry.coordinates;
                            if (coordinates.length > 0) {
                                const start = coordinates[0];
                                const end = coordinates[coordinates.length - 1];
                                markerFeatures.push({
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Point',
                                        coordinates: start
                                    },
                                    properties: {
                                        type: 'start'
                                    }
                                });
                                markerFeatures.push({
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Point',
                                        coordinates: end
                                    },
                                    properties: {
                                        type: 'end'
                                    }
                                });
                            }
                        });
            
                        // Add the markers as a source
                        map.addSource('trail-markers', {
                            type: 'geojson',
                            data: {
                                type: 'FeatureCollection',
                                features: markerFeatures
                            }
                        });
            
                        // Add the markers as a layer
                        map.addLayer({
                            'id': 'trail-markers-layer',
                            'type': 'circle',
                            'source': 'trail-markers',
                            'paint': {
                                'circle-radius': 3,
                                'circle-color': [
                                    'match',
                                    ['get', 'type'],
                                    'start', '#f00', // Red for start points
                                    'end', '#00f',   // Blue for end points
                                ]
                            }
                        });
            */
        });
    })
    .catch(error => {
        console.error('Error loading the GeoJSON data:', error);
    });



let selectedTrail = null;

// Add interactive pop-ups for trails
map.on('click', 'trail-layer', (e) => {
    const properties = e.features[0].properties;
    const coordinates = e.lngLat;

    // Create a pop-up content from trail properties
    const popupContent = `<div class="popup-content">
    <strong>Trail Name:</strong> ${properties.name || 'Unknown'}<br>
    <strong>Blaze:</strong> ${properties.blaze || 'Unknown'}<br>
    <strong>Unofficial:</strong> ${properties.informal || 'no'}
</div>`;

    // Create and show the pop-up
    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);

    // Highlight the selected trail in the legend
    const name = properties.name || 'Unknown';
    const legendItems = document.getElementsByClassName('legend-item');

    // Remove highlight from previously selected item
    if (selectedTrail) {
        selectedTrail.classList.remove('highlight-selected');
    }

    for (let item of legendItems) {
        if (item.dataset.name === name) {
            item.classList.add('highlight-selected');
            selectedTrail = item; // Keep track of the selected trail
        }
    }
});

// Change the cursor to a pointer when the mouse is over the trail layer and highlight the legend item
map.on('mouseenter', 'trail-layer', (e) => {
    map.getCanvas().style.cursor = 'pointer';

    const properties = e.features[0].properties;
    const name = properties.name || 'Unknown';
    const legendItems = document.getElementsByClassName('legend-item');

    for (let item of legendItems) {
        if (item.dataset.name === name) {
            item.classList.add('highlight');
        }
    }
});

// Change the cursor back and remove highlight when it leaves the trail layer
map.on('mouseleave', 'trail-layer', () => {
    map.getCanvas().style.cursor = '';

    const legendItems = document.getElementsByClassName('legend-item');
    for (let item of legendItems) {
        item.classList.remove('highlight');
    }
});

// Deselect trail when clicking off the trail
map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['trail-layer']
    });

    if (features.length === 0 && selectedTrail) {
        selectedTrail.classList.remove('highlight-selected');
        selectedTrail = null;
    }
});

// Add a popup when a circle is clicked
map.on('click', 'trees-layer', function (e) {
    var coordinates = e.features[0].geometry.coordinates.slice();
    const properties = e.features[0].properties;
    console.log('Feature properties:', properties); // Debugging line

    let popupHTML;
    // Construct the HTML for the popup
    if (properties["Notes"] === "") {
        popupHTML = `<div class="popup-content">
        <strong>General Health:</strong> ${properties["General Health"]}<br>
        <strong>Lat:</strong> ${coordinates[1].toFixed(6)}<br>
        <strong>Lon:</strong> ${coordinates[0].toFixed(6)}
        </div>`;
    } else {
        popupHTML = `<div class="popup-content">
        <strong>General Health:</strong> ${properties["General Health"]}<br>
        <strong>Notes:</strong> ${properties["Notes"]}<br>
        <strong>Lat:</strong> ${coordinates[1].toFixed(6)}<br>
        <strong>Lon:</strong> ${coordinates[0].toFixed(6)}
        </div>`;
    }

    // Ensure the popup appears over the correct location
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(popupHTML)
        .addTo(map);
});

// Change the cursor to a pointer when the mouse is over the circle layer
map.on('mouseenter', 'trees-layer', function () {
    map.getCanvas().style.cursor = 'pointer';
});

// Change the cursor back when it leaves the circle layer
map.on('mouseleave', 'trees-layer', function () {
    map.getCanvas().style.cursor = '';
});

// Function to reset map to default location and zoom
function resetMap() {
    map.flyTo({
        center: defaultCenter, // default center [lng, lat]
        zoom: defaultZoom, // default zoom
        pitch: 0,
        bearing: 0,
        essential: true // this animation is considered essential with respect to prefers-reduced-motion
    });
}

map.on('click', (e) => {
    const coordinates = e.lngLat;
    console.log(`Lat: ${coordinates.lat}, Lon: ${coordinates.lng}`);
});

