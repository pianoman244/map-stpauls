// ZoomBasedSVG.js
import React from 'react';
import { useMap, SVGOverlay } from 'react-leaflet';

const ZoomBasedSVG = () => {
  const map = useMap();
  const [zoom, setZoom] = React.useState(map.getZoom());

  React.useEffect(() => {
    const handleZoom = () => {
      setZoom(map.getZoom());
    };
    map.on('zoom', handleZoom);
    return () => {
      map.off('zoom', handleZoom);
    };
  }, [map]);

  const getSVGForZoom = () => {
    if (false) {
      return 'planting-low-detail.svg';
    } else if (false) {
      return 'planting-medium-detail.svg';
    } else {
      return 'planting_beds.svg';
    }
  };

  return (
    <SVGOverlay
      attributes={{ stroke: 'blue', strokeWidth: 2, fillOpacity: 0 }}
      bounds={[[43.17982, -71.58822], [43.20544, -71.56851]]}
    >
      <image href={getSVGForZoom()} width="100%" height="100%" />
    </SVGOverlay>
  );
};

export default ZoomBasedSVG;