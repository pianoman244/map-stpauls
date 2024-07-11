const fs = require('fs').promises;
const { DOMParser } = require('xmldom');
const svgpath = require('svgpath');
const pdf = require('pdf-parse');

async function convertPDFtoSVG(pdfPath, svgPath) {
    try {
        const dataBuffer = await fs.readFile(pdfPath);
        const data = await pdf(dataBuffer);

        console.log('PDF Info:', data.info);
        console.log('Number of pages:', data.numpages);

        if (data.numpages !== 1) {
            console.warn('Warning: This script is designed for single-page PDFs. Only the first page will be processed.');
        }

        const pageWidth = data.info.width || 595.28; // default A4 width in points
        const pageHeight = data.info.height || 841.89; // default A4 height in points

        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${pageHeight}">`;

        // Extract path data from page content
        const paths = extractPathsFromContent(data.text);
        paths.forEach(path => {
            svgContent += `<path d="${path}" fill="none" stroke="black"/>`;
        });

        svgContent += '</svg>';

        await fs.writeFile(svgPath, svgContent);
        console.log('PDF converted to SVG successfully');

        return { width: pageWidth, height: pageHeight };
    } catch (error) {
        console.error(`Error converting PDF to SVG: ${error.message}`);
        throw error;
    }
}

function extractPathsFromContent(content) {
    const paths = [];
    const regex = /\b([mMlLhHvVcCsSqQtTaAzZ][-+0-9eE., ]+)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        paths.push(match[0]);
    }

    return paths;
}

function parseSVGAndFilterByColor(svgPath, targetColors) {
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const paths = svgDoc.getElementsByTagName('path');

    return Array.from(paths).filter(path => {
        const fillColor = path.getAttribute('fill');
        return targetColors.includes(fillColor);
    });
}

function convertSVGToGeoJSON(filteredPaths, svgWidth, svgHeight, bbox) {
    const features = filteredPaths.map(path => {
        const d = path.getAttribute('d');
        const transformedPath = svgpath(d)
            .scale(bbox[2] / svgWidth, bbox[3] / svgHeight)
            .translate(bbox[0], bbox[1])
            .toString();

        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [transformedPath.split('M')[1].split('Z')[0].split('L').map(coord => {
                    const [x, y] = coord.split(',').map(Number);
                    return [x, y];
                })]
            },
            properties: {
                verified: false
            }
        };
    });

    return {
        type: 'FeatureCollection',
        features: features
    };
}

async function pdfToGeoJSON(pdfPath, svgPath, targetColors, bbox) {
    const svgDimensions = await convertPDFtoSVG(pdfPath, svgPath);
    const filteredPaths = parseSVGAndFilterByColor(svgPath, targetColors);
    const geoJSON = convertSVGToGeoJSON(filteredPaths, svgDimensions.width, svgDimensions.height, bbox);
    return geoJSON;
}

module.exports = { pdfToGeoJSON };

convertPDFtoSVG('./planting_beds.pdf', './planting_beds.svg')