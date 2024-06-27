mapboxgl.accessToken = 'pk.eyJ1IjoicGlhbm9tYW4yNCIsImEiOiJjbHhjYjRnNHQwOWttMnFvbjlzc2Z2bXkwIn0.mOh5fw5vP2zvcN2Go09w8A';

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/pianoman24/clxcb94sn09r301ql605egwtc',
    center: [-71.579588, 43.192937], // starting position [lng, lat]. Note that lat must be set between -90 and 90
    zoom: 15.12 // starting zoom
});