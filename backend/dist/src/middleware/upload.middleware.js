"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads folder exists
const uploadDir = path_1.default.resolve(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (allowedImageMimes.includes(file.mimetype) || allowedVideoMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: Images (JPG, PNG, WEBP, GIF) and Videos (MP4, WEBM, MOV).`));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter,
});
