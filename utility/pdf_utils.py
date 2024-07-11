import fitz  # PyMuPDF
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import red
from reportlab.pdfgen.pathobject import PDFPathObject
from reportlab.lib.colors import Color
import json
from pdf_overlay import merge_pdfs

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
            c.setStrokeColor(Color(*(0, 1, 0), alpha=feature['stroke_opacity']))
            c.setLineJoin(1)
            if feature['width']:
                c.setLineWidth(feature['width'])
            else:
                c.setLineWidth(1)
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

if __name__ == "__main__":
    extract_features('planting_beds.pdf', 'features.json')
    draw_from_json('features.json', 'output.pdf')
    merge_pdfs('planting_beds.pdf', 0, 'output.pdf', 'overlay_beds.pdf')