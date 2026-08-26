"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleMedia = exports.uploadMedia = void 0;
const uploadMedia = (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded.' });
            return;
        }
        const file = req.file;
        const isVideo = file.mimetype.startsWith('video/');
        const isImage = file.mimetype.startsWith('image/');
        const type = isVideo ? 'video' : isImage ? 'image' : 'file';
        const url = `/uploads/${file.filename}`;
        res.json({
            url,
            type,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error processing file upload.', error: error.message });
    }
};
exports.uploadMedia = uploadMedia;
const uploadMultipleMedia = (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ message: 'No files uploaded.' });
            return;
        }
        const results = files.map((file) => {
            const isVideo = file.mimetype.startsWith('video/');
            const isImage = file.mimetype.startsWith('image/');
            const type = isVideo ? 'video' : isImage ? 'image' : 'file';
            return {
                url: `/uploads/${file.filename}`,
                type,
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
            };
        });
        res.json({ files: results });
    }
    catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ message: 'Error processing file uploads.', error: error.message });
    }
};
exports.uploadMultipleMedia = uploadMultipleMedia;
