import React, { useEffect, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

const Geoman = ({ layers }) => {
    const map = useMap();
    const highlightedFeatureRef = useRef(null);
    const layerGroupsRef = useRef({});

    // Helper Functions

    /**
     * Checks if a given color string is a valid CSS color
     * @param {string} color - The color string to validate
     * @returns {boolean} - True if the color is valid, false otherwise
     */
    const isValidColor = (color) => {
        if (!color || typeof color !== 'string') return false;
        const s = new Option().style;
        s.color = color;
        return s.color !== '';
    };

    /**
     * Defines the style for each feature type
     * @param {Object} feature - The GeoJSON feature
     * @returns {Object} - The style object for the feature
     */
    const styleFunction = (feature) => {
        const baseStyle = {
            weight: 2,
            opacity: 1,
            color: feature.properties.color || '#3388ff',
            fillOpacity: 0.3
        };

        switch (feature.geometry.type) {
            case 'Polygon':
                return {
                    ...baseStyle,
                    fillColor: feature.properties.color || '#3388ff',
                };
            case 'LineString':
                if (feature.properties.type === 'flowerBed') {
                    return {
                        ...baseStyle,
                        color: feature.properties.color || '#FF69B4', // Pink color for flower beds
                        weight: 4, // Slightly thicker line for visibility
                        opacity: 0.8
                    };
                }
                // Existing LineString style (for trails)
                let trailColor = baseStyle.color;
                if (feature.properties.blaze && isValidColor(feature.properties.blaze)) {
                    trailColor = feature.properties.blaze;
                }
                return {
                    ...baseStyle,
                    weight: 3,
                    color: trailColor
                };
            case 'Point':
                return {
                    ...baseStyle,
                    radius: 8,
                    fillColor: feature.properties.color || '#3388ff',
                    color: "#000",
                };
            default:
                return baseStyle;
        }
    };

    /**
     * Creates a GeoJSON layer with appropriate styling and event listeners
     * @param {Object} data - The GeoJSON data
     * @returns {L.GeoJSON} - The created Leaflet GeoJSON layer
     */
    const createGeoJSONLayer = (data) => {
        return L.geoJSON(data, {
            style: styleFunction,
            pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, styleFunction(feature));
            },
            onEachFeature: (feature, layer) => {
                addLayerListeners(layer);
            }
        });
    };

    // Feature Interaction Functions

    /**
     * Highlights a feature on the map
     * @param {L.Layer} layer - The Leaflet layer to highlight
     */
    const highlightFeature = (layer) => {
        if (highlightedFeatureRef.current) {
            unhighlightFeature(highlightedFeatureRef.current);
        }
        if (layer.setStyle) {
            const feature = layer.feature;
            let highlightStyle = {
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            };

            if (feature && feature.geometry.type === 'LineString') {
                if (feature.properties.type === 'flowerBed') {
                  highlightStyle.color = '#FF1493'; // Deep pink for highlighted flower beds
                } else {
                  // Existing trail highlight logic
                  const trailColor = (feature.properties.blaze && isValidColor(feature.properties.blaze))
                    ? feature.properties.blaze
                    : (feature.properties.color || '#3388ff');
                  highlightStyle.color = trailColor;
                }
              }

            layer.setStyle(highlightStyle);
        }
        if (layer.bringToFront) {
            layer.bringToFront();
        }
        highlightedFeatureRef.current = layer;
    };

    /**
     * Removes highlight from a feature
     * @param {L.Layer} layer - The Leaflet layer to unhighlight
     */
    const unhighlightFeature = (layer) => {
        if (layer.setStyle) {
            layer.setStyle(styleFunction(layer.feature));
        }
    };

    /**
     * Handles click events on features
     * @param {L.MouseEvent} e - The Leaflet mouse event
     */
    const handleFeatureClick = useCallback((e) => {
        const layer = e.target;
        console.log('Feature clicked:', layer);
        highlightFeature(layer);

        const selectEvent = new CustomEvent('featureSelected', {
            detail: {
                featureType: layer.feature.geometry.type,
                featureData: layer.feature,
                layer: layer
            }
        });
        window.dispatchEvent(selectEvent);

        e.originalEvent._stopped = true;
    }, []);

    /**
     * Updates the geometry of a feature after editing
     * @param {L.Layer} layer - The Leaflet layer that was edited
     */
    const updateFeatureGeometry = useCallback((layer) => {
        if (layer.feature && layer.toGeoJSON) {
            const updatedGeometry = layer.toGeoJSON().geometry;
            layer.feature.geometry = updatedGeometry;
            console.log('Updated feature geometry:', updatedGeometry);
        }
    }, []);

    /**
     * Saves all features to localStorage
     */
    const saveFeaturesToLocalStorage = useCallback(() => {
        const features = {};
        Object.entries(layerGroupsRef.current).forEach(([layerId, layerGroup]) => {
            features[layerId] = [];
            layerGroup.eachLayer((layer) => {
                if (layer.feature) {
                    features[layerId].push(layer.feature);
                }
            });
        });
        localStorage.setItem('mapFeatures', JSON.stringify(features));
    }, []);

    /**
     * Adds event listeners to a layer
     * @param {L.Layer} layer - The Leaflet layer to add listeners to
     */
    const addLayerListeners = useCallback((layer) => {
        layer.on({
            'pm:update': (e) => {
                console.log('Layer edit ended:', e.layer);
                updateFeatureGeometry(e.layer);
                saveFeaturesToLocalStorage();
            },
            'pm:dragend': (e) => {
                console.log('Layer drag ended:', e.layer);
                updateFeatureGeometry(e.layer);
                saveFeaturesToLocalStorage();
            },
            'click': handleFeatureClick
        });
    }, [handleFeatureClick, updateFeatureGeometry, saveFeaturesToLocalStorage]);

    // Effect Hooks

    // Initialize Geoman and set up event listeners
    useEffect(() => {
        console.log('Initializing Geoman');

        // Set Geoman options
        map.pm.setGlobalOptions({
            layerGroup: undefined,
            snappable: true,
            snapDistance: 20,
        });

        // Add Geoman controls
        map.pm.addControls({
            position: 'topleft',
            drawCircle: false,
            drawCircleMarker: false,
            drawText: false
        });

        // Handle feature creation
        map.on('pm:create', (e) => {
            console.log('Shape created:', e.layer);
            if (!e.layer.feature) {
                e.layer.feature = {
                    type: 'Feature',
                    properties: {},
                    geometry: e.layer.toGeoJSON().geometry
                };
            }
            addLayerListeners(e.layer);
            saveFeaturesToLocalStorage();
        });

        // Handle feature removal
        map.on('pm:remove', (e) => {
            saveFeaturesToLocalStorage();
        });

        // Load saved features from localStorage
        const savedFeatures = localStorage.getItem('mapFeatures');
        if (savedFeatures) {
            try {
                const parsedFeatures = JSON.parse(savedFeatures);
                Object.entries(parsedFeatures).forEach(([layerId, features]) => {
                    const layerGroup = createGeoJSONLayer(features).addTo(map);
                    layerGroupsRef.current[layerId] = layerGroup;
                });
            } catch (error) {
                console.error('Error parsing saved features:', error);
            }
        }

        // Handle map clicks (for deselecting features)
        map.on('click', (e) => {
            if (!e.originalEvent._stopped) {
                if (highlightedFeatureRef.current) {
                    unhighlightFeature(highlightedFeatureRef.current);
                    highlightedFeatureRef.current = null;

                    const deselectEvent = new CustomEvent('featureDeselected');
                    window.dispatchEvent(deselectEvent);
                }
            }
        });

        // Handle feature updates
        const handleFeatureUpdate = (e) => {
            const { layer } = e.detail;
            if (layer.feature) {
                if (layer.setStyle) {
                    layer.setStyle(styleFunction(layer.feature));
                }
            }
            console.log("Trying to save feature from handleFeatureUpdate:", e);
            saveFeaturesToLocalStorage();
        };

        window.addEventListener('featureUpdated', handleFeatureUpdate);

        // Cleanup function
        return () => {
            map.pm.removeControls();
            map.off('pm:create');
            map.off('pm:remove');
            map.off('click');

            Object.values(layerGroupsRef.current).forEach(layerGroup => {
                layerGroup.eachLayer((layer) => {
                    layer.off('pm:update');
                    layer.off('pm:dragend');
                    layer.off('click', handleFeatureClick);
                });
                map.removeLayer(layerGroup);
            });

            window.removeEventListener('featureUpdated', handleFeatureUpdate);
        };
    }, [map, handleFeatureClick, addLayerListeners, saveFeaturesToLocalStorage]);

    // Handle changes to the layers prop
    useEffect(() => {
        // Remove existing layers
        Object.values(layerGroupsRef.current).forEach(layerGroup => {
            map.removeLayer(layerGroup);
        });
        layerGroupsRef.current = {};

        // Add new layers
        layers.forEach(layer => {
            if (layer.active && layer.data) {
                const layerGroup = createGeoJSONLayer(layer.data).addTo(map);
                layerGroupsRef.current[layer.id] = layerGroup;
            }
        });

        saveFeaturesToLocalStorage();
    }, [layers, map, addLayerListeners, saveFeaturesToLocalStorage]);

    return null;
};

export default Geoman;