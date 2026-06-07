import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { STORAGE_BUCKET } from '@/app/lib/supabase';

// sharp needs the Node.js runtime (not the Edge runtime).
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const files = data.getAll('file') as unknown as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files uploaded' });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const inputBuffer = Buffer.from(bytes);

      // Compress: auto-rotate, cap width at 1600px, convert to WebP.
      // This typically shrinks a multi-MB photo down to a few hundred KB.
      const optimized = await sharp(inputBuffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(filename, optimized, {
          contentType: 'image/webp',
          cacheControl: '31536000',
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError.message);
        return NextResponse.json({ success: false, message: uploadError.message });
      }

      const { data: pub } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
      uploadedUrls.push(pub.publicUrl);
    }

    return NextResponse.json({ success: true, urls: uploadedUrls });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' });
  }
}
