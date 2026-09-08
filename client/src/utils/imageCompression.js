import { supabase } from '../lib/supabase';

/**
 * Client-side image compression using HTML5 Canvas
 * Dramatically reduces mobile photo upload payload from 5-15MB to ~200-400KB
 * while retaining full clarity for bank slip details (OCR, dates, QR code).
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    outputType = 'image/jpeg'
  } = options;

  if (!file || !file.type.startsWith('image/')) {
    return {
      file,
      blob: file,
      previewUrl: file ? URL.createObjectURL(file) : '',
      originalSize: file?.size || 0,
      compressedSize: file?.size || 0,
      compressionRatio: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(new Error('Failed to read image file: ' + err));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = (err) => reject(new Error('Failed to load image element: ' + err));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanFileName, {
              type: outputType,
              lastModified: Date.now(),
            });

            const originalSize = file.size;
            const compressedSize = blob.size;
            const savedPercentage = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            resolve({
              file: compressedFile,
              blob,
              previewUrl: URL.createObjectURL(blob),
              originalSize,
              compressedSize,
              savedPercentage,
              width,
              height,
            });
          },
          outputType,
          quality
        );
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a compressed payment slip image directly to Supabase Storage bucket 'slips'
 * Path structure: <student_id>/<timestamp>_<filename>.jpg
 */
export async function uploadSlipToSupabase(rawFile, studentId) {
  if (!rawFile) {
    throw new Error('กรุณาเลือกไฟล์สลิปการโอนเงิน');
  }

  // 1. Client-side compression
  const compressionResult = await compressImage(rawFile);
  const fileToUpload = compressionResult.file;

  // 2. Formulate unique, sanitized storage path
  const sanitizedStudentId = (studentId || 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '');
  const timestamp = Date.now();
  const safeName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${sanitizedStudentId}/${timestamp}_${safeName}`;

  // 3. Upload to Supabase Storage bucket 'slips'
  const { data, error } = await supabase.storage
    .from('slips')
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg',
    });

  if (error) {
    console.error('Supabase Storage upload error:', error);
    throw new Error(`อัปโหลดรูปภาพสลิปล้มเหลว: ${error.message}`);
  }

  // 4. Retrieve public URL
  const { data: publicUrlData } = supabase.storage
    .from('slips')
    .getPublicUrl(filePath);

  return {
    filePath,
    publicUrl: publicUrlData.publicUrl,
    compression: {
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      savedPercentage: compressionResult.savedPercentage,
    },
  };
}

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
