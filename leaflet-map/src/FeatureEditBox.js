import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const FeatureEditBox = ({highlightedFeatureState}) => {
  const map = useMap();

  useEffect(() => {
    // note: label is used in the properties. no spaces allowed in ids
    const formConfig = {
      default: [
        { id: 'name', label: 'Name', type: 'text' },
      ],
      'Polygon': [
        { id: 'name', label: 'name', type: 'text' },
        { id: 'zone', label: 'zone', type: 'text' },
      ],
      'Point': [
        { id: 'commonname', label: 'Common Name', type: 'text' },
        { id: 'DBH', label: 'DBH (inches)', type: 'text' },
        { id: 'Notes', label: 'Notes', type: 'text' }
      ],
      'LineString': [
        { id: 'name', label: 'name', type: 'text' },
        { id: 'blaze', label: 'blaze', type: 'text' },
      ],
    };

    const generateFormHtml = (items, properties) => {
      return items.map(item => `
        <div>
          <label for="${item.id}">${item.label}: </label>
          <input id="${item.id}" type="${item.type}" value="${properties[item.id] || ''}">
        </div>
      `).join('');
    };

    const layerId = highlightedFeatureState?.current.layer.id;
    const selectedFeature = highlightedFeatureState?.current.layer.feature;

    const getFormItems = (layerId) => formConfig[layerId] || formConfig.default;

    const EditControl = L.Control.extend({
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control feature-edit-box');
        container.style.backgroundColor = 'white';
        container.style.padding = '10px';
        container.style.margin = '10px';
        container.style.maxWidth = '300px';
        container.style.display = 'none';

        const renderForm = () => {
          if (!selectedFeature) {
            container.style.display = 'none';
            return;
          } else {
            container.style.display = 'inline-block';
          }

          const formItems = getFormItems(layerId);
          const formHtml = `
            <h3>Edit Feature</h3>
            <form>
              ${generateFormHtml(formItems, selectedFeature.feature.properties)}
              <button type="submit">Update</button>
            </form>
          `;

          container.innerHTML = formHtml;
          // // console.log("Inner HTML:", formHtml);
          const form = container.querySelector('form');
          form.addEventListener('submit', handleSubmit);
        };

        const handleSubmit = (e) => {
          e.preventDefault();
          if (selectedFeature) {
            let formItems;
            if (layerId) {
              formItems = getFormItems(layerId);
            } else {
              formItems = getFormItems('default');
            }

            formItems.forEach(item => {
              // // console.log("reading item", item);
              const value = container.querySelector(`#${item.id}`).value;
              selectedFeature.feature.properties[item.label] = value;
              if (item.id === 'color' && CSS.supports('color', value)) {
                selectedFeature.setStyle({ color: value });
              }
            });

            const updateEvent = new CustomEvent('featureUpdated', { detail: { layer: selectedFeature } });
            window.dispatchEvent(updateEvent);
          }
        };

        const handleFeatureSelect = (e) => {
          // console.log("FeatureEditBox caught:", e);
          selectedFeature = e.detail.layer;
          layerId = e.detail.layerId;
          renderForm();
        };

        const handleFeatureDeselect = () => {
          // console.log("FeatureEditBox caught deselect");
          container.innerHTML = container.innerHTML = `
          <h3>Edit Feature</h3>
          <p>No feature selected</p>
        `;
          selectedFeature = null;
          renderForm();
        };

        L.DomEvent.disableClickPropagation(container);
        return container;
      }
    }, [highlightedFeatureState]);

    // console.log("Creating EditControl");
    const editControl = new EditControl({ position: 'bottomright' });
    // console.log("Adding editControl to map:", editControl);
    editControl.addTo(map);

    return () => {
      map.removeControl(editControl);
    };
  }, [map]);

  return null;
};

export default FeatureEditBox;
