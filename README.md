# map-stpauls
This repository contains an interactive Mapbox map and lightweight web-based GIS data editor I created during my 2024 fellowship with St. Paul's School (SPS). The Mapbox map was a simple prototype using SPS datasets to demonstrate the tool's capabilities to the graphic design team. I created the GIS data editor to help me digitize some information about landscaper-planted campus trees, previously stored in a PDF with static maps, as well as some other landscaping data. 

The Leaflet-based editor is more built out. My main technical task at the fellowship was digitizing their static maps of campus trees and trails, and I built this editor to do it. The editing features come from a JavaScript library called Geoman. 

## admissions-clone
The interactive Mapbox map is here, embedded within a demo of what "maps.sps.edu" could look like. The HTML/CSS is from the SPS Admissions page (https://www.sps.edu/admissions), and all the Mapbox code is in app.js. There are no package managers; the Mapbox code is imported directly with script tags. The HTML elements overlaid on the map are all directly inside index.html (and updated dynamically in app.js). 

It has all campus trees, trails, buildings, and "landscaping zones". Keep in mind that this was a simple demo created in a week without prior Mapbox knowledge, intended to show basic functionality. 
* Currently each building is assigned a random year from SPS's founding to now, and the slider hides buildings newer than the selected date. Someone could eventually match each building with its actual construction date for an interesting animation.
* Yes, a layer selector and caption would make this more comprehensible to someone not in the room where I was presenting this demo.

It's deployed in a GitHub page in this repo: https://pianoman244.github.io/map-stpauls/admissions_clone/index.html

To run the page yourself, clone the repository and open index.html in a browser. To ensure Mapbox can access the datasets, run cors_server.py in the root of the repository from a terminal. This will start a simple server on localhost port 8000 so Mapbox has a URL to access the sources. The datasets are stored in `backend/data`.
