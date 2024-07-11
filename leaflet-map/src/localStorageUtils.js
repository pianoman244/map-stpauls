// src/localStorageUtils.js

export const saveFeature = (id, feature) => {
    localStorage.setItem(`feature_${id}`, JSON.stringify(feature));
    let featureIndex = JSON.parse(localStorage.getItem('featureIndex')) || [];
    if (!featureIndex.includes(id)) {
      featureIndex.push(id);
      localStorage.setItem('featureIndex', JSON.stringify(featureIndex));
    }
  };
  
  export const updateFeature = (id, feature) => {
    localStorage.setItem(`feature_${id}`, JSON.stringify(feature));
  };
  
  export const removeFeature = (id) => {
    localStorage.removeItem(`feature_${id}`);
    let featureIndex = JSON.parse(localStorage.getItem('featureIndex')) || [];
    featureIndex = featureIndex.filter(featureId => featureId !== id);
    localStorage.setItem('featureIndex', JSON.stringify(featureIndex));
  };
  
  export const loadFeatures = () => {
    const featureIndex = JSON.parse(localStorage.getItem('featureIndex')) || [];
    return featureIndex.map(id => JSON.parse(localStorage.getItem(`feature_${id}`)));
  };
  