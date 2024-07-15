import React, { useState, useEffect } from 'react';
import { useMap, ImageOverlay } from 'react-leaflet';

const PNGViewer = () => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  // State for bounds
  const [southWestLat, setSouthWestLat] = useState(43.18727);
  const [southWestLng, setSouthWestLng] = useState(-71.58594);
  const [northEastLat, setNorthEastLat] = useState(43.19793);
  const [northEastLng, setNorthEastLng] = useState(-71.5708);

  // Define the bounds of your image using state
  const bounds = [
    [southWestLat, southWestLng], // Southwest coordinates
    [northEastLat, northEastLng]  // Northeast coordinates
  ];

  // Path to your PNG file
  const imagePath = 'planting_beds.png';

  // Update the zoom state when the map zoom changes
  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  return (
    <>
      <ImageOverlay
        url={imagePath}
        bounds={bounds}
        opacity={1}
        zIndex={10} // Adjust as needed
      />
    </>
  ); 
  /*
      <form className="bounds-form">
        <h3>Set Bounds</h3>
        <label>
          Southwest Latitude:
          <input
            type="number"
            step="0.00001"
            value={southWestLat}
            onChange={(e) => setSouthWestLat(parseFloat(e.target.value))}
          />
        </label>
        <label>
          Southwest Longitude:
          <input
            type="number"
            step="0.00001"
            value={southWestLng}
            onChange={(e) => setSouthWestLng(parseFloat(e.target.value))}
          />
        </label>
        <label>
          Northeast Latitude:
          <input
            type="number"
            step="0.00001"
            value={northEastLat}
            onChange={(e) => setNorthEastLat(parseFloat(e.target.value))}
          />
        </label>
        <label>
          Northeast Longitude:
          <input
            type="number"
            step="0.00001"
            value={northEastLng}
            onChange={(e) => setNorthEastLng(parseFloat(e.target.value))}
          />
        </label>
      </form>
    </>
  );
  */
};



export default PNGViewer;
