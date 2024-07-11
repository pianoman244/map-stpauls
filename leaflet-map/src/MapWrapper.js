// In MapWrapper.js

import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import Geoman from './Geoman';
import InfoBox from './InfoBox';
import FeatureEditBox from './FeatureEditBox';
import DownloadButton from './DownloadButton';
import UploadButton from './UploadButton';
import ClearFeaturesButton from './ClearFeaturesButton';

const MapWrapper = () => {
  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer center={[43.19, -71.58]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Geoman />
        <InfoBox />
        <FeatureEditBox />
        <DownloadButton />
        <UploadButton />
        <ClearFeaturesButton />
      </MapContainer>
    </div>
  );
};

export default MapWrapper;