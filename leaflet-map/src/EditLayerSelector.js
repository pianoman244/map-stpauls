import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const EditLayerSelector = ({ layers, selectedLayer, onLayerSelect }) => {
  const map = useMap();

  useEffect(() => {
    const EditLayerControl = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control edit-layer-selector');
        
        const select = L.DomUtil.create('select', '', container);
        select.style.width = '100%';
        select.style.padding = '5px';
        
        const defaultOption = L.DomUtil.create('option', '', select);
        defaultOption.innerHTML = 'Select layer to edit';
        defaultOption.value = '';
        
        layers.forEach(layer => {
            if (layer.id !== 'flowerBeds') {
              const option = L.DomUtil.create('option', '', select);
              option.innerHTML = layer.name;
              option.value = layer.id;
              if (layer.id === selectedLayer) {
                option.selected = true;
              }
            }
          });

        L.DomEvent.on(select, 'change', function(e) {
          onLayerSelect(e.target.value);
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
  }, [map, layers, onLayerSelect]);

  return null;
};

export default EditLayerSelector;