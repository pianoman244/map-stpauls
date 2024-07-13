import React, { useEffect, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

const Geoman = ({ layers, selectedEditLayer }) => {
    const map = useMap();
    const layerGroupsRef = useRef({});
    const highlightedFeatureRef = useRef(null);

    const isValidColor = useCallback((color) => {
        if (!color || typeof color !== 'string') return false;
        const s = new Option().style;
        s.color = color;
        return s.color !== '';
    }, []);

    const styleFunction = useCallback((feature) => {
        const baseStyle = {
            weight: 1.5,
            opacity: 0.7,
            color: feature.properties.color || '#3388ff',
            fillOpacity: 0.15
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
                        color: feature.properties.color || '#FF69B4',
                        weight: 2,
                        opacity: 0.6,
                        dashArray: '5, 5'
                    };
                }
                let trailColor = baseStyle.color;
                if (feature.properties.blaze && isValidColor(feature.properties.blaze)) {
                    trailColor = feature.properties.blaze;
                }
                return {
                    ...baseStyle,
                    weight: 2,
                    color: trailColor,
                    opacity: 0.8
                };
            case 'Point':
                return {
                    ...baseStyle,
                    radius: 4,
                    fillColor: feature.properties.color || '#3388ff',
                    color: "#000",
                    weight: 1,
                    opacity: 0.7,
                    fillOpacity: 0.4
                };
            default:
                return baseStyle;
        }
    }, [isValidColor]);

    const highlightFeature = useCallback((e) => {
        console.log("Highlighting feature:", e);
        const layer = e.layer;
        try {
            if (layer.setStyle) {
                layer.setStyle({
                    weight: 3,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.5,
                    opacity: 1
                });
            } else {
                console.log("Can't set style for:", layer);
            }
            if (layer.bringToFront) {
                layer.bringToFront();
            }
            highlightedFeatureRef.current = layer;
        } catch (error) {
            console.error('Error highlighting feature:', error);
        }
    }, []);

    const unhighlightFeature = useCallback((e) => {
        console.log("Unhighlighting feature:", e);
        const layer = e.layer || highlightedFeatureRef.current;
        if (!layer) return;
        try {
            if (layer.feature) {
                layer.setStyle(styleFunction(layer.feature));
            }
            highlightedFeatureRef.current = null;
        } catch (error) {
            console.error('Error unhighlighting feature:', error);
        }
    }, [styleFunction]);

    const handleFeatureClick = useCallback((e) => {
        try {
            const layer = e.layer;
            console.log("Handling feature click:", layer);
            if (highlightedFeatureRef.current && highlightedFeatureRef.current !== layer) {
                unhighlightFeature({ target: highlightedFeatureRef.current });
            }
            highlightFeature(e);

            const selectEvent = new CustomEvent('featureSelected', {
                detail: {
                    featureType: layer.feature.geometry.type,
                    featureData: layer.feature,
                    layer: layer,
                    layerId: layer.feature.geometry.type // FIX THIS!!!
                } 
            });
            console.log("dispatching event:", selectEvent);
            window.dispatchEvent(selectEvent);
        } catch (error) {
            console.error('Error handling feature click:', error);
        }
    }, [highlightFeature, unhighlightFeature]);

    const addLayerListeners = useCallback((layer) => {
        layer.on({
            click: handleFeatureClick
        });
    }, [handleFeatureClick]);

    const removeLayerListeners = useCallback((layer) => {
        layer.off({
            click: handleFeatureClick
        });
    }, [handleFeatureClick]);

    const createGeoJSONLayer = useCallback((data) => {
        return L.geoJSON(data, {
            style: styleFunction,
            pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, styleFunction(feature));
            },
        });
    }, [styleFunction]);

    const enableEditingForLayer = useCallback((layerId) => {
        const layerGroup = layerGroupsRef.current[layerId];
        if (layerGroup) {
            layerGroup.eachLayer(layer => {
                if (layer.pm) {
                    layer.pm.enable({limitMarkersToCount: 20});
                }
                addLayerListeners(layer);
            });
        }
    }, [addLayerListeners]);

    const disableEditingForLayer = useCallback((layerId) => {
        const layerGroup = layerGroupsRef.current[layerId];
        if (layerGroup) {
            layerGroup.eachLayer(layer => {
                if (layer.pm) {
                    layer.pm.disable();
                }
                removeLayerListeners(layer);
            });
        }
        if (highlightedFeatureRef.current) {
            unhighlightFeature({ target: highlightedFeatureRef.current });
        }
    }, [removeLayerListeners, unhighlightFeature]);

    useEffect(() => {
        console.log('Initializing Geoman');

        map.pm.setGlobalOptions({
            layerGroup: undefined,
            snappable: true,
            snapDistance: 20,
        });

        map.pm.Toolbar.setButtonDisabled('editMode', false);
        map.pm.Toolbar.changeActionsOfControl('editMode', [
            {
                text: 'Enable Edit Mode',
                onClick: () => {
                    if (selectedEditLayer) {
                        enableEditingForLayer(selectedEditLayer);
                    }
                }
            }
        ]);

        layers.forEach(layer => {
            let layerGroup = layerGroupsRef.current[layer.id];

            if (!layerGroup) {
                layerGroup = L.layerGroup();
                layerGroupsRef.current[layer.id] = layerGroup;
            }

            layerGroup.addTo(map);
            layerGroup.clearLayers();

            if (layer.active && layer.data) {
                const geoJSONLayer = createGeoJSONLayer(layer.data);
                geoJSONLayer.addTo(layerGroup);

                geoJSONLayer.eachLayer(subLayer => {
                    if (subLayer.pm) {
                        subLayer.pm.disable();
                    }
                });
            }
        });

        /*
        const handleMapClick = (e) => {
            if (!e.originalEvent._stopped) {
                if (highlightedFeatureRef.current) {
                    unhighlightFeature({ target: highlightedFeatureRef.current });
                    const deselectEvent = new CustomEvent('featureDeselected');
                    window.dispatchEvent(deselectEvent);
                }
            }
        };*/

        // map.on('click', handleMapClick);

        return () => {
            console.log('Cleaning up Geoman');
            map.pm.removeControls();
            // map.off('click', handleMapClick);
            Object.values(layerGroupsRef.current).forEach(layerGroup => {
                layerGroup.eachLayer((layer) => {
                    removeLayerListeners(layer);
                });
                map.removeLayer(layerGroup);
            });
        };
    }, [map, layers, createGeoJSONLayer, enableEditingForLayer, unhighlightFeature, removeLayerListeners]);

    useEffect(() => {
        Object.keys(layerGroupsRef.current).forEach(layerId => {
            if (layerId === selectedEditLayer) {
                enableEditingForLayer(layerId);
            } else {
                disableEditingForLayer(layerId);
            }
        });
    }, [selectedEditLayer, enableEditingForLayer, disableEditingForLayer]);

    return null;
};

export default Geoman;