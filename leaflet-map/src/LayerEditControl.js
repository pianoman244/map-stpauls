import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const LayerEditControl = ({ layers, onLayerSelect, onEditToggle }) => {
  const map = useMap();

  useEffect(() => {
    const LayerEditControl = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control layer-edit-control');
        
        // Create dropdown
        const select = L.DomUtil.create('select', 'layer-select', container);
        layers.forEach(layer => {
          const option = L.DomUtil.create('option', '', select);
          option.value = layer.id;
          option.innerHTML = layer.name;
        });

        // Create edit button
        const editButton = L.DomUtil.create('button', 'edit-button', container);
        editButton.innerHTML = 'Edit';
        editButton.style.marginLeft = '5px';

        // Event listeners
        L.DomEvent.on(select, 'change', function(e) {
          onLayerSelect(e.target.value);
        });

        L.DomEvent.on(editButton, 'click', function(e) {
          L.DomEvent.stopPropagation(e);
          onEditToggle();
        });

        L.DomEvent.disableClickPropagation(container);
        return container;
      }
    });

    const layerEditControl = new LayerEditControl({ position: 'topleft' });
    layerEditControl.addTo(map);

    return () => {
      map.removeControl(layerEditControl);
    };
  }, [map, layers, onLayerSelect, onEditToggle]);

  return null;
};

export default LayerEditControl;