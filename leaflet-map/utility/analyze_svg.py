import xml.etree.ElementTree as ET
import re

def parse_color(color_str):
    if color_str.startswith('rgb'):
        return color_str
    elif color_str.startswith('#'):
        return color_str
    else:
        return color_str

def extract_style_colors(style):
    colors = {}
    if style:
        fill_match = re.search(r'fill:(#?\w+|rgb\([^)]+\))', style)
        if fill_match:
            colors['fill'] = parse_color(fill_match.group(1))
        
        stroke_match = re.search(r'stroke:(#?\w+|rgb\([^)]+\))', style)
        if stroke_match:
            colors['stroke'] = parse_color(stroke_match.group(1))
    return colors

def analyze_svg(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    # Define the SVG namespace
    ns = {'svg': 'http://www.w3.org/2000/svg'}
    
    features = {}
    
    for elem in root.findall(".//*", ns):
        tag = elem.tag.split('}')[-1]  # Remove namespace
        
        if tag not in features:
            features[tag] = {'count': 0, 'colors': set()}
        
        features[tag]['count'] += 1
        
        # Check for fill and stroke attributes
        fill = elem.get('fill')
        stroke = elem.get('stroke')
        
        if fill:
            features[tag]['colors'].add(('fill', parse_color(fill)))
        if stroke:
            features[tag]['colors'].add(('stroke', parse_color(stroke)))
        
        # Check for colors in style attribute
        style_colors = extract_style_colors(elem.get('style'))
        for color_type, color in style_colors.items():
            features[tag]['colors'].add((color_type, color))
    
    return features

def print_analysis(features):
    for tag, data in features.items():
        print(f"\nFeature: {tag}")
        print(f"Count: {data['count']}")
        if data['colors']:
            print("Colors:")
            for color_type, color in sorted(data['colors']):
                print(f"  - {color_type}: {color}")
        else:
            print("No color information found for this feature.")

if __name__ == "__main__":
    svg_file = "planting_beds.svg"  # Replace with your SVG file path
    features = analyze_svg(svg_file)
    print_analysis(features)