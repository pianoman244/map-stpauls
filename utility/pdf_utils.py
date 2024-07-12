import fitz  # PyMuPDF
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import red
from reportlab.pdfgen.pathobject import PDFPathObject
from reportlab.lib.colors import Color
import json
from pdf_overlay import merge_pdfs
import math

'''
Print information about the text on an input PDF page.
'''
def print_page_text_info(page):
    text_instances = page.get_text("dict")
    count = 0
    
    # Function to print details about each text block
    for block in text_instances["blocks"]:
        for line in block["lines"]:
            for span in line["spans"]:
                bbox = span["bbox"]
                text = span["text"]
                
                if len(text) <= 3 and text.isdigit():
                    print(f"Text: {text}")
                    print(f"BBox: {bbox}")
                    print()
    
    print("Count:", count)

'''
Prints all the different colors in vector features in the input document along with one example.
'''
def color_info(pdf_path):
    # Open the PDF
    document = fitz.open(pdf_path)
    
    # Initialize a dictionary to store colors and examples
    color_examples = {}

    # Iterate through pages
    for page_num in range(len(document)):
        page = document.load_page(page_num)
        for item in page.get_drawings():
            # Get the color of the current item
            color = item.get("color") or item.get("fill")
            if color:
                # Convert color to a tuple to use as a dictionary key
                color_tuple = tuple(color)
                if color_tuple not in color_examples:
                    color_examples[color_tuple] = item

    # Display the colors and examples
    print("Colors and Examples:")
    for color, example in color_examples.items():
        print(f"Color: {color}")
        print(f"Example: {example}")
        print()
        
'''
Extracts all red features (hex #FF0000) from a page of a PDF.

Debug info prints examples of every feature and color for convenience.
'''
def extract_red_features(page, debug=False):
    red_color = (1.0, 0.0, 0.0)
    drawings = page.get_drawings()
    features = {
        's': [],
        'f': [],
        'fs': []
    }
    
    colors = set()
    types = set()
    examples = []
    
    for item in drawings:
        
        item_type = item['type']
        if item_type not in types:
            examples.append(item)
        types.add(item_type)
        
        color = None
        if item['type'] == 's':
            color = item.get("color")
        elif item['type'] == 'f':
            color = item.get("fill")
        elif item['type'] == 'fs':
            color = item.get("color")
            
        colors.add(color)
        
        if color and tuple(color) == red_color:
            features[item_type].append(item)
    
    def print_debug():         
        print("Colors:", colors)
        print("Types:", types)
        print("Type examples:")
        for e in examples:
            print()
            print(e)
    
    if debug:
        print_debug()
    
    return features

'''
Converts a list of PDF drawings into a valid JSON object.
'''
def jsonify_features(features):
    def convert_point(point):
        return [point.x, point.y]
    
    def convert_item(item):
        kind = item[0]
        if kind == 'l':
            kind, point1, point2 = item
            return [kind, convert_point(point1), convert_point(point2)]
        else:
            print(item)
            return ['unknown', []]
        
    def convert(stroke):
        stroke['items'] = [convert_item(i) for i in stroke['items']]
        stroke['color'] = list(stroke['fill']) if stroke['type'] == 'f' else list(stroke['color'])
        stroke['lineCap'] = list(stroke['lineCap']) if stroke['lineCap'] else None
        stroke['rect'] = list(stroke['rect'])
        return stroke
    
    return [convert(stroke) for stroke in features]

'''
Extract the red features from an input PDF.
'''
def extract_features(pdf, outpath, page_num=1, debug=False):
    doc = fitz.open(pdf)
    page = doc[page_num - 1]
    features = extract_red_features(page)
    
    if debug:
        print("features:")
        [print(k, len(v)) for k, v in features.items()]
        
    json_data = jsonify_features(features['s'] + features['f'] + features['fs'])
    with open(outpath, 'w') as f:
        json.dump(json_data, f, indent=4)
        if debug:
            print(f"extracted features to {outpath} successfully")

'''
Draw a feature on the input canvas (height is canvas height in pixels)
'''
def draw_feature(c, feature, width, height):
    for item in feature['items']:
        if item[0] == 'l':  # Line
            start = item[1]
            end = item[2]
            c.setStrokeColor(Color(*(0, 1, 0), alpha=0.5))
            c.setLineJoin(1)
            c.setLineWidth(0.5)
            c.line(start[0], height - start[1], end[0], height - end[1])
        else:
            print("Non-line item:\n",item)
        # Add more cases here for other types of items if needed

'''
Draw the features at the input JSON path in a PDF
'''
def draw_from_json(json_path, output_path):
    # Load the JSON data
    with open(json_path, 'r') as f:
        features = json.load(f)

    # Create a new PDF
    page_width = 48 * 72  # 3456 points
    page_height = 36 * 72  # 2592 points
    page_size = (page_width, page_height)
    c = canvas.Canvas(output_path, pagesize=page_size)

    # Iterate through the features and draw them
    for feature in features:
        draw_feature(c, feature, page_width, page_height)

    # Save the PDF
    c.showPage()
    c.save()

    print(f"PDF {output_path} generated from features at {json_path}")

def pdf_to_geo_old(bounds, x, y, rotation=None):
    """
    Convert PDF coordinates to geographic coordinates (latitude and longitude).
    
    Args:
    - bounds (dict): A dictionary containing the bounds information.
    - x (float): The x-coordinate in PDF.
    - y (float): The y-coordinate in PDF.
    
    Returns:
    - (lat, lon) (tuple): The corresponding latitude and longitude.
    """

    # Extract bounds
    x_min, x_max = bounds['x']
    y_min, y_max = bounds['y']
    lat_min, lat_max = bounds['lat']
    lon_min, lon_max = bounds['lon']
    
    # Normalize PDF coordinates to a [0, 1] range
    x_norm = (x - x_min) / (x_max - x_min)
    y_norm = (y - y_min) / (y_max - y_min)
    
    if rotation:
        # Calculate the center of the bounding box
        center_lat = (lat_min + lat_max) / 2
        center_lon = (lon_min + lon_max) / 2

        big_angle_radians = rotation

        # Translate coordinates to the center of the bounding box
        x = lat_min + x_norm * (lat_max - lat_min)
        y = lon_min + y_norm * (lon_max - lon_min)
        
        y = (lon_max - lon_min) - (y - lon_min) + lon_min

        # Translate to origin (center of bounding box)
        x_prime = x - center_lat
        y_prime = y - center_lon

        # Apply rotation
        x_double_prime = x_prime * math.cos(big_angle_radians) - y_prime * math.sin(big_angle_radians)
        y_double_prime = x_prime * math.sin(big_angle_radians) + y_prime * math.cos(big_angle_radians)

        # Translate back
        lat = x_double_prime + center_lat
        lon = y_double_prime + center_lon
        
    else:
        # Convert normalized coordinates to latitude and longitude
        lat = lat_min + y_norm * (lat_max - lat_min)
        lon = lon_min + x_norm * (lon_max - lon_min)
    
    return lat, lon

'''
Converts PDF coordinates (as shown on the inspector) to latitude and longitude.
Automatically handles y-coordinate inversion.

The bounding box geospatial coordinates should correspond to the bottom-left and top-right of the PDF.
Dimensions are the height and width of the page.
'''
def pdf_to_geo(bounds, dimensions, x, y):
    # Extract bounds
    height = dimensions['height']
    width = dimensions['width']
    lat_min, lat_max = bounds['lat']
    lon_min, lon_max = bounds['lon']
    
    y = height - y # invert y-axis
    
    # Normalize PDF coordinates to a [0, 1] range
    x_norm = x / width
    y_norm = y / height
    
    # Convert normalized coordinates to latitude and longitude
    lat = lat_min + y_norm * (lat_max - lat_min)
    lon = lon_min + x_norm * (lon_max - lon_min)
    
    return {
        'lat': lat,
        'lon': lon
    }
    
def features_to_geojson(features, bounds, dimensions, outfile):
    # Convert PDF features to GeoJSON LineString features
    geojson_features = []

    for feature in features:
        coordinates = []
        for item in feature['items']:
            if item[0] == 'l':  # Line
                start_pdf, end_pdf = item[1], item[2]
                start_geo = pdf_to_geo(bounds, dimensions, *start_pdf)
                end_geo = pdf_to_geo(bounds, dimensions, *end_pdf)
                coordinates.append((start_geo['lon'], start_geo['lat']))
                coordinates.append((end_geo['lon'], end_geo['lat']))
        
        '''
        # Create GeoJSON LineString feature
        geojson_feature = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            },
            "properties": {
                "stroke_opacity": feature['stroke_opacity'],
                "color": feature['color'],
                "width": feature['width'],
                "lineCap": feature['lineCap'],
                "lineJoin": feature['lineJoin'],
                "closePath": feature['closePath'],
                "dashes": feature['dashes'],
                "rect": feature['rect'],
                "layer": feature['layer'],
                "seqno": feature['seqno'],
                "fill": feature['fill'],
                "fill_opacity": feature['fill_opacity'],
                "even_odd": feature['even_odd']
            }
        }
        '''
        geojson_feature = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            },
            "properties": {}
        }
        geojson_features.append(geojson_feature)

    # Create the GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "features": geojson_features
    }

    # Save the GeoJSON data to a file
    with open(outfile, 'w') as f:
        json.dump(geojson, f, indent=4)

    print(f"GeoJSON data written to {outfile}")

if __name__ == "__main__":
    
    def do_stuff():
        extract_features('planting_beds.pdf', 'features.json')
        draw_from_json('features.json', 'output.pdf')
        merge_pdfs('planting_beds.pdf', 0, 'output.pdf', 'overlay_beds.pdf')
    
    #do_stuff()
    
    def update_geojson():
        features_path = 'features.json'
        bounds = {
            'lon': (-71.588187, -71.568522),
            'lat': (43.187356, 43.198032)
        }
        dimensions = {
            'height': 2562,
            'width': 3456
        }
        
        with open(features_path, 'r') as f:
            features = json.load(f)
            features_to_geojson(features, bounds, dimensions, 'features.geojson')
    
    update_geojson()