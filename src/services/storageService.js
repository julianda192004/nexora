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
  }
};
