import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import './App.css'; // Import the CSS file

const DownloadButton = () => {
  const map = useMap();

  useEffect(() => {
    const DownloadControl = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('button', 'download-button button-common', container); // Add button-common class
        button.type = 'button';
        button.title = 'Copy GeoJSON to Clipboard';
        button.innerHTML = '<i class="fa fa-clipboard"></i> Copy GeoJSON';

        L.DomEvent.on(button, 'click', function(e) {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);
          
          const features = [];
          map.eachLayer((layer) => {
            if (layer instanceof L.Path || layer instanceof L.Marker) {
              if (layer.feature) {
                features.push(layer.feature);
              } else {
                features.push(layer.toGeoJSON());
              }
            }
          });

          const geoJSONData = {
            type: 'FeatureCollection',
            features: features,
          };

          const geoJSONString = JSON.stringify(geoJSONData);

          navigator.clipboard.writeText(geoJSONString).then(() => {
            alert('GeoJSON copied to clipboard');
          }).catch(err => {
            console.error('Could not copy text: ', err);
          });
        });

        return container;
      }
    });

    const downloadControl = new DownloadControl({ position: 'bottomleft' });
    downloadControl.addTo(map);

    return () => {
      map.removeControl(downloadControl);
    };
  }, [map]);

  return null;
};

export default DownloadButton;
