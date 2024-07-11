def generate_svg(features):
    svg_header = '''<svg xmlns="http://www.w3.org/2000/svg" version="1.1">\n'''
    svg_footer = '''</svg>'''

    svg_content = ""
    for feature in features:
        svg_content += f'<path fill-rule="{feature["fill-rule"]}" fill="{feature["fill"]}" fill-opacity="{feature["fill-opacity"]}" d="{feature["d"]}"/>\n'

    svg_file_content = svg_header + svg_content + svg_footer
    return svg_file_content

# Example usage
features = [
    {
        "fill-rule": "evenodd",
        "fill": "rgb(100%, 0%, 0%)",
        "fill-opacity": "1",
        "d": "M 745.078125 2511.960938 L 755.039062 2505.601562 L 754.921875 2506.558594"
    },
    # Add more features as needed
]

svg_content = generate_svg(features)
with open("mnt/data/output.svg", "w") as svg_file:
    svg_file.write(svg_content)

print("SVG file generated successfully.")
