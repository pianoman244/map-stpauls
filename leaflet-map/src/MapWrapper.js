import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import Geoman from './Geoman';
import InfoBox from './InfoBox';
import FeatureEditBox from './FeatureEditBox';
import DownloadButton from './DownloadButton';
import UploadButton from './UploadButton';
import ClearFeaturesButton from './ClearFeaturesButton';
import LayerControl from './LayerControl';

// Import GeoJSON data
import landscapingData from './data/landscaping.json';
import treesData from './data/trees.json';
import trailsData from './data/trails.json';
import buildingsData from './data/buildings.json';
import flowerBedsData from './data/flower_beds.json';

const MapWrapper = () => {
  const [layers, setLayers] = useState([
    { id: 'landscaping', name: 'Landscaping Zones', active: true, data: null },
    { id: 'trees', name: 'Campus Trees', active: false, data: null },
    { id: 'trails', name: 'Trails', active: false, data: null },
    { id: 'buildings', name: 'Buildings', active: false, data: null },
    { id: 'flowerBeds', name: 'Flower Beds', active: false, data: null }
  ]);

  useEffect(() => {
    setLayers(prevLayers => prevLayers.map(layer => {
      let data;
      switch (layer.id) {
        case 'landscaping':
          data = landscapingData;
          break;
        case 'trees':
          data = treesData;
          break;
        case 'trails':
          data = trailsData;
          break;
        case 'buildings':
          data = buildingsData;
          break;
        case 'flowerBeds':  // Add this case
          data = flowerBedsData;
          break;
        default:
          data = null;
      }
      return { ...layer, data };
    }));
  }, []);

  const handleLayerToggle = (layerId, isActive) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === layerId ? { ...layer, active: isActive } : layer
      )
    );
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer center={[43.19, -71.58]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Geoman layers={layers} />
        <InfoBox />
        <FeatureEditBox />
        <DownloadButton />
        <UploadButton />
        <ClearFeaturesButton />
        <LayerControl layers={layers} onLayerToggle={handleLayerToggle} />
      </MapContainer>
    </div>
  );
};

export default MapWrapper;