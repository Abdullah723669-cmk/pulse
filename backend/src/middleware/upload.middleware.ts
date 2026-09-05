import multer from 'multer';
import path from 'path';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary';
import { ENV } from '../config/env';

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ENV.UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext =
      path.extname(file.originalname).toLowerCase() ||
      (file.mimetype.startsWith('audio/') ? '.webm' : '');
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Use Cloudinary as multer storage backend when configured;
// otherwise fall back to local disk storage.
const storage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: async (_req: any, file: Express.Multer.File) => {
        const isVideo = file.mimetype.startsWith('video/');
        const isAudio = file.mimetype.startsWith('audio/');
        return {
          folder: 'pulse_uploads',
          // Cloudinary processes audio under 'video' resource_type
          resource_type: isVideo || isAudio ? 'video' : 'image',
          public_id: undefined,
          ...(isVideo || isAudio
            ? {}
            : {
                transformation: [{ quality: 'auto', fetch_format: 'auto' }],
              }),
        };
      },
    })
  : diskStorage;

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

  const isImage = allowedImageMimes.includes(file.mimetype) || file.mimetype.startsWith('image/');
  const isVideo = allowedVideoMimes.includes(file.mimetype) || file.mimetype.startsWith('video/');
  const isAudio =
    file.mimetype.startsWith('audio/') ||
    /\.(webm|ogg|mp3|wav|m4a|aac|weba|flac)$/i.test(file.originalname);

  if (isImage || isVideo || isAudio) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: Images (JPG, PNG, WEBP, GIF, SVG), Videos (MP4, WEBM, MOV), and Audio recordings (WEBM, MP3, WAV, OGG, M4A).`
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

