import { Directory, Paths } from 'expo-file-system';

export const FIXED_PASTOR_NAME = 'Pastor Tosin Tope-Babalola';
export const FAVORITE_SERMONS_STORAGE_KEY = 'favoriteSermons';
export const DOWNLOADED_SERMONS_STORAGE_KEY = 'downloadedSermons';
export const DOWNLOADED_SERMONS_DIRECTORY = new Directory(Paths.document, 'sermons');

export const formatSermonDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsedDate = new Date(`${value}T00:00:00`);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  return value;
};

export const getDownloadFileExtension = (mediaUrl: string) => {
  const normalizedUrl = mediaUrl.split('?')[0] ?? mediaUrl;
  const lastDotIndex = normalizedUrl.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return '.mp3';
  }

  const extension = normalizedUrl.slice(lastDotIndex);

  return extension.length <= 6 ? extension : '.mp3';
};
