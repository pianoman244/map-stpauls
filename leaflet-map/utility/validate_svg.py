import xml.etree.ElementTree as ET

def check_svg(file_path):
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        if root.tag != '{http://www.w3.org/2000/svg}svg':
            print("Warning: Root element is not <svg> in the SVG namespace")
        else:
            print("Basic SVG structure seems okay")
        
        return True
    except ET.ParseError as e:
        print(f"XML parsing error: {e}")
        return False

def investigate_svg(file_path):
    try:
        # Parse the SVG file
        tree = ET.parse(file_path)
        root = tree.getroot()

        # Print the root tag and its attributes
        print(f"Root element: {root.tag}")
        print("Root attributes:", root.attrib)

        # Function to recursively search for elements
        def find_elements(element, level=0):
            print("  " * level + f"Element: {element.tag}")
            print("  " * level + f"Attributes: {element.attrib}")
            
            if element.text and element.text.strip():
                print("  " * level + f"Text content: {element.text.strip()}")
            
            for child in element:
                find_elements(child, level + 1)

        # Search for elements
        find_elements(root)

    except ET.ParseError as e:
        print(f"Error parsing SVG: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

# Usage
investigate_svg('red_paths.svg')


# Usage
file_path = 'red_paths.svg'
if check_svg(file_path):
    print("File parsed successfully, but may still have SVG-specific issues")
else:
    print("File could not be parsed as XML")
