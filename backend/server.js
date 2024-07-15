const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001; // Make sure this doesn't conflict with your React app's port

app.use(cors());
app.use(bodyParser.json());

app.get('/get-layer-data/:id', async (req, res) => {
    const { id } = req.params;
    const filePath = path.join(__dirname, 'data', id + ".json");

    try {
        console.log("trying to read file:", filePath);
        const data = await fs.promises.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ message: 'Error reading file' });
    }
});

app.post('/save-layers', (req, res) => {
    const { id, data } = req.body;
    console.log("running save-layers with id:", id);
    const filePath = path.join(__dirname, 'data', id + ".json");

    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error('Error writing file:', err);
            res.status(500).json({ message: 'Error saving file' });
        } else {
            res.json({ message: 'File saved successfully' });
        }
    });
});

app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});