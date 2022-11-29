
import axios from 'axios';
import _ from 'lodash';

import { IPFSFile } from './ipfsFile';

export enum MimeEnum {
  // audio formats
  // (https://mimetype.io/all-types/#audio) (https://cloudinary.com/documentation/formats_supported_for_transformation#supported_audio_formats)
  aac = 'audio/aac',
  aiff = 'audio/aiff',
  flac = 'audio/flac',
  m4a = 'audio/m4a',
  ogg = 'audio/ogg',
  opus = 'audio/opus',
  mpeg = 'audio/mpeg',
  mpeg3 = 'audio/mpeg3',
  mp3 = 'audio/mpeg',
  wav = 'audio/wav',
  xAac = 'audio/x-aac',
  xAiff = 'audio/x-aiff',
  xMpeg = 'audio/x-mpeg-3',
  xWav = 'audio/x-wav',
  // image formats
  gif = 'image/gif',
  jpeg = 'image/jpeg',
  jpg = 'image/jpg',
  png = 'image/png',
  pdf = 'application/pdf',
  // video formats
  // (https://cloudinary.com/documentation/formats_supported_for_transformation#supported_video_formats)
  mp4 = 'video/mp4',
  quicktime = 'video/quicktime',
  m3u8 = 'application/x-mpegURL',
  ts = 'video/MP2T',
  m2ts = 'video/MP2T',
  m4v = 'video/x-m4v',
  mts = 'video/MP2T',
  mov = 'video/quicktime',
  mkv = 'video/x-matroska',
  mpd = 'application/dash+xml',
  ogv = 'video/ogg',
  webm = 'video/webm',
  wmv = 'video/x-ms-wmv',
}

export const AudioTypes = [MimeEnum.aac, MimeEnum.aiff, MimeEnum.flac, MimeEnum.m4a, MimeEnum.ogg, MimeEnum.opus, MimeEnum.mpeg, MimeEnum.mpeg3, MimeEnum.mp3, MimeEnum.wav, MimeEnum.xAac, MimeEnum.xAiff, MimeEnum.xMpeg, MimeEnum.xWav]
export const ImageTypes = [MimeEnum.gif, MimeEnum.jpeg, MimeEnum.jpg, MimeEnum.png, MimeEnum.pdf];
export const VideoTypes = _.uniq([MimeEnum.mp4, MimeEnum.quicktime, MimeEnum.m3u8, MimeEnum.ts, MimeEnum.m2ts, MimeEnum.m4v, MimeEnum.mts, MimeEnum.mov, MimeEnum.mkv, MimeEnum.mpd, MimeEnum.ogv, MimeEnum.webm, MimeEnum.wmv]);

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

// perform HEAD request on IPFS file CID to resolve `mimeType`, along with `isAudio`, `isVideo`, `isImage` flags
export const updateMimeTypes = async (ipfsFile: IPFSFile) => {
  const ipfsHash = ipfsFile.cid;
  let response: any;
  let errorMsg: string | undefined = undefined;
  let contentType: any = '';

  try {
    response = await axios.head(`${process.env.IPFS_ENDPOINT}${ipfsHash}`, { timeout: parseInt(process.env.METADATA_REQUEST_TIMEOUT!) })
    contentType = response.headers['content-type']?.toLowerCase();
  } catch (e: any) {
    errorMsg = `Error: failed to fetch mime type for ipfs hash: ${ipfsHash} with error: ${e.message}`;
  }

  if (contentType && !Object.values(MimeEnum).includes(contentType)) {
    errorMsg = `Error: unsupported mime type '${contentType}' for ipfs hash: ${ipfsHash}`;
  }

  const updated = { ...ipfsFile };

  if (errorMsg) {
    updated.error = errorMsg;
  } else {
    updated.mimeType = contentType;
    updated.isAudio = AudioTypes.includes(contentType) ? true : false;
    updated.isVideo = VideoTypes.includes(contentType) ? true : false;
    updated.isImage = ImageTypes.includes(contentType) ? true : false;
  }

  return updated;
}
