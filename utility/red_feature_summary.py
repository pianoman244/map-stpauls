import fitz  # PyMuPDF

def analyze_vector_graphics_dynamic(pdf_path):
    # Open the PDF
    document = fitz.open(pdf_path)
    
    # Initialize feature counters and examples
    feature_counts = {}
    examples = {}

    # Define the red color in RGB
    red_color = (1.0, 0.0, 0.0)
    
    page = document.load_page(3)
    for item in page.get_drawings():
        # Get the stroke and fill colors
        stroke_color = item.get("color")
        fill_color = item.get("fill")
        if (stroke_color and tuple(stroke_color) == red_color) or (fill_color and tuple(fill_color) == red_color):
            op = item["type"]
            if op not in feature_counts:
                feature_counts[op] = 0
                examples[op] = item  # Store the first example of this type
            feature_counts[op] += 1

    # Display the summary
    print("Vector Graphics Features Summary:")
    for feature, count in feature_counts.items():
        print(f"{feature.capitalize()}: {count}")
        print(f"Example of {feature.capitalize()}: {examples[feature]}")
        print()

# Use the function with your PDF file path
pdf_path = 'tree_inventory.pdf'
analyze_vector_graphics_dynamic(pdf_path)
