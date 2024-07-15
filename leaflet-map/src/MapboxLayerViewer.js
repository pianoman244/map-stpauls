import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'mapbox-gl-leaflet';

const MapboxLayerViewer = ({ accessToken, styleUrl }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const mapboxLayer = L.mapboxGL({
      accessToken: accessToken,
      style: styleUrl,
      attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
    });

    map.addLayer(mapboxLayer);

    return () => {
      map.removeLayer(mapboxLayer);
    };
  }, [map, accessToken, styleUrl]);

  return null;
};

export default MapboxLayerViewer;