# map-stpauls
The beginnings of the Millville Atlas Project. This repository contains demos with Mapbox, Leaflet, and React I created to test out different mapping tools during my 2024 fellowship with St. Paul's School.

## admissions-clone
A demo of what "maps.sps.edu" could look like, with an embedded Mapbox map. The HTML/CSS is from the SPS Admissions page (https://www.sps.edu/admissions), and I wrote all the Mapbox code in app.js. The HTML elements overlaid on the map are added in index.html and updated throughout app.js. 

To view the page, just clone the repository and open index.html in a browser. To ensure Mapbox can access the datasets, run cors_server.py from a terminal. This will start a simple server on localhost port 8000 so Mapbox has a URL to access the sources. 

There are no package managers involved here. All the Mapbox JS is imported in script tags directly in index.html.

This folder is entirely self-contained (except for cors_server.py). You don't need to worry about any other code in this repository to run the demo. It's intentionally simple to keep the focus on the Mapbox code. Everything in this folder except for `index.html`, `css/maps.css`, and `maps/main.js` (along with the source data in `maps/data`) is copied from the SPS website to clone the site.
