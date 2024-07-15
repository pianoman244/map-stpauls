import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const SaveButton = ({ selectedEditLayerRef, layerGroupsRef }) => {
  const map = useMap();

  useEffect(() => {
    const SaveControl = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('button', 'save-button button-common', container);
        button.type = 'button';
        button.title = 'Save GeoJSON to Backend';
        button.innerHTML = '<i class="fa fa-save"></i> Save Edits';

        L.DomEvent.on(button, 'click', function(e) {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);
          
          if (selectedEditLayerRef.current) {
            const layerGroup = layerGroupsRef.current[selectedEditLayerRef.current.id];
            if (layerGroup) {
              const geoJSON = layerGroup.toGeoJSON();
              const id = selectedEditLayerRef.current.id || 'noLayerSelected';

              fetch('http://localhost:3001/save-layers', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id: id,
                  data: geoJSON
                }),
              })
                .then(response => response.json())
                .then(data => {
                  console.log('Success:', data);
                  alert('File saved successfully');
                })
                .catch((error) => {
                  console.error('Error:', error);
                  alert('Error saving file');
                });
            } else {
              console.error("No layer group found for the selected edit layer");
              alert("No layer group found for the selected edit layer");
            }
          } else {
            console.error("No layer selected for editing");
            alert("No layer selected for editing");
          }
        });

        return container;
      }
    });

    const saveControl = new SaveControl({ position: 'bottomleft' });
    saveControl.addTo(map);

    return () => {
      map.removeControl(saveControl);
    };
  }, [map, selectedEditLayerRef, layerGroupsRef]);

  return null;
};

export default SaveButton;