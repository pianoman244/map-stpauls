import math
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
import glob
from pdf_overlay import create_zone_overlay
from pdf_utils import pdf_to_geo_old

# Supported zones and page numbers in tree inventory pdf
zones = {
    'a': {
        'map_page': 4,
        'table_start': 5,
        'table_end': 16,
    },
    'b': {
        'map_page': 18,
        'table_start': 19,
        'table_end': 31,
    }, 
    'c': {
        'map_page': 33,
        'table_start': 34,
        'table_end': 43
    }, 
    'd': {
        'map_page': 45,
        'table_start': 46,
        'table_end': 54
    }, 
    'e': {
        'map_page': 56,
        'table_start': 57,
        'table_end': 60
    }, 
    'f': {
        'map_page': 62,
        'table_start': 63,
        'table_end': 72
    }, 
    'g': {
        'map_page': 74,
        'table_start': 75,
        'table_end': 85
    }, 
    'h': {
        'map_page': 87,
        'table_start': 88,
        'table_end': 93
    }
}

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

def save_geojson(assignments, bounds, table_data, output_file_path, zone_e=False):
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
        lat, lon = pdf_to_geo_old(bounds, pdf_x, pdf_y, zone_e)
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

def extract_dots(graphics, letter, debug=False):
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
    
    # switch x and y remember
    min_x = min(dot_coords, key=lambda coord: coord[1])[1]
    max_x = max(dot_coords, key=lambda coord: coord[1])[1]
    min_y = min(dot_coords, key=lambda coord: coord[0])[0]
    max_y = max(dot_coords, key=lambda coord: coord[0])[0]
    
    info_path = f"zone_info/{letter}.json"
    if not os.path.exists(info_path):
        with open(info_path, 'w') as file:
            info = {
                "bounds": {
                    "x": [min_x, max_x],
                    "y": [min_y, max_y],
                    "lat": [43.19774, 43.20187],
                    "lon": [-71.58407, -71.57691]
                },
                "extra_labels": []
            }
            json.dump(info, file)
    
    if debug:
        print('--- extract_dots debug ---')
        print(f'Number of dots: {len(dot_coords)}')
        print(f'Bounds:\n\tx: {min_x}, {max_x}\n\ty: {min_y}, {max_y}\n')
        
    return dot_coords

def extract_labels(text_instances, letter, num_dots, debug=False):
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

    # Read from config file (extra labels)
    with open(f'zone_info/{letter}.json', 'r') as file:
        data = json.load(file)
        
        for label in data["extra_labels"]:
            n = label['text']
            labels[n] = {}
            labels[n]['coords'] = (label['coords'][0], label['coords'][1])
            labels[n]['distance'] = None
            labels[n]['verify'] = False
            labels[n]['dot_coords'] = None
            
    if debug:
        print('--- extract_labels debug ---')
        label_numbers = sorted(labels.keys())
            
        count = len(label_numbers)
        print('Count:', len(labels.keys()))
        
        if len(label_numbers) != num_dots:
            print('\nLabels missing (assuming biggest label is # of dots):\n')
            for i in range(1, num_dots):
                if i not in label_numbers:
                    print(i)
        else:
            print("No labels missing!\n")
        
        
    return labels

def inspect_assignments(labels, numbers):
    for n, label in labels.items():
        if n in numbers:
            print(f"Label {n}: coords ({label['coords'][0]:.1f}, {label['coords'][1]:.1f}) \t dot ({label['dot_coords'][0]:.1f}, {label['dot_coords'][1]:.1f}) \t (dist {label['distance']:.1f})")


def generate_assignments(labels, dots, debug=False):
    if debug:
        print('--- generate_assignments debug ---')
        print(f'Labels: {len(labels.keys())}\t Dots: {len(dots)}\n')
        
    dots_selected = []
    selections = {}
    successful_pairings = 0
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
        
        if dot_selected in dots_selected:
            if debug:
                print("WARNING: closest dot to label ", n, " already selected by dot ", selections[dot_selected])
                label['verify'] = True
                labels[selections[dot_selected]]['verify'] = True
        else:
            successful_pairings += 1
        
        dots_selected.append(dot_selected)
        selections[dot_selected] = n
    
    if debug:
        if successful_pairings != len(dots):
            print("Problematic pairings")
            for n, label in labels.items():
                if label['verify']:
                    print(f"Label {n}: coords ({label['coords'][0]:.1f}, {label['coords'][1]:.1f}) \t dot ({label['dot_coords'][0]:.1f}, {label['dot_coords'][1]:.1f}) \t (dist {label['distance']:.1f})")
            
            print("\nUnpaired dots")
            for dot in dots:
                if dot not in selections.keys():
                    print(dot)
        else:
            print("All pairings successful!")
                
    assignments = []
    for n, label in labels.items():
        assignment = {'n': n, 'coords': label['dot_coords']}
        assignments.append(assignment)
    
    return assignments

def extract_table_data(start_page, end_page, letter):
    print("--- extracting table data ---")
    print(f"Pages {start_page} to {end_page} (letter {letter})")
    
    # Open the PDF
    document = fitz.open(inventory_path)
    text = ""
    
    # Extract text from specified page range
    for page_num in range(start_page-1, end_page):
        page = document.load_page(page_num)
        text += page.get_text()
        
    text = ""
    for page_num in range(start_page-1, end_page):  # Pages are 0-indexed in PyMuPDF
        page = document.load_page(page_num)
        text += page.get_text()

    with open(f"zone_info/{letter}.txt", "w") as file:
        file.write(text)

def process_table_data(letter, debug=False, edited=True):
    if edited:
        dir = "zone_info/tables_edited"
    else:
        dir = "zone_info"
        
    with open(f"{dir}/{letter}.txt", "r") as file:
        text = file.read()
        
    # Define a regex pattern to match table rows
    pattern = re.compile(r"""
    ([A-Z]-\d{3})\n            # Matches the Tree ID: A letter followed by a dash and three digits, followed by a newline
    (\w+\s+\w.*?)\n            # Matches the Botanical Name: Two words separated by a space, maybe with a period
    (.*?)\n                    # Matches the Common Name: Any characters, captured non-greedily, followed by a newline
    (.*?)\n                    # Matches the DBH: anything because formatting is wack
    ([A-Z]+)\n                 # Matches the General Health: One or more uppercase letters, followed by a newline
    (.*?(?=\n[A-Z]-\d{3}))?    # Matches the Notes: Any characters, captured non-greedily, followed by a newline
    """, re.VERBOSE)
    
    matches = pattern.findall(text)

    # Create a list of dictionaries to hold table data
    table_data = []
    for match in matches:
        tree_id = match[0]
        numerical_id = int(tree_id.split('-')[1])
        dbh_str = match[3].strip()
        try:
            dbh = float(dbh_str)
        except ValueError:
            dbh = 8
        
        table_data.append({
            "Tree ID": tree_id,
            "Numerical ID": numerical_id,
            "Botanical Name": match[1].strip(),
            "Common Name": match[2].strip(),
            "DBH (inches)": dbh,
            "DBH Info": dbh_str,
            "General Health": match[4].strip(),
            "Notes": match[5].strip()
        })

    if debug:
        print('--- process_table_data debug ---')
        for row in table_data:
            print(row)
        print('Count:', len(table_data))
        
    return table_data

def process_zone(letter, debug=[], write=None, extract_table=False, pdf=False):
    print(f"--- Processing zone {letter} with debug={debug}, write={write}, extract_table={extract_table}, pdf={pdf} ---\n")
    if letter not in zones.keys():
        ValueError(f"Zone {letter} not supported (supported: {zones.keys()})")
        
    zone = zones[letter]
        
    # Extract text and vector graphics from the PDF
    doc = fitz.open(inventory_path)

    page = doc[zone['map_page'] - 1] # page_num is NOT zero-indexed
            
    # Extract vector graphics (dots)
    vector_graphics = page.get_drawings()

    # Filter text blocks to get the labels and their positions
    dots = extract_dots(vector_graphics, letter, 'dots' in debug)
    
    # Extract text blocks
    text_blocks = page.get_text("dict")
    labels = extract_labels(text_blocks, letter, len(dots), 'labels' in debug)
    
    # Assign text to dots
    assignments = generate_assignments(labels, dots, 'assignments' in debug)
    
    # Extract table data from PDF if not done already
    if not os.path.exists(f"zone_info/{letter}.txt") or extract_table:
        extract_table_data(zone['table_start'], zone['table_end'], letter)
        
    # Process table data
    table_data = process_table_data(letter, 'table' in debug)
    
    # COPY AND PASTED CODE!
    # for convenience
    if write == True:
        path = f'tree_extractions/zone_{letter}.json'
        with open(path, 'w') as file:
            json.dump({'assignments': assignments}, file)    
            # Read bounds from config file
        with open(f'zone_info/{letter}.json', 'r') as file:
            data = json.load(file)
            bounds = data["bounds"]   
        with open(f'zone_info/{letter}.json', 'r') as file:
            data = json.load(file)
            bounds = data["bounds"]
            
        geo_path = f'tree_extractions/zone_{letter}.geojson'
        save_geojson(assignments, bounds, table_data, geo_path, zone_e=(letter == 'e'))
        
    elif write == False:
        pass
    
    else:
        answer = input('Write assignments to file? (y/n)')
        if answer in ['y', 'yes', 'Y', 'YES']:
            path = f'tree_extractions/zone_{letter}.json'
            with open(path, 'w') as file:
                json.dump({'assignments': assignments}, file)
            
        answer = input('Write lat/lon data to file? (y/n)')
        if answer in ['y', 'yes', 'Y', 'YES']:
            # Read bounds from config file
            with open(f'zone_info/{letter}.json', 'r') as file:
                data = json.load(file)
                bounds = data["bounds"]
                
            geo_path = f'tree_extractions/zone_{letter}.geojson'
            rotation = None
            if letter == 'e':
                rotation = math.pi - 0.12
            save_geojson(assignments, bounds, table_data, geo_path, rotation=rotation)
    
    if pdf:
        create_zone_overlay(letter, zone['map_page'])
            
def combine_geojson_files():
    combined_features = []

    # Use glob to find all files matching the pattern
    file_pattern = os.path.join('tree_extractions', "zone_*.geojson")
    geojson_files = glob.glob(file_pattern)

    # Iterate through each file and combine features
    for file_path in geojson_files:
        with open(file_path, 'r') as file:
            geojson_data = json.load(file)
            combined_features.extend(geojson_data['features'])

    # Create a combined GeoJSON feature collection
    combined_geojson = {
        "type": "FeatureCollection",
        "features": combined_features
    }
    
    with open("tree_extractions/all_trees.geojson", 'w') as output_file:
        json.dump(combined_geojson, output_file, indent=2)

def process_all(letters=None, **kwargs):
    if letters == None:
        letters = zones.keys()
        
    for letter in letters:
        process_zone(letter, **kwargs)
    
    answer = input('Combine geojson files? (y/n)')
    if answer in ['y', 'yes', 'Y', 'YES']:
        combine_geojson_files()
        
letters = ['e']
process_all(write=True)