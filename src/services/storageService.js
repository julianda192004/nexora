/**
 * NEXORA Storage Service
 * Uploads media files to Supabase Storage Buckets
 */
import { supabase, ensureClient } from '../config/supabase.js';

export const storageService = {
  /**
   * Uploads a file to a specified Supabase storage bucket
   */
  async uploadFile({ bucket = 'posts', userId, file }) {
    if (!ensureClient()) throw new Error('Database client not configured');

    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = userId ? `${userId}/${cleanFileName}` : cleanFileName;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * Deletes a file from a specified Supabase storage bucket
   */
  async deleteFile({ bucket = 'avatars', pathOrUrl }) {
    if (!ensureClient() || !pathOrUrl) return false;

    try {
      let filePath = pathOrUrl;
      const marker = `/storage/v1/object/public/${bucket}/`;
      if (pathOrUrl.includes(marker)) {
        filePath = decodeURIComponent(pathOrUrl.split(marker)[1]);
      }
      if (filePath.includes('?')) {
        filePath = filePath.split('?')[0];
      }

      if (filePath) {
        const { error } = await supabase.storage.from(bucket).remove([filePath]);
        if (error) console.warn(`Storage delete warning (${bucket}):`, error.message);
        return !error;
      }
    } catch (err) {
      console.warn('Storage delete exception:', err);
    }
    return false;
  }
};
