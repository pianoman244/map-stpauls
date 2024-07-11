from lxml import etree

def is_red_feature(element):
    stroke = element.get('stroke')
    if stroke in ['rgb(100%, 0%, 0%)', 'rgb(60.351562%, 10.594177%, 11.767578%)']:
        return True
    return False

def extract_red_paths(input_svg, output_svg):
    # Parse the SVG file
    tree = etree.parse(input_svg)
    root = tree.getroot()

    # Create a new SVG document for the output
    new_root = etree.Element("svg", nsmap={None: "http://www.w3.org/2000/svg"})

    # SVG namespace
    ns = {"svg": "http://www.w3.org/2000/svg"}

    # Find all path elements
    paths = root.xpath("//svg:path", namespaces=ns)

    for path in paths:
        if is_red_feature(path):
            # If the path is red, add it to the new SVG
            new_root.append(path)

    # Write the new SVG file
    new_tree = etree.ElementTree(new_root)
    new_tree.write(output_svg, pretty_print=True, xml_declaration=True, encoding="utf-8")

# Usage
extract_red_paths("planting_beds.svg", "red_paths.svg")