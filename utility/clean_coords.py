import json
from math import isclose

# Function to remove LineString features with less than 3 points
def filter_short_linestrings(geojson_data):
    filtered_features = []
    for feature in geojson_data['features']:
        if feature['geometry']['type'] == 'LineString':
            coordinates = feature['geometry']['coordinates']
            if len(coordinates) >= 3:
                filtered_features.append(feature)
        else:
            filtered_features.append(feature)  # Keep non-LineString features
    return {
        "type": "FeatureCollection",
        "features": filtered_features
    }

# Function to check if two coordinates are close within a given threshold
def are_coordinates_close(coord1, coord2, threshold):
    return isclose(coord1[0], coord2[0], abs_tol=threshold) and isclose(coord1[1], coord2[1], abs_tol=threshold)

# Function to remove the second of any consecutive close coordinates
def remove_close_coordinates(line_string, threshold):
    cleaned_coords = [line_string[0]]
    for coord in line_string[1:]:
        if not are_coordinates_close(coord, cleaned_coords[-1], threshold):
            cleaned_coords.append(coord)
    return cleaned_coords

# Load the GeoJSON data
with open('features.geojson', 'r') as f:
    geojson_data = json.load(f)

# Set the distance threshold for removing close points
distance_threshold = 0.000007  # Adjust this value as needed

# Clean the coordinates in each LineString feature
for feature in geojson_data['features']:
    if feature['geometry']['type'] == 'LineString':
        original_coords = feature['geometry']['coordinates']
        cleaned_coords = remove_close_coordinates(original_coords, distance_threshold)
        feature['geometry']['coordinates'] = cleaned_coords

# Save the cleaned GeoJSON data to a new file
with open('cleaned_features.geojson', 'w') as f:
    json.dump(geojson_data, f, indent=4)

print("Cleaned GeoJSON data saved to 'cleaned_features.geojson'")
