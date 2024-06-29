mapboxgl.accessToken = 'pk.eyJ1IjoicGlhbm9tYW4yNCIsImEiOiJjbHhjYjRnNHQwOWttMnFvbjlzc2Z2bXkwIn0.mOh5fw5vP2zvcN2Go09w8A';

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/pianoman24/clxddq2my002c01qo8oc10owh',
    center: [-71.58, 43.190409], // default center [lng, lat]
    zoom: 13.78, // default zoom
    pitch: 0,
    bearing: 0
});

// Function to update the layer visibility based on zoom level
function updateLayerVisibility() {
    var zoom = map.getZoom();
    if (zoom >= 15) {
        map.setPaintProperty('trees-layer', 'circle-opacity', 1, {
            'duration': 500
        });
    } else {
        map.setPaintProperty('trees-layer', 'circle-opacity', 0, {
            'duration': 500
        });
    }
}

// Update layer visibility on zoom events
map.on('zoom', function() {
    updateLayerVisibility();
});

fetch('https://pianoman244.github.io/map-stpauls/admissions_clone/maps/data/trails_demo.geojson')
    .then(response => response.json())
    .then(data => {
        // Add the trail data as a source
        map.on('load', () => {
            map.addSource('trails', {
                type: 'geojson',
                data: data // Use the fetched GeoJSON data
            });

            /*
            map.addSource('observatory-trails', {
                type: 'geojson',
                data: "http://localhost:8000/maps/data/observatory_trails.geojson" // Use the fetched GeoJSON data
            });*/

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
                'data': 'http://pianoman244.github.io/map-stpauls/utility/tree_extractions/zone_a.geojson' // Path to your GeoJSON file
            });

            // Add a circle layer
            map.addLayer({
                'id': 'trees-layer',
                'type': 'circle',
                'source': 'points',
                'slot': 'middle',
                'paint': {
                    // Circle radius changes with zoom level
                    'circle-radius': {
                        'base': 2,
                        'stops': [
                            [15, 2],
                            [17, 4],
                            [22, 40]
                        ]
                    },
                    'circle-color': '#008800', // Green color
                    'circle-pitch-scale': 'map', // Scale circles with the map
                    'circle-pitch-alignment': 'map' // Align circles with the map pitch
                },
                'minzoom': 14
            });


            /*
            map.addLayer({
                'id': 'observatory-layer',
                'type': 'line',
                'source': 'observatory-trails',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#000000',
                    'line-width': [
                        'case',
                        ['==', ['get', 'informal'], 'yes'],
                        4, // Dotted line pattern for informal trails
                        2  // Solid line pattern for formal trails
                    ],
                    'line-dasharray': [
                        'case',
                        ['==', ['get', 'informal'], 'yes'],
                        [2, 2], // Dotted line pattern for informal trails
                        [1, 0]  // Solid line pattern for formal trails
                    ]
                },
                'filter': ['all',
                    ['!=', ['get', 'trail_type'], 'streamed']
                ]
            });*/

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
    const popupContent = `
    <strong>Trail Name:</strong> ${properties.name || 'Unknown'}<br>
    <strong>Operator:</strong> ${properties.operator || 'Unknown'}<br>
    <strong>Surface:</strong> ${properties.surface || 'Unknown'}<br>
    <strong>Winter Service:</strong> ${properties.winter_service || 'Unknown'}
`;

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
    var description = e.features[0].properties.id;

    new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
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
        center: [-71.58, 43.190409], // default center [lng, lat]
        zoom: 13.78, // default zoom
        pitch: 0,
        bearing: 0,
        essential: true // this animation is considered essential with respect to prefers-reduced-motion
    });
}