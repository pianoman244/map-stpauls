import fitz  # PyMuPDF
import re
import json
import geojson
from matplotlib.transforms import Bbox
import os
from scipy.spatial import distance
import numpy as np
from scipy.optimize import linear_sum_assignment
import pandas as pd
import re

# Supported zones and page numbers in tree inventory pdf
zones = ['a']
page_nums = [4]

# File path to tree inventory
inventory_path = "tree_inventory.pdf"

import geojson

def create_geojson_feature(lat, lon, text_label, properties):
    """
    Create a GeoJSON feature.

    Args:
    - lat (float): Latitude coordinate.
    - lon (float): Longitude coordinate.
    - text_label (str): Text label for the feature.
    - properties (dict): Additional properties for the feature.

    Returns:
    - geojson.Feature: A GeoJSON feature.
    """
    feature = geojson.Feature(
        geometry=geojson.Point((lon, lat)),
        properties={"id": text_label, **properties}
    )
    return feature

def pdf_to_geo(bounds, x, y):
    """
    Convert PDF coordinates to geographic coordinates (latitude and longitude).
    
    Args:
    - bounds (dict): A dictionary containing the bounds information.
    - x (float): The x-coordinate in PDF.
    - y (float): The y-coordinate in PDF.
    
    Returns:
    - (lat, lon) (tuple): The corresponding latitude and longitude.
    """
    # Extract bounds
    x_min, x_max = bounds['x']
    y_min, y_max = bounds['y']
    lat_min, lat_max = bounds['lat']
    lon_min, lon_max = bounds['lon']
    
    # Normalize PDF coordinates to a [0, 1] range
    x_norm = (x - x_min) / (x_max - x_min)
    y_norm = (y - y_min) / (y_max - y_min)
    
    # Convert normalized coordinates to latitude and longitude
    lat = lat_min + y_norm * (lat_max - lat_min)
    lon = lon_min + x_norm * (lon_max - lon_min)
    
    return lat, lon

def save_geojson(assignments, bounds, table_data, output_file_path):
    """
    Save assignments and table data as GeoJSON features to a file.

    Args:
    - assignments (list): List of assignments with PDF coordinates and labels.
    - bounds (dict): Dictionary containing the bounds information.
    - table_data (list): List of dictionaries containing table data.
    - output_file_path (str): Path to the output GeoJSON file.
    """
    features = []
    for assignment in assignments:
        pdf_y, pdf_x = assignment['coords']
        lat, lon = pdf_to_geo(bounds, pdf_x, pdf_y)
        numerical_id = assignment['n']
        
        # Find the corresponding table data entry
        table_entry = next((item for item in table_data if item['Numerical ID'] == numerical_id), None)
        
        if table_entry:
            feature = create_geojson_feature(lat, lon, numerical_id, table_entry)
            features.append(feature)
    
    feature_collection = geojson.FeatureCollection(features)
    
    with open(output_file_path, 'w') as f:
        geojson.dump(feature_collection, f)

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


def generate_assignments(labels, dots):
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
    
    return assignments

def extract_table_data(start_page, end_page):
    # Open the PDF
    document = fitz.open(inventory_path)
    text = ""
    
    # Extract text from specified page range
    for page_num in range(start_page-1, end_page):
        page = document.load_page(page_num)
        text += page.get_text()

    # Define a regex pattern to match table rows
    pattern = re.compile(r"([A-Z]-\d{3})\s+(.*?)\s+(.*?)\s+(\d+(\.\d+)?)\s*([A-Z]*)\s*(.*?)\s*(.*?)")

    # Find all matches
    matches = pattern.findall(text)

    # Create a list of dictionaries to hold table data
    table_data = []
    for match in matches:
        tree_id = match[0]
        numerical_id = int(tree_id.split('-')[1])
        table_data.append({
            "Tree ID": tree_id,
            "Numerical ID": numerical_id,
            "Botanical Name": match[1].strip(),
            "Common Name": match[2].strip(),
            "DBH (inches)": match[3].strip(),
            "General Health": match[4].strip(),
            "Memorial Tree": match[5].strip(),
            "Notes": match[6].strip()
        })

    for row in table_data:
        print(row)
        
    return table_data

def process_zone(page_num, zone, page_range: tuple):    
    if zone not in zones:
        raise ValueError(f'Zone {zone} not supported (supported: {zones})')
    
    if page_num not in page_nums:
        raise ValueError(f'Page number {page_num} not supported (supported: {page_nums})')
        
    # Extract text and vector graphics from the PDF
    doc = fitz.open(inventory_path)

    page = doc[page_num - 1] # page_num is NOT zero-indexed
            
    # Extract text blocks
    text_blocks = page.get_text("dict")
    labels = extract_text(text_blocks)
    
    # Extract vector graphics (dots)
    vector_graphics = page.get_drawings()

    # Filter text blocks to get the labels and their positions
    dots = extract_dots(vector_graphics)
    
    # Read from config file (extra labels and bounds)
    with open(f'zone_info/{zone}.json', 'r') as file:
        data = json.load(file)
        
        for label in data["extra_labels"]:
            n = label['text']
            labels[n] = {}
            labels[n]['coords'] = (label['coords'][0], label['coords'][1])
            labels[n]['distance'] = None
            labels[n]['verify'] = False
            labels[n]['dot_coords'] = None
        
        bounds = data["bounds"]
    
    assignments = generate_assignments(labels, dots)
    table_data = extract_table_data(page_range[0], page_range[1])
    
    answer = input('Write assignments to file? (y/n)')
    if answer in ['y', 'yes', 'Y', 'YES']:
        path = f'tree_extractions/zone_{zone}.json'
        with open(path, 'w') as file:
            json.dump({'assignments': assignments}, file)
        
    answer = input('Write lat/lon data to file? (y/n)')
    if answer in ['y', 'yes', 'Y', 'YES']:
        geo_path = f'tree_extractions/zone_{zone}.geojson'
        save_geojson(assignments, bounds, table_data, geo_path)

# Specify the range of pages to extract
start_page = 5
end_page = 16

# extract_table_data(inventory_path, start_page, end_page)

process_zone(4, 'a', (5, 16))