export enum MimeEnum {
  mp3 = 'audio/mpeg',
  mp4 = 'video/mp4',
  wav = 'audio/wav',
  xWav = 'audio/x-wav',
  gif = 'image/gif',
  jpeg = 'image/jpeg',
  jpg = 'image/jpg',
  png = 'image/png',
  pdf = 'application/pdf',
  quicktime = 'video/quicktime'
}

export const AudioAndVideoTypes = [MimeEnum.mp3, MimeEnum.wav, MimeEnum.xWav, MimeEnum.mp4, MimeEnum.quicktime]
export const ArtworkTypes = [MimeEnum.gif, MimeEnum.jpeg, MimeEnum.png, MimeEnum.jpg, MimeEnum.mp4, MimeEnum.quicktime]

export type LensMediaMetadata = {
  item: string;
  type: MimeEnum;
  altTag?: string;
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
