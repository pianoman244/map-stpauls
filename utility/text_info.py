import fitz  # PyMuPDF

# Open the PDF file
file_path = 'tree_inventory.pdf'
pdf_document = fitz.open(file_path)

# Load page 4 (index 3 because pages are 0-indexed)
zone_a_page = pdf_document.load_page(3)

# Extract text with details
text_instances = zone_a_page.get_text("dict")

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