import React from 'react';
import { TileLayer } from 'react-leaflet';

const MapboxTilesetViewer = ({ accessToken, tilesetId }) => {
  // Construct the tileset URL
  const tilesetUrl = `https://api.mapbox.com/v4/${tilesetId}/{z}/{x}/{y}.png?access_token=${accessToken}`;

  return (
    <TileLayer
      url={tilesetUrl}
      tileSize={512}
      zoomOffset={-1}
      maxZoom={22}
      attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
    />
  );
};

export default MapboxTilesetViewer;