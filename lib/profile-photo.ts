import type { ImagePickerAsset } from 'expo-image-picker';

import { supabase } from '@/lib/supabase';
import { updateUserAvatarUrl } from '@/lib/auth';

const AVATAR_BUCKET = 'avatars';
const PUBLIC_AVATAR_PATH_SEGMENT = `/storage/v1/object/public/${AVATAR_BUCKET}/`;

function getAvatarExtension(asset: ImagePickerAsset) {
  const fileName = asset.fileName?.trim().toLowerCase() ?? '';

  if (fileName.includes('.')) {
    const extensionFromName = fileName.split('.').pop()?.replace(/[^a-z0-9]/g, '');

    if (extensionFromName) {
      return extensionFromName;
    }
  }

  const mimeType = asset.mimeType?.trim().toLowerCase() ?? '';

  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    return 'heic';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  return 'jpg';
}

function getAvatarContentType(asset: ImagePickerAsset) {
  return asset.mimeType?.trim() || 'image/jpeg';
}

function getAvatarStoragePath(userId: string, asset: ImagePickerAsset) {
  const extension = getAvatarExtension(asset);
  return `${userId}_${Date.now()}.${extension}`;
}

function getStoragePathFromPublicUrl(publicUrl: string | null | undefined) {
  if (!publicUrl) {
    return null;
  }

  const markerIndex = publicUrl.indexOf(PUBLIC_AVATAR_PATH_SEGMENT);

  if (markerIndex === -1) {
    return null;
  }

  return publicUrl.slice(markerIndex + PUBLIC_AVATAR_PATH_SEGMENT.length);
}

async function deleteAvatarObject(storagePath: string) {
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);

  if (error) {
    throw error;
  }
}

type UploadProfilePhotoInput = {
  asset: ImagePickerAsset;
  currentAvatarUrl?: string | null;
  userId: string;
};

export async function uploadProfilePhoto({
  asset,
  currentAvatarUrl,
  userId,
}: UploadProfilePhotoInput) {
  const avatarStoragePath = getAvatarStoragePath(userId, asset);
  const previousAvatarStoragePath = getStoragePathFromPublicUrl(currentAvatarUrl);

  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(avatarStoragePath, arrayBuffer, {
      contentType: getAvatarContentType(asset),
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(avatarStoragePath);
  const avatarUrl = publicUrlData.publicUrl;

  try {
    await updateUserAvatarUrl(userId, avatarUrl);
  } catch (databaseError) {
    try {
      await deleteAvatarObject(avatarStoragePath);
    } catch (cleanupError) {
      console.error('Failed to clean up uploaded avatar after users table update failed.', cleanupError);
    }

    throw databaseError;
  }

  if (previousAvatarStoragePath && previousAvatarStoragePath !== avatarStoragePath) {
    try {
      await deleteAvatarObject(previousAvatarStoragePath);
    } catch (cleanupError) {
      console.error('Failed to remove previous avatar from storage.', cleanupError);
    }
  }

  return {
    avatarUrl,
    storagePath: avatarStoragePath,
  };
}
