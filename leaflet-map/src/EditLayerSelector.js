import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const EditLayerSelector = ({ layers, selectedEditLayerRef, isEditingRef, onLayerSelect }) => {
  const map = useMap();
  const [isEditingState, setIsEditingState] = useState(isEditingRef.current);

  // Effect to update the state when the ref changes
  useEffect(() => {
    const syncIsEditing = () => {
      setIsEditingState(isEditingRef.current);
    };
    const interval = setInterval(syncIsEditing, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isEditingRef]);

  useEffect(() => {
    const EditLayerControl = L.Control.extend({
      onAdd: function (map) {
        const container = L.DomUtil.create('div', 'edit-layer-selector leaflet-bar leaflet-control edit-layer-selector');

        // Add a title
        const title = L.DomUtil.create('h3', 'edit-layer-title', container);
        title.innerHTML = 'Highlight & Edit Features';

        const select = L.DomUtil.create('select', '', container);
        select.style.width = '100%';
        select.style.padding = '5px';
        select.disabled = isEditingState; // Disable the dropdown if in editing mode

        const defaultOption = L.DomUtil.create('option', '', select);
        defaultOption.innerHTML = 'Select a layer';
        defaultOption.value = '';

        // Create options for each layer
        layers.forEach((layer, index) => {
          if (layer.id !== 'flowerBeds') {
            const option = L.DomUtil.create('option', '', select);
            option.innerHTML = layer.name;
            option.value = index; // Use the index as the value
            if (layer.id === selectedEditLayerRef.current?.id) {
              option.selected = true;
            }
          }
        });

        // Store the layers array in a data attribute of the select element
        select.dataset.layers = JSON.stringify(layers);

        // Handle the change event
        L.DomEvent.on(select, 'change', function (e) {
          const selectedIndex = parseInt(e.target.value, 10); // Ensure it's parsed as an integer
          const layersData = JSON.parse(e.target.dataset.layers);

          const selectedLayer = layersData[selectedIndex];
          console.log("logging change with selected layer:", selectedLayer);
          onLayerSelect(selectedLayer);
          
          /*
          // Check if selectedIndex is a valid index
          if (!isNaN(selectedIndex) && layersData[selectedIndex]) {
            const selectedLayer = layersData[selectedIndex];
            console.log("logging change with selected layer:", selectedLayer);
            onLayerSelect(selectedLayer);
          } else {
            console.error("Invalid selection or layers data:", selectedIndex, layersData);
          }*/
        });

        L.DomEvent.disableClickPropagation(container);
        return container;
      }
    });

    const editLayerControl = new EditLayerControl({ position: 'topleft' });
    editLayerControl.addTo(map);

    return () => {
      editLayerControl.remove();
    };
  }, [map, layers, onLayerSelect, selectedEditLayerRef, isEditingState]);

  return null;
};

export default EditLayerSelector;
