import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const LayerControl = ({
  layers,
  onLayerToggle,
  basemaps,
  currentBasemap,
  onBasemapChange,
  showSVGOverlay,
  onSVGOverlayToggle,
  isEditingRef,
  selectedEditLayerRef
}) => {
  const map = useMap();
  const [isEditingState, setIsEditingState] = useState(isEditingRef.current);

  // Effect to update the state when the ref changes
  useEffect(() => {
    const LayerControlContainer = L.Control.extend({
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control layer-control');

        // Add a title
        const title = L.DomUtil.create('h3', 'layer-control-title', container);
        title.innerHTML = 'Layer Control';

        // Create a div for columns
        const columnsContainer = L.DomUtil.create('div', 'columns-container', container);

        // Left column for layers
        const leftColumn = L.DomUtil.create('div', 'left-column', columnsContainer);

        // Layer toggles
        layers.forEach(layer => {
          const label = L.DomUtil.create('label', '', leftColumn);
          const checkbox = L.DomUtil.create('input', '', label);
          checkbox.type = 'checkbox';
          checkbox.checked = layer.active;
          L.DomUtil.create('span', '', label).innerHTML = ` ${layer.name}`;

          // Disable checkbox if it's the selected layer and in edit mode
          if (layer.id === selectedEditLayerRef.current?.id) {
            checkbox.disabled = true;
            checkbox.checked = true;
            label.style.opacity = '0.5';
          } else {
            L.DomEvent.on(checkbox, 'change', function () {
              console.log("logging layer change with layer:", layer);
              onLayerToggle(layer.id, this.checked);
            });
          }
        });

        // Right column for basemap and SVG overlay
        const rightColumn = L.DomUtil.create('div', 'right-column', columnsContainer);

        // Basemap selector label
        const basemapLabel = L.DomUtil.create('label', 'basemap-label', rightColumn);
        basemapLabel.innerHTML = 'Basemap';
        
        // Basemap selector
        const select = L.DomUtil.create('select', '', rightColumn);
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

        // SVG Overlay toggle
        const svgLabel = L.DomUtil.create('label', 'svg-overlay-label', rightColumn);
        const svgCheckbox = L.DomUtil.create('input', '', svgLabel);
        svgCheckbox.type = 'checkbox';
        svgCheckbox.checked = showSVGOverlay;
        L.DomUtil.create('span', '', svgLabel).innerHTML = ' SVG Overlay';

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
  }, [map, layers, onLayerToggle, basemaps, currentBasemap, onBasemapChange, showSVGOverlay, onSVGOverlayToggle, isEditingState, selectedEditLayerRef]);

  return null;
};

export default LayerControl;
