import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiError';
import AWS from 'aws-sdk';
import cloudinary from 'cloudinary';

// ===============================
// Types
// ===============================
type IFolderName = 'images' | 'media' | 'documents';

interface ProcessedFiles {
  [key: string]: string | string[] | undefined;
}

interface FileHandlerOptions {
  storageMode?: 'local' | 'memory';
  cloudProvider?: 's3' | 'cloudinary';
  maxFileSizeMB?: number;
  baseUrl?: string;
}

interface CloudProvider {
  upload: (buffer: Buffer, fileName: string, folder: string) => Promise<string>;
  delete: (fileUrl: string) => Promise<void>;
}

// ===============================
// Configuration
// ===============================
const uploadFields = [
  { name: 'images', maxCount: 5 },
  { name: 'media', maxCount: 3 },
  { name: 'documents', maxCount: 3 },
] as const;

const allowedTypes: Record<IFolderName, string[]> = {
  images: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  media: ['video/mp4', 'video/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav'],
  documents: ['application/pdf'],
};

// ===============================
// Cloud Providers
// ===============================
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

const S3Provider: CloudProvider = {
  upload: async (buffer, fileName, folder) => {
    const key = `${folder}/${fileName}`;
    const result = await s3
      .upload({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ACL: 'public-read',
        ContentType: 'auto',
      })
      .promise();
    return result.Location;
  },
  delete: async fileUrl => {
    const bucketName = process.env.AWS_S3_BUCKET!;
    const key = fileUrl.split('/').slice(3).join('/');
    await s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
  },
};

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const CloudinaryProvider: CloudProvider = {
  upload: async (buffer, fileName, folder) => {
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder, resource_type: 'auto', public_id: fileName.split('.')[0] },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      uploadStream.end(buffer);
    });
    return result.secure_url;
  },
  delete: async fileUrl => {
    const parts = fileUrl.split('/');
    const filenameWithExt = parts[parts.length - 1];
    const public_id = filenameWithExt.split('.')[0];
    const folder = parts[parts.length - 2];
    await cloudinary.v2.uploader.destroy(`${folder}/${public_id}`, {
      resource_type: 'auto',
    });
  },
};

// ===============================
// Helpers
// ===============================
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const parseJsonData = (body: any) => {
  if (body?.data && typeof body.data === 'string') {
    try {
      return JSON.parse(body.data);
    } catch {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Invalid JSON in "data" field'
      );
    }
  }
  return body;
};

const getStorage = (mode: 'local' | 'memory') => {
  if (mode === 'memory') return multer.memoryStorage();
  const baseUploadDir = path.join(process.cwd(), 'uploads');
  ensureDir(baseUploadDir);
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const folderPath = path.join(baseUploadDir, file.fieldname);
      ensureDir(folderPath);
      cb(null, folderPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}${ext}`;
      cb(null, name);
    },
  });
};

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const field = file.fieldname as IFolderName;
  if (!allowedTypes[field]?.includes(file.mimetype))
    return cb(
      new ApiError(StatusCodes.BAD_REQUEST, `Invalid file type for ${field}`)
    );
  cb(null, true);
};

// ===============================
// File Optimization
// ===============================
const optimizeFile = async (
  file: Express.Multer.File,
  storageMode: 'local' | 'memory'
) => {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  let buffer = storageMode === 'memory' ? file.buffer : undefined;

  if (isImage) {
    let sharpInstance =
      storageMode === 'local'
        ? sharp(file.path).resize(800)
        : sharp(buffer!).resize(800);
    if (file.mimetype === 'image/png')
      sharpInstance = sharpInstance.png({ quality: 80 });
    else if (file.mimetype === 'image/webp')
      sharpInstance = sharpInstance.webp({ quality: 80 });
    else sharpInstance = sharpInstance.jpeg({ quality: 80 });

    if (storageMode === 'memory') buffer = await sharpInstance.toBuffer();
    else await sharpInstance.toFile(file.path);
  }

  if (isVideo && storageMode === 'memory') {
    // NOTE: Video compression in memory is complex. Usually we write to disk.
    // For simplicity, we skip heavy compression for memory uploads
    return buffer!;
  }

  return buffer;
};

const generateFileUrl = async (
  file: Express.Multer.File,
  storageMode: 'local' | 'memory',
  provider: CloudProvider,
  baseUrl: string,
  fieldName: string
) => {
  if (storageMode === 'local')
    return `${baseUrl}/uploads/${fieldName}/${path.basename(file.path)}`;
  const buffer = await optimizeFile(file, storageMode);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${
    file.mimetype.split('/')[1]
  }`;
  return provider.upload(buffer!, fileName, fieldName);
};

// ===============================
// Middleware
// ===============================
export const fileHandler = (options?: FileHandlerOptions) => {
  const storageMode =
    options?.storageMode ||
    (process.env.UPLOAD_MODE === 'memory' ? 'memory' : 'local');
  const cloudProviderKey =
    options?.cloudProvider ||
    (process.env.CLOUD_PROVIDER as 's3' | 'cloudinary') ||
    's3';
  const provider = cloudProviderKey === 's3' ? S3Provider : CloudinaryProvider;
  const maxFileSizeMB = options?.maxFileSizeMB || 10;
  const BASE_URL =
    options?.baseUrl || process.env.BASE_URL || 'http://localhost:5000';

  const upload = multer({
    storage: getStorage(storageMode),
    fileFilter,
    limits: { fileSize: maxFileSizeMB * 1024 * 1024, files: 10 },
  }).fields(uploadFields);

  return async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (err: any) => {
      if (err) return next(err);
      try {
        req.body = parseJsonData(req.body);
        const processedFiles: ProcessedFiles = {};
        const fieldConfig = new Map(
          uploadFields.map(f => [f.name, f.maxCount])
        );

        if (req.files) {
          for (const [fieldName, files] of Object.entries(req.files)) {
            const fileArray = files as Express.Multer.File[];
            const maxCount = fieldConfig.get(fieldName as IFolderName) ?? 1;
            const urls: string[] = [];

            for (const file of fileArray) {
              const url = await generateFileUrl(
                file,
                storageMode,
                provider,
                BASE_URL,
                fieldName
              );
              urls.push(url);
            }
            processedFiles[fieldName] = maxCount > 1 ? urls : urls[0];
          }
        }

        req.body = { ...req.body, ...processedFiles };
        next();
      } catch (error) {
        next(error);
      }
    });
  };
};

// ===============================
// File Deletion
// ===============================
export const deleteFile = async (
  fileUrl: string,
  storageMode?: 'local' | 'memory',
  cloudProviderKey?: 's3' | 'cloudinary'
) => {
  const mode =
    storageMode || (process.env.UPLOAD_MODE === 'memory' ? 'memory' : 'local');
  const cloud =
    cloudProviderKey ||
    (process.env.CLOUD_PROVIDER as 's3' | 'cloudinary') ||
    's3';
  const provider = cloud === 's3' ? S3Provider : CloudinaryProvider;

  if (mode === 'local') {
    const localPath = path.join(
      process.cwd(),
      'uploads',
      fileUrl.split('/uploads/')[1]
    );
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  } else {
    await provider.delete(fileUrl);
  }
};
