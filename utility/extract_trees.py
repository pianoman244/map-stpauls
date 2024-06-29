import fitz  # PyMuPDF
import re
import json
from matplotlib.transforms import Bbox
import os
from scipy.spatial import distance
import numpy as np
from scipy.optimize import linear_sum_assignment

# Coordinates for the top-right and bottom-left corners of Zone A
top_right = (43.196924, -71.572250)
bottom_left = (43.194975, -71.579557)

# Function to convert map coordinates to geo-coordinates
def map_to_geo(x, y, bbox):
    x_min, y_min = bbox.xmin, bbox.ymin
    x_max, y_max = bbox.xmax, bbox.ymax
    lon_min, lat_min = bottom_left
    lon_max, lat_max = top_right

    lat = lat_min + (y - y_min) / (y_max - y_min) * (lat_max - lat_min)
    lon = lon_min + (x - x_min) / (x_max - x_min) * (lon_max - lon_min)
    
    return lat, lon

def calculate_center(rect):
    x0, y0, x1, y1 = rect
    center_x = (x0 + x1) / 2
    center_y = (y0 + y1) / 2
    return center_x, center_y

def extract_dots(graphics):
    dot_coords = []

    # Define the red color in RGB
    red_color = (1.0, 0.0, 0.0)
    
    for item in graphics:
        # Get the stroke and fill colors
        stroke_color = item.get("color")
        fill_color = item.get("fill")
        red = (stroke_color and tuple(stroke_color) == red_color) or (fill_color and tuple(fill_color) == red_color)
        op = item["type"]
        if red and op == 's': # get all red stroke features (dots)
            center = calculate_center(item["rect"])
            dot_coords.append(center)
    
    return dot_coords

def extract_text(text_instances):
    # Extract numerical labels from the Zone A map on page 4 with coordinates
    labels = {}

    for block in text_instances["blocks"]:
        for line in block["lines"]:
            for span in line["spans"]:
                bbox = span["bbox"]
                text = span["text"]
                
                if len(text) <= 3 and text.isdigit():
                    center = calculate_center(bbox)
                    n = int(text)
                    labels[n] = {'coords': center, 'distance': None, 'verify': False, 'dot_coords': None}

    return labels

def inspect_assignments(labels, numbers):
    for n, label in labels.items():
        if n in numbers:
            print(f"Label {n}: coords ({label['coords'][0]:.1f}, {label['coords'][1]:.1f}) \t dot ({label['dot_coords'][0]:.1f}, {label['dot_coords'][1]:.1f}) \t (dist {label['distance']:.1f})")


def generate_pairings(labels, dots):
    dots_selected = []
    selections = {}
    for n, label in labels.items():
        min_dist = 100
        dot_selected = None
        
        for dot in dots:
            dist = distance.euclidean(dot, label['coords'])
            if dist < min_dist:
                label['dot_coords'] = dot
                label['distance'] = dist
                min_dist = dist
                dot_selected = dot
            if dist < 5:
                break
        
        if dot_selected in dots_selected:
            print("WARNING: closest dot to label ", n, " already selected by dot ", selections[dot_selected])
            label['verify'] = True
            labels[selections[dot_selected]]['verify'] = True
        else:
            dots_selected.append(dot_selected)
            selections[dot_selected] = n
        
    for n, label in labels.items():
        if label['verify']:
            print(f"Label {n}: coords {label['coords']} \t dot {label['dot_coords']} \t (dist {label['distance']})")
            
    assignments = []
    for n, label in labels.items():
        assignment = {'n': n, 'coords': label['dot_coords']}
        assignments.append(assignment)
        
    answer = input('Write to file? (y/n)')
    if answer in ['y', 'yes', 'Y', 'YES']:
        fname = input('File name please (no .json):')
        path = 'tree_extractions/' + fname + '.json'
        with open(path, 'w') as file:
            json.dump({'assignments': assignments}, file)

# Extract text and vector graphics from the PDF
pdf_path = "tree_inventory.pdf"
doc = fitz.open(pdf_path)

page = doc[3]

# Extract text blocks
text_blocks = page.get_text("dict")
labels = extract_text(text_blocks)
with open('zone_a_extras.json', 'r') as file:
    data = json.load(file)
    
    for label in data["extra_labels"]:
        n = label['text']
        labels[n] = {}
        labels[n]['coords'] = (label['coords'][0], label['coords'][1])
        labels[n]['distance'] = None
        labels[n]['verify'] = False
        labels[n]['dot_coords'] = None


# Extract vector graphics (dots)
vector_graphics = page.get_drawings()

# Filter text blocks to get the labels and their positions
dots = extract_dots(vector_graphics)
#print(len(dots))

generate_pairings(labels, dots)