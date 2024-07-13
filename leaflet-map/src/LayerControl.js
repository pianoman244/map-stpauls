import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const LayerControl = ({
  layers,
  onLayerToggle,
  basemaps,
  currentBasemap,
  onBasemapChange,
  showSVGOverlay,
  onSVGOverlayToggle
}) => {
  const map = useMap();

  React.useEffect(() => {
    const LayerControlContainer = L.Control.extend({
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control layer-control');

        // Layer toggles
        layers.forEach(layer => {
          const label = L.DomUtil.create('label', '', container);
          const checkbox = L.DomUtil.create('input', '', label);
          checkbox.type = 'checkbox';
          checkbox.checked = layer.active;
          L.DomUtil.create('span', '', label).innerHTML = ` ${layer.name}`;

          L.DomEvent.on(checkbox, 'change', function () {
            onLayerToggle(layer.id, this.checked);
          });
        });

        // Basemap selector
        const select = L.DomUtil.create('select', '', container);
        select.id = 'basemap-select';
        basemaps.forEach(basemap => {
          const option = L.DomUtil.create('option', '', select);
          option.value = basemap.id;
          option.innerHTML = basemap.name;
          if (basemap.id === currentBasemap) {
            option.selected = true;
          }
        });

        L.DomEvent.on(select, 'change', function () {
          onBasemapChange(this.value);
        });

        const svgLabel = L.DomUtil.create('label', '', container);
        const svgCheckbox = L.DomUtil.create('input', '', svgLabel);
        svgCheckbox.type = 'checkbox';
        svgCheckbox.checked = showSVGOverlay;
        L.DomUtil.create('span', '', svgLabel).innerHTML = ' Show SVG Overlay';

        L.DomEvent.on(svgCheckbox, 'change', function() {
          onSVGOverlayToggle();
        });

        return container;
      }
    });

    const layerControl = new LayerControlContainer({ position: 'topright' });
    layerControl.addTo(map);

    return () => {
      map.removeControl(layerControl);
    };
  }, [map, layers, onLayerToggle, basemaps, currentBasemap, onBasemapChange, showSVGOverlay, onSVGOverlayToggle]);

  return null;
};

export default LayerControl;