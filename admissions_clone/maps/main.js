mapboxgl.accessToken = 'pk.eyJ1IjoicGlhbm9tYW4yNCIsImEiOiJjbHhjYjRnNHQwOWttMnFvbjlzc2Z2bXkwIn0.mOh5fw5vP2zvcN2Go09w8A';

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/pianoman24/clxcb94sn09r301ql605egwtc',
    center: [-71.579588, 43.192937],
    zoom: 15.12 // starting zoom
});


fetch('http://localhost:8000/maps/data/trails_demo.geojson')
    .then(response => response.json())
    .then(data => {
        console.log('fetched data');
        // Add the trail data as a source
        map.on('load', () => {
            console.log('map loaded');
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
                        'coalesce',
                        ['get', 'blaze'],
                        '#002100' // Dark green as the default color
                    ],
                    'line-width': 4
                }
            });
            console.log('added trail layer');

            // Create a legend
            const legend = document.getElementById('legend');
            const trails = {};


            data.features.forEach((feature, index) => {
                const blaze = feature.properties.blaze || '#006400';
                const name = feature.properties.name || 'Unknown';
                const letter = String.fromCharCode(65 + index); // Generate letters A, B, C, etc.

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
