const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `audio-${Date.now()}.webm`);
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

app.use('/processed', express.static(path.join(__dirname, 'public', 'processed')));

app.post('/process-audio', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const outputFile = req.file.filename;
    console.log('File saved as:', outputFile); // Debugging line

    // Simulate processing and return the file path
    setTimeout(() => {
        res.json({ outputFile: `uploads/${outputFile}` });
    }, 1000);
});

app.get('/processed-audio/:filename', (req, res) => {
    const filename = req.params.filename;
    res.sendFile(path.join(__dirname, 'public', 'processed', filename));
});

app.get('/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'upload', filename);
    
    console.log('Attempting to download file:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        console.error('File not found:', filePath);
        res.status(404).send('File not found');
    }
});

app.use('/uploads', express.static('uploads'));

app.post('/upload', upload.single('audio'), (req, res) => {
    console.log('Upload request received');
    console.log('File:', req.file);
    console.log('Body:', req.body);

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const inputPath = req.file.path;
        const outputPath = path.join(__dirname, 'uploads', `converted_${req.file.filename}.wav`);

        console.log(`Processing file: ${inputPath}`);
        console.log(`Output will be saved to: ${outputPath}`);

        const pythonScriptPath = path.resolve(__dirname, 'audioProcessing', 'convertAudio.py');
        console.log('Python script path:', pythonScriptPath);

        if (!fs.existsSync(pythonScriptPath)) {
            console.error(`Python script not found at: ${pythonScriptPath}`);
            return res.status(500).json({ error: 'Python script not found', scriptPath: pythonScriptPath });
        }

        exec(`"python" "${pythonScriptPath}" "${inputPath}" "${outputPath}"`, (error, stdout, stderr) => {
            console.log('Python script execution completed');
            console.log(`Python script path: ${pythonScriptPath}`);
            console.log(`Input path: ${inputPath}`);
            console.log(`Output path: ${outputPath}`);
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);

            if (error) {
                console.error(`Execution error: ${error}`);
                return res.status(500).json({ 
                    error: 'Audio conversion failed', 
                    details: error.message,
                    stdout: stdout,
                    stderr: stderr,
                    scriptPath: pythonScriptPath,
                    inputPath: inputPath,
                    outputPath: outputPath
                });
            }

            if (fs.existsSync(outputPath)) {
                console.log('Converted file found');
                res.json({ 
                    message: 'File processed successfully', 
                    originalFile: req.file.filename,
                    convertedFile: path.basename(outputPath)
                });
            } else {
                console.error('Converted file not found');
                res.status(500).json({ 
                    error: 'Converted file not found', 
                    details: 'The output file was not created.',
                    stdout: stdout,
                    stderr: stderr
                });
            }
        });
    } catch (error) {
        console.error('Error in /upload route:', error);
        res.status(500).json({ error: 'Server error', details: error.message, stack: error.stack });
    }
});

app.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);
    console.log('Attempting to serve file:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        console.log('File not found:', filePath);
        res.status(404).send('File not found');
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});