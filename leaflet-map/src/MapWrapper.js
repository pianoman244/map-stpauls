import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import Geoman from './Geoman';
import LayerControl from './LayerControl';
import InfoBox from './InfoBox';
import FeatureEditBox from './FeatureEditBox';
import DownloadButton from './DownloadButton';
import UploadButton from './UploadButton';
import ClearFeaturesButton from './ClearFeaturesButton';
import EditLayerSelector from './EditLayerSelector';
import CustomEditingControls from './CustomEditingControls';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Import GeoJSON data
import landscapingData from './data/landscaping.json';
import treesData from './data/trees.json';
import trailsData from './data/trails.json';
import buildingsData from './data/buildings.json';
import flowerBedsData from './data/flower_beds.json';

mapboxgl.accessToken = 'pk.eyJ1IjoicGlhbm9tYW4yNCIsImEiOiJjbHhjYjRnNHQwOWttMnFvbjlzc2Z2bXkwIn0.mOh5fw5vP2zvcN2Go09w8A';

const MapWrapper = () => {
  const [layers, setLayers] = useState([
    { id: 'landscaping', name: 'Zones', active: true, data: landscapingData, editFeatureCount: 8 },
    { id: 'trees', name: 'Trees', active: false, data: treesData },
    { id: 'trails', name: 'Trails', active: false, data: trailsData, editFeatureCount: 12 },
    { id: 'buildings', name: 'Buildings', active: false, data: buildingsData, editFeatureCount: 5 },
    { id: 'flowerBeds', name: 'Flowers', active: false, data: flowerBedsData, editFeatureCount: 5 },
  ]);

  const selectedEditLayerRef = useRef(layers[0]);
  const isEditingRef = useRef(false);
  const [isEditingState, setIsEditingState] = useState(isEditingRef.current); // Sync state for re-renders
  const layerGroupsRef = useRef({});
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
    const syncIsEditing = () => {
      setIsEditingState(isEditingRef.current);
    };
    const interval = setInterval(syncIsEditing, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isEditingRef]);

  const handleLayerToggle = useCallback((layerId, isActive) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === layerId ? { ...layer, active: isActive } : layer
      )
    );
  }, []);

  const handleEditLayerSelect = useCallback((layer) => {
    selectedEditLayerRef.current = layer;
    handleLayerToggle(layer?.id, true);
    if (highlightedFeatureRef.current) {
      unhighlightFeature(highlightedFeatureRef.current);
    }
    const deselectEvent = new CustomEvent('featureDeselected');
    window.dispatchEvent(deselectEvent);
  }, [handleLayerToggle]);

  const handleBasemapChange = (basemapId) => {
    setCurrentBasemap(basemapId);
  };

  const handleSVGOverlayToggle = () => {
    setShowSVGOverlay(!showSVGOverlay);
  };

  const highlightedFeatureRef = useRef(null);

  const isValidColor = useCallback((color) => {
    if (!color || typeof color !== 'string') return false;
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  }, []);

  const styleFunction = useCallback((feature) => {
    const baseStyle = {
      weight: 1.5,
      opacity: 0.7,
      color: feature.properties.color || '#3388ff',
      fillOpacity: 0.15
    };

    switch (feature.geometry.type) {
      case 'Polygon':
        return {
          ...baseStyle,
          fillColor: feature.properties.color || '#3388ff',
        };
      case 'LineString':
        if (feature.properties.type === 'flowerBed') {
          return {
            ...baseStyle,
            color: feature.properties.color || '#FF69B4',
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 5'
          };
        }
        let trailColor = baseStyle.color;
        if (feature.properties.blaze && isValidColor(feature.properties.blaze)) {
          trailColor = feature.properties.blaze;
        }
        return {
          ...baseStyle,
          weight: 2,
          color: trailColor,
          opacity: 0.8
        };
      case 'Point':
        return {
          ...baseStyle,
          radius: 4,
          fillColor: feature.properties.color || 'forestgreen',
          color: "#000",
          weight: 1,
          opacity: 0.7,
          fillOpacity: 0.4
        };
      default:
        return baseStyle;
    }
  }, [isValidColor]);

  const highlightFeature = useCallback((e) => {
    const layer = e.target;
    try {
      if (layer.setStyle) {
        layer.setStyle({
          weight: 3,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.5,
          opacity: 1
        });
      }
      if (layer.bringToFront) {
        layer.bringToFront();
      }
      highlightedFeatureRef.current = layer;
    } catch (error) {
      console.error('Error highlighting feature:', error);
    }
  }, []);

  const unhighlightFeature = useCallback((e) => {
    const layer = e.layer || highlightedFeatureRef.current;
    if (!layer) return;
    try {
      if (layer.feature) {
        layer.setStyle(styleFunction(layer.feature));
      }
      highlightedFeatureRef.current = null;
    } catch (error) {
      console.error('Error unhighlighting feature:', error);
    }
  }, [styleFunction]);

  const handleFeatureClick = useCallback((e) => {
    try {
      const layer = e.target;
      if (highlightedFeatureRef.current && highlightedFeatureRef.current !== layer) {
        unhighlightFeature({ target: highlightedFeatureRef.current });
      }
      highlightFeature(e);

      const selectEvent = new CustomEvent('featureSelected', {
        detail: {
          featureType: layer.feature.geometry.type,
          featureData: layer.feature,
          layer: layer,
          layerId: layer.feature.geometry.type
        }
      });
      window.dispatchEvent(selectEvent);
    } catch (error) {
      console.error('Error handling feature click:', error);
    }
  }, [highlightFeature, unhighlightFeature]);

  const addLayerListeners = useCallback((layer) => {
    layer.on({
      click: handleFeatureClick
    });
  }, [handleFeatureClick]);

  const removeLayerListeners = useCallback((layer) => {
    layer.off({
      click: handleFeatureClick
    });
  }, [handleFeatureClick]);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer
        center={[43.192, -71.58]}
        zoom={15.5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={false}
      >
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/${currentBasemap}/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxgl.accessToken}`}
          attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
          maxZoom={21}
        />
        <Geoman
          layers={layers}
          selectedEditLayerRef={selectedEditLayerRef}
          layerGroupsRef={layerGroupsRef}
          isEditingRef={isEditingRef}
          styleFunction={styleFunction}
          addLayerListeners={addLayerListeners}
          removeLayerListeners={removeLayerListeners}
        />
        <LayerControl
          layers={layers}
          onLayerToggle={handleLayerToggle}
          basemaps={basemaps}
          currentBasemap={currentBasemap}
          onBasemapChange={handleBasemapChange}
          showSVGOverlay={showSVGOverlay}
          onSVGOverlayToggle={handleSVGOverlayToggle}
          isEditingRef={isEditingRef}
          selectedEditLayerRef={selectedEditLayerRef}
        />
        <InfoBox />
        <FeatureEditBox />
        <UploadButton />
        <DownloadButton />
        <EditLayerSelector
          layers={layers}
          selectedEditLayerRef={selectedEditLayerRef}
          isEditingRef={isEditingRef}
          onLayerSelect={handleEditLayerSelect}
        />
      </MapContainer>
    </div>
  );
};

export default MapWrapper;
