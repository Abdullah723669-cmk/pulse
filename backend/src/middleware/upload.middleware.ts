import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary';

// Use Cloudinary as multer storage backend — files go directly to Cloudinary CDN,
// never touch the ephemeral Render disk, so they persist across restarts/deploys.
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req: any, file: Express.Multer.File) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: 'pulse_uploads',
      resource_type: isVideo ? 'video' : 'image',
      // Let Cloudinary auto-assign a unique public_id
      public_id: undefined,
      // Transformation for images: auto quality and format
      ...(isVideo
        ? {}
        : {
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          }),
    };
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/jpg',
    'image/svg+xml',
  ];
  const allowedVideoMimes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'video/ogg',
  ];

  if (
    allowedImageMimes.includes(file.mimetype) ||
    allowedVideoMimes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: Images (JPG, PNG, WEBP, GIF, SVG) and Videos (MP4, WEBM, MOV).`
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
  fileFilter,
});
