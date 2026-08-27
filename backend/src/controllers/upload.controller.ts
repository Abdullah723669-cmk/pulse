import { Request, Response } from 'express';

// When using CloudinaryStorage via multer, the file object has Cloudinary-specific fields:
// file.path  → the Cloudinary secure_url (https://res.cloudinary.com/...)
// file.filename → the Cloudinary public_id

export const uploadMedia = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded.' });
      return;
    }

    const file = req.file as any;
    const isVideo = file.mimetype.startsWith('video/');
    const isImage = file.mimetype.startsWith('image/');
    const type = isVideo ? 'video' : isImage ? 'image' : 'file';

    // Cloudinary secure URL is on file.path when using multer-storage-cloudinary
    const url: string = file.path || file.secure_url || '';

    res.json({
      url,
      type,
      filename: file.filename || file.public_id || '',
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error processing file upload.', error: error.message });
  }
};

export const uploadMultipleMedia = (req: Request, res: Response): void => {
  try {
    const files = req.files as any[];
    if (!files || files.length === 0) {
      res.status(400).json({ message: 'No files uploaded.' });
      return;
    }

    const results = files.map((file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const isImage = file.mimetype.startsWith('image/');
      const type = isVideo ? 'video' : isImage ? 'image' : 'file';
      const url: string = file.path || file.secure_url || '';

      return {
        url,
        type,
        filename: file.filename || file.public_id || '',
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    });

    res.json({ files: results });
  } catch (error: any) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ message: 'Error processing file uploads.', error: error.message });
  }
};
