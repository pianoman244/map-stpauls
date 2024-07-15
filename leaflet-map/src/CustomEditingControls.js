import React, { useCallback, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

const CustomEditingControls = ({
    selectedEditLayer,
    layerGroupsRef,
    isEditing,
    onEditStateChange
}) => {
    const map = useMap();

    const handleEdit = useCallback(() => {
        if (selectedEditLayer) {
            const layerGroup = layerGroupsRef.current[selectedEditLayer.id];
            console.log("handling edit for layerGroup:", layerGroup);

            // enable or disable editing on all layers in layerGroup
            if (layerGroup) {

                if (!isEditing) {
                    console.log("enabling edits");
                    // Enable editing
                    layerGroup.pm.enable({ limitMarkersToCount: (selectedEditLayer.editFeatureCount ?? 5) });
                    onEditStateChange(true);

                } else {
                    console.log("disabling edits");
                    // Disable editing
                    layerGroup.eachLayer(layer => {
                        if (layer.pm) {
                            layer.pm.disable();
                        }
                    });
                    layerGroup.pm.disable();
                    onEditStateChange(false);
                }
            }
        }
    }, [selectedEditLayer, layerGroupsRef, isEditing, onEditStateChange]);

    const handleCreate = useCallback((shape) => {
        if (selectedEditLayer) {
            map.pm.enableDraw(shape, {
                finishOn: 'dblclick',
            });

            map.once('pm:create', e => {
                const newFeature = e.layer;
                const layerGroup = layerGroupsRef.current[selectedEditLayer];
                if (layerGroup) {
                    newFeature.addTo(layerGroup);
                }
                map.pm.disableDraw();
            });
        }
    }, [map, selectedEditLayer, layerGroupsRef]);

    const handleDelete = useCallback(() => {
        if (selectedEditLayer) {
            const layerGroup = layerGroupsRef.current[selectedEditLayer];
            if (layerGroup) {
                layerGroup.eachLayer(layer => {
                    if (layer.pm) {
                        layer.pm.enable({
                            allowSelfIntersection: false,
                            removeOnly: true,
                        });
                    }
                });
            }
        }
    }, [selectedEditLayer, layerGroupsRef]);

    const ControlButton = ({ icon, title, onClick, disabled }) => {
        React.useEffect(() => {
            const controlButton = L.DomUtil.create('button', 'leaflet-buttons-control-button leaflet-pm-toolbar');
            controlButton.innerHTML = `<i class="control-icon ${icon}"></i>`;
            controlButton.title = title;
            controlButton.disabled = disabled;

            L.DomEvent.on(controlButton, 'click', onClick);

            const controlContainer = L.control({ position: 'topleft' });
            controlContainer.onAdd = () => controlButton;
            controlContainer.addTo(map);

            return () => {
                controlContainer.remove();
            };
        }, [icon, title, onClick, disabled]);

        return null;
    };

    const layerId = selectedEditLayer?.id;
    return (
        <>
            {/* normal line-based edit function for everything except trees*/}
            {layerId && layerId !== 'trees' && (
                <ControlButton
                    icon="leaflet-pm-icon-edit"
                    title={isEditing ? "Finish Editing" : "Edit Features"}
                    onClick={handleEdit}
                    disabled={!selectedEditLayer}
                />
            )}
            {/* drag-based edit function for everything except trees*/}
            {layerId === 'trees' && (
                <ControlButton
                    icon="leaflet-pm-icon-drag"
                    title={isEditing ? "Finish Editing" : "Edit Features"}
                    onClick={handleEdit}
                    disabled={!selectedEditLayer}
                />
            )}
            {false && layerId === 'trees' && (
                <ControlButton
                    icon="leaflet-pm-icon-marker"
                    title="Add Tree"
                    onClick={() => handleCreate('Marker')}
                    disabled={!selectedEditLayer}
                />
            )}
            {false && layerId === 'trails' && (
                <ControlButton
                    icon="leaflet-pm-icon-polyline"
                    title="Add Trail"
                    onClick={() => handleCreate('Line')}
                    disabled={!selectedEditLayer}
                />
            )}
            {/* Add more layer-specific controls here */}
            {false && (
                <ControlButton
                    icon="leaflet-pm-icon-delete"
                    title="Delete Features"
                    onClick={handleDelete}
                    disabled={!selectedEditLayer}
                />
            )}
        </>
    );
};

export default CustomEditingControls;