import { useMap } from 'react-leaflet';
import L from 'leaflet';

const ClearFeaturesButton = () => {
  const map = useMap();

  const clearFeatures = () => {
    localStorage.removeItem('mapFeatures');
    map.eachLayer((layer) => {
      if (layer instanceof L.Path && !(layer instanceof L.Circle)) {
        map.removeLayer(layer);
      }
    });
  };

  return (
    <button 
      onClick={clearFeatures}
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        padding: '10px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Clear Features
    </button>
  );
};

export default ClearFeaturesButton;