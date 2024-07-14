import React, { useEffect, useCallback, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

const Geoman = ({
    layers,
    selectedEditLayerRef,
    layerGroupsRef,
    isEditingRef,
    styleFunction,
    addLayerListeners,
    removeLayerListeners
}) => {
    const map = useMap();
    const [selectedEditLayerState, setSelectedEditLayerState] = useState(selectedEditLayerRef.current);

    // Synchronize the state variable with the ref
    useEffect(() => {
        const syncSelectedEditLayer = () => {
            setSelectedEditLayerState(selectedEditLayerRef.current);
        };
        const interval = setInterval(syncSelectedEditLayer, 10);

        return () => {
            clearInterval(interval);
        };
    }, [selectedEditLayerRef]);

    const createGeoJSONLayer = useCallback((data) => {
        return L.geoJSON(data, {
            style: styleFunction,
            pointToLayer: (feature, latlng) => {
                return L.circleMarker(latlng, styleFunction(feature));
            },
        });
    }, [styleFunction]);

    useEffect(() => {
        console.log('Initializing Geoman');

        map.options.minZoom = 13;
        map.options.maxZoom = 21;

        map.pm.setGlobalOptions({
            layerGroup: undefined,
            snappable: true,
            snapDistance: 20,
        });

        layers.forEach(layer => {
            let layerGroup = layerGroupsRef.current[layer.id];

            // initialize layerGroup if it never has been
            if (!layerGroup) {
                layerGroup = L.layerGroup();
                layerGroupsRef.current[layer.id] = layerGroup;
            }

            // add layers from dataset if layerGroup is empty
            if (layer.data && layerGroup.getLayers().length === 0) {
                const geoJSONLayer = createGeoJSONLayer(layer.data);

                // add layers individually for more precise control
                geoJSONLayer.eachLayer(subLayer => {
                    subLayer.addTo(layerGroup);
                })
            }

            // console.log("selectedEditLayer (Geoman useEffect):", selectedEditLayerRef.current);
            // add it to the map if it's active
            if (layer.active) {
                layerGroup.addTo(map);

                // add highlight feature listeners if selected for editing
                if (selectedEditLayerRef.current && selectedEditLayerRef.current.id == layer.id) {
                    console.log("adding listeners with layer.id:", layer.id);
                    layerGroup.eachLayer(subLayer => {
                        addLayerListeners(subLayer);
                    });

                    if (isEditingRef.current) {
                        layerGroup.pm.enable({ limitMarkersToCount: (layer.editFeatureCount ?? 5) });
                    }
                }
            }
        });

        return () => {
            console.log('Cleaning up Geoman');
            map.pm.removeControls();
            Object.values(layerGroupsRef.current).forEach(layerGroup => {
                layerGroup.pm.disable(); // disable editing
                // remove all listeners to be safe
                layerGroup.eachLayer(layer => {
                    removeLayerListeners(layer);
                });
                // console.log("removing layer group:", layerGroup);
                map.removeLayer(layerGroup);
            });
        };
    }, [map, layers, createGeoJSONLayer, addLayerListeners, removeLayerListeners, selectedEditLayerState]); // Add selectedEditLayerState to dependencies

    // Function to handle editing state changes directly
    const handleEdit = useCallback(() => {
        // console.log("handleEdit called");
        // console.log("selectedEditLayer:", selectedEditLayerRef.current);
        // console.log("isEditing:", isEditingRef.current);
        // console.log("layerGroupsRef:", layerGroupsRef.current);

        if (selectedEditLayerRef.current) {
            const layerGroup = layerGroupsRef.current[selectedEditLayerRef.current.id];
            // console.log("handling edit for layerGroup:", layerGroup);

            if (layerGroup) {
                if (!isEditingRef.current) {
                    console.log("enabling edits");
                    layerGroup.pm.enable({ limitMarkersToCount: (selectedEditLayerRef.current.editFeatureCount ?? 5) });
                    isEditingRef.current = true; // Directly set isEditingRef
                } else {
                    console.log("disabling edits");
                    layerGroup.eachLayer(layer => {
                        if (layer.pm) {
                            layer.pm.disable();
                        }
                    });
                    layerGroup.pm.disable();
                    isEditingRef.current = false; // Directly set isEditingRef
                }
            }
        } else {
            console.log("selectedEditLayerRef.current is falsy");
        }
    }, [layerGroupsRef]);

    // Function to check if a control already exists
    const controlExists = (controlName) => {
        return map.pm.Toolbar.getButtons()[controlName] !== undefined;
    };

    useEffect(() => {
        console.log("modifying controls");

        // First, add a blank toolbar
        map.pm.addControls({
            position: 'topleft',
            order: 1,
            drawMarker: false,
            drawCircleMarker: false,
            drawPolyline: false,
            drawRectangle: false,
            drawPolygon: false,
            drawCircle: false,
            rotateMode: false,
            drawText: false,
            editMode: false,
            dragMode: false,
            cutPolygon: false,
            removalMode: false,
        });

        // Enable specific controls based on the layers array
        const controlsToEnable = {
            drawMarker: false,
            drawPolyline: false,
            drawPolygon: false,
            ligma: selectedEditLayerState ? true : false
            // Add other controls as needed
        };

        switch (selectedEditLayerState?.id) {
            case 'trees':
                controlsToEnable.drawCircleMarker = true;
                break;
            case 'trails':
                controlsToEnable.drawPolyline = true;
                break;
            case 'buildings':
                controlsToEnable.drawPolygon = true;
            case 'landscaping':
                controlsToEnable.drawPolygon = true;
                break;
            // Add more cases as needed for other layer types
        }

        // Enable the required controls
        map.pm.addControls({
            ...controlsToEnable,
            position: 'topleft',
            order: 1
        });

        if (!controlExists('ligma')) {
            // creates new actions
            const actions = [
                "cancel", // uses the default 'cancel' action
                { text: "Custom text, no click" }, // creates a new action that has text, no click event
                {
                    text: "click me",
                    onClick: () => {
                        alert("🙋‍♂️");
                    },
                },
            ];
            map.pm.Toolbar.createCustomControl({
                name: 'ligma',
                block: 'edit',
                title: 'balls',
                className: 'leaflet-pm-icon-edit',
                onClick: handleEdit,
                actions: actions,
                disableOtherButtons: true
            });
        } else {
            console.log("ligma balls");
        }

    }, [map, layers, selectedEditLayerState]); // Add selectedEditLayerState to dependencies

    return null;
};

export default Geoman;
