import { supabase } from '../lib/supabase';
import { getAuthToken } from '../src/services/auth/authUtils';
import { API_ENDPOINTS, getApiUrl } from '../src/config/api';

export interface UploadResult {
  success: boolean;
  // A URL that can be rendered directly in an <img>. For private buckets this will be a signed URL.
  url?: string;
  // The storage path of the uploaded file inside the bucket
  path?: string;
  // A signed URL (if generated). Kept for callers that want explicit access
  signedUrl?: string;
  error?: string;
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

/**
 * Upload image to challenge-image bucket (Admin only)
 */
export const uploadChallengeImage = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 10MB' };
    }

    onProgress?.({ progress: 0, status: 'uploading' });

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload file with explicit content type
    const { data, error } = await supabase.storage
      .from('challenge-image')
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      onProgress?.({ progress: 0, status: 'error' });
      return { success: false, error: error.message };
    }

    onProgress?.({ progress: 100, status: 'complete' });

    // Manually construct the public URL to ensure it's correct
    // Format: https://[PROJECT_REF].supabase.co/storage/v1/object/public/[BUCKET]/[PATH]
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xerdtocgjurijragoydr.supabase.co';
    const bucketName = 'challenge-image';
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${data.path}`;

    // Log for debugging
    console.log('Upload successful:', {
      path: data.path,
      constructedUrl: publicUrl,
      bucketName
    });

    return { success: true, url: publicUrl };
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error' });
    return { success: false, error: 'Upload failed' };
  }
};

/**
 * Upload image to profile-image bucket (User's own profile)
 */
export const uploadProfileImage = async (
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    if (!file || !userId) {
      return { success: false, error: 'File and user ID are required' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    onProgress?.({ progress: 0, status: 'uploading' });

    // Generate unique filename with user folder
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    // Upload file with explicit content type
    const { data, error } = await supabase.storage
      .from('profile-image')
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      });

    if (error) {
      onProgress?.({ progress: 0, status: 'error' });
      return { success: false, error: error.message };
    }

    onProgress?.({ progress: 100, status: 'complete' });

    // Manually construct the public URL to ensure it's correct
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xerdtocgjurijragoydr.supabase.co';
    const bucketName = 'profile-image';
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${data.path}`;

    console.log('Profile image upload successful:', {
      path: data.path,
      constructedUrl: publicUrl
    });

    return { success: true, url: publicUrl };
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error' });
    return { success: false, error: 'Upload failed' };
  }
};

/**
 * Upload proof submission image (User's own proof)
 */
export const uploadProofImage = async (
  file: File,
  userId: string,
  challengeId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    if (!file || !userId || !challengeId) {
      return { success: false, error: 'File, user ID, and challenge ID are required' };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 10MB' };
    }

    onProgress?.({ progress: 0, status: 'uploading' });

    // Always use server-signed upload for better control and consistency
    const token = await getAuthToken();

    onProgress?.({ progress: 10, status: 'uploading' });

    // Get pre-signed upload URL from backend
    const metaRes = await fetch(getApiUrl(API_ENDPOINTS.STORAGE_PROOF_SIGNED_UPLOAD), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ challengeId, contentType: file.type })
    });

    if (!metaRes.ok) {
      const errorData = await metaRes.json();
      return { success: false, error: errorData.message || 'Failed to get upload URL' };
    }

    const { data: signed } = await metaRes.json();
    if (!signed?.signedUrl) {
      return { success: false, error: 'No signed URL received' };
    }

    onProgress?.({ progress: 30, status: 'uploading' });

    // Upload directly to Supabase using pre-signed URL
    const putRes = await fetch(signed.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });

    if (!putRes.ok) {
      return { success: false, error: 'Upload to storage failed' };
    }

    onProgress?.({ progress: 70, status: 'uploading' });

    // Generate signed URL for preview via backend (uses service role, bypasses RLS)
    const previewRes = await fetch(getApiUrl(API_ENDPOINTS.STORAGE_PROOF_SIGNED_PREVIEW), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ path: signed.path })
    });

    onProgress?.({ progress: 100, status: 'complete' });

    if (previewRes.ok) {
      const { data: previewData } = await previewRes.json();
      if (previewData?.signedUrl) {
        // Return both path (for backend storage) and signed URL (for preview)
        return {
          success: true,
          path: signed.path,
          url: previewData.signedUrl,
          signedUrl: previewData.signedUrl
        };
      }
    }

    // Fallback if signed URL generation fails - still return success with path
    return { success: true, path: signed.path };
  } catch (error) {
    onProgress?.({ progress: 0, status: 'error' });
    return { success: false, error: 'Upload failed' };
  }
};

/**
 * Delete image from storage (Admin only for challenge images)
 */
export const deleteImage = async (
  bucket: 'challenge-image' | 'profile-image' | 'proof-submission',
  path: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Delete failed' };
  }
}; 
