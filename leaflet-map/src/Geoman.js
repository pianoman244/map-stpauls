import React, { useEffect, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

const Geoman = () => {
    const map = useMap();
    const highlightedFeatureRef = useRef(null);

    const saveFeaturesToLocalStorage = useCallback(() => {
        const features = [];
        map.eachLayer((layer) => {
            // only works with path instances so far
            if (layer instanceof L.Path) {
                // only save features with set GeoJSON data
                if (layer.feature) {
                    features.push(layer.feature);
                }
            }
        });
        localStorage.setItem('mapFeatures', JSON.stringify(features));
    }, [map]);

    const highlightFeature = (layer) => {
        if (highlightedFeatureRef.current) {
            unhighlightFeature(highlightedFeatureRef.current);
        }
        layer.setStyle({
            ...layer.options,
            fillOpacity: 0.4
        });
        highlightedFeatureRef.current = layer;
    };

    const unhighlightFeature = (layer) => {
        layer.setStyle({
            ...layer.options,
            fillOpacity: 0.2
        });
    };

    const handleFeatureClick = useCallback((e) => {
        const layer = e.target;
        console.log('Feature clicked:', layer);
        highlightFeature(layer);

        const selectEvent = new CustomEvent('featureSelected', {
            detail: {
                featureType: layer.pm.getShape(),
                featureData: layer.feature,
                layer: layer
            }
        });
        window.dispatchEvent(selectEvent);

        e.originalEvent._stopped = true;
    }, []);

    const updateFeatureGeometry = useCallback((layer) => {
        if (layer.feature && layer.toGeoJSON) {
            const updatedGeometry = layer.toGeoJSON().geometry;
            layer.feature.geometry = updatedGeometry;
            console.log('Updated feature geometry:', updatedGeometry);
        }
    }, []);

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

    useEffect(() => {
        console.log('Initializing Geoman');

        // Set global options for Geoman
        map.pm.setGlobalOptions({
            pathOptions: {
                color: '#4489dd',
                fillOpacity: 0.5,
                weight: 0,
                opacity: 1
            }
        });

        map.pm.addControls({
            position: 'topleft',
            drawCircle: false,
            drawMarker: false,
            drawCircleMarker: false,
            drawPolyline: false, // Disable the line draw feature
            drawText: false // Disable the text draw feature
        });

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

        map.on('pm:remove', (e) => {
            saveFeaturesToLocalStorage();
        });

        const savedFeatures = localStorage.getItem('mapFeatures');
        if (savedFeatures) {
            // Clear existing features
            map.eachLayer((layer) => {
                if (layer instanceof L.Path && !(layer instanceof L.Circle)) {
                    map.removeLayer(layer);
                }
            });

            // Load features from localStorage
            const geoJSON = JSON.parse(savedFeatures);
            L.geoJSON(geoJSON, {
                onEachFeature: (feature, layer) => {
                    addLayerListeners(layer);
                    layer.setStyle({ weight: 0, color: '#4489dd'}); // default style
                    if (feature.properties && feature.properties.color) {
                        layer.setStyle({ color: feature.properties.color });
                    }
                }
            }).addTo(map);
        }

        map.eachLayer((layer) => {
            if (layer instanceof L.Path && !(layer instanceof L.Circle)) {
                addLayerListeners(layer);
            }
        });

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


        const handleFeatureUpdate = (e) => {
            const { layer } = e.detail;
            if (layer.feature && layer.feature.properties.color) {
                layer.setStyle({ color: layer.feature.properties.color });
            }
            console.log("Trying to save feature from handleFeatureUpdate:", e);
            saveFeaturesToLocalStorage();
        };

        window.addEventListener('featureUpdated', handleFeatureUpdate);

        return () => {
            map.pm.removeControls();
            map.off('pm:create');
            map.off('pm:remove');
            map.off('click');

            map.eachLayer((layer) => {
                if (layer instanceof L.Path && !(layer instanceof L.Circle)) {
                    layer.off('pm:editend');
                    layer.off('pm:dragend');
                    layer.off('click', handleFeatureClick);
                }
            });

            // window.removeEventListener('featureUpdated', handleFeatureUpdate);
        };
    }, [map, handleFeatureClick, addLayerListeners, saveFeaturesToLocalStorage]);

    return null;
};

export default Geoman;