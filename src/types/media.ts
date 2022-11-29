import _ from 'lodash';

export enum MimeEnum {
  // audio formats
  mp3 = 'audio/mpeg',
  wav = 'audio/wav',
  xWav = 'audio/x-wav',
  // image formats
  gif = 'image/gif',
  jpeg = 'image/jpeg',
  jpg = 'image/jpg',
  png = 'image/png',
  pdf = 'application/pdf',
  // video formats
  mp4 = 'video/mp4',
  quicktime = 'video/quicktime',
  m3u8 = 'application/x-mpegURL',
  ts = 'video/MP2T',
  m2ts = 'video/MP2T',
  mts = 'video/MP2T',
  mov = 'video/quicktime',
  mkv = 'video/x-matroska',
  mpd = 'application/dash+xml',
  ogv = 'video/ogg',
  webm = 'video/webm',
  wmv = 'video/x-ms-wmv',
}

export const AudioTypes = [MimeEnum.mp3, MimeEnum.wav, MimeEnum.xWav];
export const ImageTypes = [MimeEnum.gif, MimeEnum.jpeg, MimeEnum.jpg, MimeEnum.png, MimeEnum.pdf];
export const VideoTypes = _.uniq([MimeEnum.mp4, MimeEnum.quicktime, MimeEnum.m3u8, MimeEnum.ts, MimeEnum.m2ts, MimeEnum.mts, MimeEnum.mov, MimeEnum.mkv, MimeEnum.mpd, MimeEnum.ogv, MimeEnum.webm, MimeEnum.wmv]);

export const AudioAndVideoTypes = _.uniq(AudioTypes.concat(VideoTypes));

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
