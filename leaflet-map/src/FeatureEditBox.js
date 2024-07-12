import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const FeatureEditBox = () => {
  const map = useMap();

  useEffect(() => {
    const EditControl = L.Control.extend({
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control feature-edit-box');
        container.style.backgroundColor = 'white';
        container.style.padding = '10px';
        container.style.margin = '10px';
        container.style.maxWidth = '300px';
        container.style.display = 'none'; // Initially hide the container

        let selectedFeature = null;

        const renderForm = () => {
          if (!selectedFeature) {
            container.style.display = 'none';
            return;
          }
          container.style.display = 'block';
          container.innerHTML = `
              <h3>Edit Feature</h3>
              <form>
                <div>
                  <label for="name">Name: </label>
                  <input id="name" type="text" value="${selectedFeature.feature.properties.name || ''}">
                </div>
                <div>
                  <label for="zone">Zone: </label>
                  <input id="zone" type="text" value="${selectedFeature.feature.properties.zone || ''}">
                </div>
                <div>
                  <label for="color">Color: </label>
                  <input id="color" type="text" value="${selectedFeature.feature.properties.color || ''}">
                </div>
                <button type="submit">Update</button>
              </form>
            `;

          const form = container.querySelector('form');
          form.addEventListener('submit', handleSubmit);
        };

        const handleSubmit = (e) => {
          e.preventDefault();
          if (selectedFeature) {
            const name = container.querySelector('#name').value;
            const zone = container.querySelector('#zone').value;
            const color = container.querySelector('#color').value;
            selectedFeature.feature.properties.name = name;
            selectedFeature.feature.properties.zone = zone;
            selectedFeature.feature.properties.color = color;

            if (CSS.supports('color', color)) {
              selectedFeature.setStyle({ color: color });
            }

            const updateEvent = new CustomEvent('featureUpdated', { detail: { layer: selectedFeature } });
            window.dispatchEvent(updateEvent);
          }
        };

        const handleFeatureSelect = (e) => {
          selectedFeature = e.detail.layer;
          renderForm();
        };

        const handleFeatureDeselect = () => {
          selectedFeature = null;
          renderForm();
        };

        window.addEventListener('featureSelected', handleFeatureSelect);
        window.addEventListener('featureDeselected', handleFeatureDeselect);

        this.onRemove = () => {
          window.removeEventListener('featureSelected', handleFeatureSelect);
          window.removeEventListener('featureDeselected', handleFeatureDeselect);
        };

        L.DomEvent.disableClickPropagation(container);
        return container;
      }
    });

    const editControl = new EditControl({ position: 'bottomright' });
    editControl.addTo(map);

    return () => {
      map.removeControl(editControl);
    };
  }, [map]);

  return null;
};

export default FeatureEditBox;