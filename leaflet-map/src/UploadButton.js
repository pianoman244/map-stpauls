import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import './App.css'; // Import the CSS file

const UploadButton = () => {
  const map = useMap();

  useEffect(() => {
    const UploadControl = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('label', 'upload-button button-common', container); // Add button-common class
        const input = L.DomUtil.create('input', 'file-input', button);
        
        button.innerHTML = '<i class="fa fa-upload"></i> Upload GeoJSON';
        input.type = 'file';
        input.style.display = 'none';

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
