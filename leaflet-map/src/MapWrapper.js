import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, SVGOverlay } from 'react-leaflet';
import Geoman from './Geoman';
import InfoBox from './InfoBox';
import FeatureEditBox from './FeatureEditBox';
import DownloadButton from './DownloadButton';
import UploadButton from './UploadButton';
import ClearFeaturesButton from './ClearFeaturesButton';
import LayerControl from './LayerControl';
import ZoomBasedSVG from './ZoomBasedSVG';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Import GeoJSON data
import landscapingData from './data/landscaping.json';
import treesData from './data/trees.json';
import trailsData from './data/trails.json';
import buildingsData from './data/buildings.json';
import flowerBedsData from './data/flower_beds.json';

// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoicGlhbm9tYW4yNCIsImEiOiJjbHhjYjRnNHQwOWttMnFvbjlzc2Z2bXkwIn0.mOh5fw5vP2zvcN2Go09w8A';

const MapWrapper = () => {
  const [layers, setLayers] = useState([
    { id: 'landscaping', name: 'Landscaping Zones', active: true, data: null },
    { id: 'trees', name: 'Campus Trees', active: false, data: null },
    { id: 'trails', name: 'Trails', active: false, data: null },
    { id: 'buildings', name: 'Buildings', active: false, data: null },
    { id: 'flowerBeds', name: 'Flower Beds', active: false, data: null },
  ]);

  const [currentBasemap, setCurrentBasemap] = useState('streets-v11');
  const [showSVGOverlay, setShowSVGOverlay] = useState(false);

  const basemaps = [
    { id: 'streets-v11', name: 'Streets' },
    { id: 'outdoors-v11', name: 'Outdoors' },
    { id: 'light-v10', name: 'Light' },
    { id: 'dark-v10', name: 'Dark' },
    { id: 'satellite-v9', name: 'Satellite' },
  ];

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
        case 'flowerBeds':
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

  const handleBasemapChange = (basemapId) => {
    setCurrentBasemap(basemapId);
  };

  const handleSVGOverlayToggle = () => {
    setShowSVGOverlay(!showSVGOverlay);
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer center={[43.192, -71.58]} zoom={15.5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/${currentBasemap}/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxgl.accessToken}`}
          attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
        />
        <Geoman layers={layers} />
        <InfoBox />
        <FeatureEditBox />
        <DownloadButton />
        <UploadButton />
        <ClearFeaturesButton />
        <LayerControl 
          layers={layers} 
          onLayerToggle={handleLayerToggle} 
          basemaps={basemaps}
          currentBasemap={currentBasemap}
          onBasemapChange={handleBasemapChange}
          showSVGOverlay={showSVGOverlay}
          onSVGOverlayToggle={handleSVGOverlayToggle}
        />
        {showSVGOverlay && <ZoomBasedSVG />}  {/* Add the ZoomBasedSVG component */}
      </MapContainer>
    </div>
  );
};

export default MapWrapper;