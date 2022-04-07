export enum MimeEnum {
  mp3 = 'audio/mpeg',
  mp4 = 'video/mp4',
  wav = 'audio/wav',
  xWav = 'audio/x-wav',
  gif = 'image/gif',
  jpeg = 'image/jpeg',
  png = 'image/png',
  pdf = 'application/pdf',
}

export const isMP4 = (mimeType?: MimeEnum) => {
  if (!mimeType) {
    return false;
  }

  return mimeType === MimeEnum.mp4;
};

export const isGif = (mimeType?: MimeEnum) => {
  if (!mimeType) {
    return false;
  }

  return mimeType === MimeEnum.gif;
};
