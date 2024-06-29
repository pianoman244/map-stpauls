import fitz  # PyMuPDF

def extract_colors(pdf_path):
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

# Use the function with your PDF file path
pdf_path = 'tree_inventory.pdf'
extract_colors(pdf_path)
