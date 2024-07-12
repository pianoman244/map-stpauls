// LayerControl.js
import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const LayerControl = ({ layers, onLayerToggle }) => {
  const map = useMap();

  React.useEffect(() => {
    const LayerControlContainer = L.Control.extend({
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control layer-control');
        container.style.backgroundColor = 'white';
        container.style.padding = '10px';
        container.style.margin = '10px';

        layers.forEach(layer => {
          const label = L.DomUtil.create('label', '', container);
          const checkbox = L.DomUtil.create('input', '', label);
          checkbox.type = 'checkbox';
          checkbox.checked = layer.active;
          L.DomUtil.create('span', '', label).innerHTML = ` ${layer.name}`;

          L.DomEvent.on(checkbox, 'change', function() {
            onLayerToggle(layer.id, this.checked);
          });
        });

        return container;
      }
    });

    const layerControl = new LayerControlContainer({ position: 'topright' });
    layerControl.addTo(map);

    return () => {
      map.removeControl(layerControl);
    };
  }, [map, layers, onLayerToggle]);

  return null;
};

export default LayerControl;