from reportlab.lib.pagesizes import landscape
from reportlab.pdfgen import canvas
from PyPDF2 import PdfReader, PdfWriter, PageObject, Transformation
from PyPDF2.generic import RectangleObject
from io import BytesIO
import json

def create_overlay(assignments, output_overlay_path):
    packet = BytesIO()
    can = canvas.Canvas(packet, pagesize=(17*72, 11*72))
    
    for assignment in assignments:
        label_coords = assignment['coords']
        label_text = str(assignment['n'])
        can.setFillColorRGB(0, 0, 1)  # Bright blue color
        
        # Set font and size
        font_size = 4
        can.setFont("Helvetica", font_size)
        
        # Calculate width and height of the text to center it
        text_width = can.stringWidth(label_text, "Helvetica", font_size)
        text_height = font_size  # Approximation of text height
        
        # Draw the text centered around the coordinates
        x = label_coords[1] - (text_width / 2)
        y = label_coords[0] - (text_height / 2)
        can.drawString(x, y, label_text)
    
    can.save()
    packet.seek(0)
    with open(output_overlay_path, 'wb') as f:
        f.write(packet.getbuffer())

def merge_pdfs(original_pdf_path, page_num, overlay_pdf_path, output_pdf_path):
    original_pdf = PdfReader(original_pdf_path)
    overlay_pdf = PdfReader(overlay_pdf_path)
    writer = PdfWriter()
    writer._header = b'%PDF-1.3\n'

    original_page = original_pdf.pages[page_num]
    overlay_page = overlay_pdf.pages[0]
    
    # Credit to this forum for this code:
    # https://github.com/py-pdf/pypdf/issues/1280
    overlay_page.add_transformation(
    Transformation()
    .translate(-float(overlay_page.mediabox.width) / 2, -float(overlay_page.mediabox.height) / 2)
    .rotate(270)
    .translate(float(overlay_page.mediabox.height) / 2, float(original_page.mediabox.bottom + overlay_page.mediabox.width / 2))
    )

    # Manually update page boxes:
    new_width = overlay_page.mediabox.height
    new_heigth = overlay_page.mediabox.width
    new_y = original_page.mediabox.bottom

    overlay_page.update({'/ArtBox': RectangleObject([0, new_y, new_width, new_y + new_heigth])})
    overlay_page.update({'/BleedBox': RectangleObject([0, new_y, new_width, new_y + new_heigth])})
    overlay_page.update({'/CropBox': RectangleObject([0, new_y, new_width, new_y + new_heigth])})
    overlay_page.update({'/MediaBox': RectangleObject([0, new_y, new_width, new_y + new_heigth])})
    overlay_page.update({'/TrimBox': RectangleObject([0, new_y, new_width, new_y + new_heigth])})
    
    
    
    original_page.merge_page(overlay_page)
    writer.add_page(original_page)

    with open(output_pdf_path, 'wb') as f:
        writer.write(f)

path = 'tree_extractions/zone_a.json'
with open(path, 'r') as file:
    assignments = json.load(file)['assignments']

# Paths
original_pdf_path = 'tree_inventory.pdf'
page_num = 3 # zero-indexed
overlay_pdf_path = 'overlay.pdf'
output_pdf_path = 'zone_a_overlay.pdf'

# Create the overlay PDF
create_overlay(assignments, overlay_pdf_path)

# Merge the overlay with the original PDF
merge_pdfs(original_pdf_path, page_num, overlay_pdf_path, output_pdf_path)
