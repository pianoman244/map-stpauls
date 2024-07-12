import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const InfoBox = () => {
  const map = useMap();

  useEffect(() => {
    const InfoControl = L.Control.extend({
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control info-box');
        container.style.backgroundColor = 'white';
        container.style.padding = '10px';
        container.style.margin = '10px';
        container.style.maxWidth = '300px';
        container.style.maxHeight = '400px';
        container.style.overflowY = 'auto';
        container.style.overflowWrap = 'break-word';
        container.innerHTML = `
          <h3>Feature Info</h3>
          <p>Click on a feature to<br>see its information.</p>
        `;
        
        let currentFeatureInfo = null;

        const renderInfo = (info) => {
          currentFeatureInfo = info;
          container.innerHTML = `
              <h3>Feature Info</h3>
              ${info ? `
                ${info.featureData.properties ? `
                  <p><strong>Properties:</strong></p>
                  <ul>
                    ${Object.entries(info.featureData.properties).map(([key, value]) => 
                      `<li>${key}: ${JSON.stringify(value)}</li>`
                    ).join('')}
                  </ul>
                ` : ''}
                ${info.featureData.geometry ? `
                  <p><strong>Geometry Type:</strong> ${info.featureData.geometry.type}</p>
                ` : ''}
              ` : 'No feature selected'}
            `;
        };

        const handleFeatureSelect = (e) => {
          renderInfo(e.detail);
        };

        const handleFeatureDeselect = () => {
          renderInfo(null);
        };

        const handleFeatureUpdate = (e) => {
          if (currentFeatureInfo && e.detail.layer === currentFeatureInfo.layer) {
            // Update the current feature info with the new data
            currentFeatureInfo.featureData = e.detail.layer.feature;
            renderInfo(currentFeatureInfo);
          }
        };

        window.addEventListener('featureSelected', handleFeatureSelect);
        window.addEventListener('featureDeselected', handleFeatureDeselect);
        window.addEventListener('featureUpdated', handleFeatureUpdate);

        this.onRemove = () => {
          window.removeEventListener('featureSelected', handleFeatureSelect);
          window.removeEventListener('featureDeselected', handleFeatureDeselect);
          window.removeEventListener('featureUpdated', handleFeatureUpdate);
        };

        L.DomEvent.disableClickPropagation(container);
        return container;
      }
    });

    const infoControl = new InfoControl({ position: 'topright' });
    infoControl.addTo(map);

    return () => {
      map.removeControl(infoControl);
    };
  }, [map]);

  return null;
};

export default InfoBox;