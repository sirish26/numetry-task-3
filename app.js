const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const upload = multer({ dest: 'uploads/' });

mongoose.connect('mongodb+srv://root:root@numerty.t7qkzms.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.static(path.join(__dirname, 'public')));

const FileSchema = new mongoose.Schema({
  filePath: { type: String, required: true },
});

const File = mongoose.model('File', FileSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const uploadWithStorage = multer({ storage });

// Handle file/folder uploads
app.post('/upload', uploadWithStorage.any(), async (req, res) => {
  try {
    const files = req.files.map(file => ({ filePath: file.path }));
    await File.insertMany(files);
    res.send('uploaded successfully and paths stored in MongoDB');
  } catch (error) {
    console.error('Error uploading:', error);
    res.status(500).send('Error uploading');
  }
});

app.get('/files', async (req, res) => {
  try {
    const files = await File.find();
    res.json({ files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).send('Error fetching files');
  }
});

app.get('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findById(id);
    if (!file) {
      return res.status(404).send('File not found');
    }
    res.sendFile(file.filePath);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).send('Error fetching file');
  }
});

app.put('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPath } = req.body;
    const file = await File.findByIdAndUpdate(id, { filePath: newPath }, { new: true });
    if (!file) {
      return res.status(404).send('File not found');
    }
    res.send('File updated successfully');
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).send('Error updating file');
  }
});

app.delete('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findById(id);
    if (!file) {
      return res.status(404).send('File not found');
    }
    await fs.unlink(file.filePath);
    await File.findByIdAndDelete(id);
    res.send('File deleted successfully');
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).send('Error deleting file');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
