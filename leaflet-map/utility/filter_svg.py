from xml.etree import ElementTree as ET

# Function to find all paths with a specific fill color
def find_all_paths_with_color(svg_root, color_value):
    paths_with_color = []
    for element in svg_root.iter('{http://www.w3.org/2000/svg}path'):
        if 'fill' in element.attrib and element.attrib['fill'] == color_value:
            paths_with_color.append(element.attrib)
    return paths_with_color

# Function to extract specific elements by their attributes
def extract_elements_by_attributes(svg_root, color_value):
    new_root = ET.Element(svg_root.tag, svg_root.attrib)
    
    # Append <defs> section first
    defs = svg_root.find('{http://www.w3.org/2000/svg}defs')
    if defs is not None:
        new_root.append(defs)
    
    # Append elements that match the attributes in the attributes_list
    for element in svg_root.iter('{http://www.w3.org/2000/svg}path'):
        if 'fill' in element.attrib and element.attrib['fill'] == color_value:
            new_root.append(element)
    
    return new_root

# Load and parse the SVG file
planting_beds_svg_path = 'mnt/data/planting_beds.svg'  # Replace with your file path
tree_planting_beds = ET.parse(planting_beds_svg_path)
root_planting_beds = tree_planting_beds.getroot()

# Define the red color value to search for
red_color_value = 'rgb(100%, 0%, 0%)'  # Red color representation

# Extract paths with red color from planting_beds.svg
filtered_root_red_paths = extract_elements_by_attributes(root_planting_beds, red_color_value)

# Save the filtered SVG containing only red paths
filtered_red_paths_svg_path = 'mnt/data/filtered_red_paths.svg'  # Replace with your desired file path
filtered_tree_red_paths = ET.ElementTree(filtered_root_red_paths)
filtered_tree_red_paths.write(filtered_red_paths_svg_path)

print(f"Filtered SVG saved to {filtered_red_paths_svg_path}")
