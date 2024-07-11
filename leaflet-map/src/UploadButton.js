// UploadButton.js

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const UploadButton = () => {
  const map = useMap();

  useEffect(() => {
    const UploadControl = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('label', 'upload-button', container);
        const input = L.DomUtil.create('input', 'file-input', button);
        
        button.innerHTML = '<i class="fa fa-upload"></i> Upload GeoJSON';
        input.type = 'file';
        input.style.display = 'none';
        
        // Styles
        Object.assign(button.style, {
          backgroundColor: '#4a8fee',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.3s ease',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        });

        // Hover effect
        button.onmouseover = function() {
          this.style.backgroundColor = '#3a7fd9';
        };
        button.onmouseout = function() {
          this.style.backgroundColor = '#4a8fee';
        };

        L.DomEvent.on(input, 'change', function(e) {
          const file = e.target.files[0];
          const reader = new FileReader();
          
          reader.onload = function(e) {
            const geoJSON = JSON.parse(e.target.result);
            L.geoJSON(geoJSON).addTo(map);
            localStorage.setItem('mapFeatures', JSON.stringify(geoJSON.features));
          };
          
          reader.readAsText(file);
        });

        return container;
      }
    });

    const uploadControl = new UploadControl({ position: 'bottomleft' });
    uploadControl.addTo(map);

    return () => {
      map.removeControl(uploadControl);
    };
  }, [map]);

  return null;
};

export default UploadButton;