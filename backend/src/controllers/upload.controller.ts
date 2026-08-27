import { Request, Response } from 'express';

const getFileFullUrl = (req: Request, filename: string): string => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  let protocol = 'https';
  if (forwardedProto) {
    protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto).split(',')[0].trim();
  } else if (req.protocol) {
    protocol = req.protocol;
  }
  const host = req.get('host') || 'pulse-hbu2.onrender.com';
  return `${protocol}://${host}/uploads/${filename}`;
};

export const uploadMedia = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded.' });
      return;
    }

    const file = req.file;
    const isVideo = file.mimetype.startsWith('video/');
    const isImage = file.mimetype.startsWith('image/');

    const type = isVideo ? 'video' : isImage ? 'image' : 'file';
    const url = getFileFullUrl(req, file.filename);

    res.json({
      url,
      type,
      filename: file.filename,
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
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ message: 'No files uploaded.' });
      return;
    }

    const results = files.map((file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const isImage = file.mimetype.startsWith('image/');
      const type = isVideo ? 'video' : isImage ? 'image' : 'file';

      return {
        url: getFileFullUrl(req, file.filename),
        type,
        filename: file.filename,
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
