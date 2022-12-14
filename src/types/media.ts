
import axios from 'axios';
import _ from 'lodash';

import { IPFSFile } from './ipfsFile';

export enum MimeEnum {
  // audio formats
  // (https://mimetype.io/all-types/#audio) overlayed with (https://cloudinary.com/documentation/formats_supported_for_transformation#supported_audio_formats)
  aac = 'audio/aac',
  aiff = 'audio/aiff',
  flac = 'audio/flac',
  m4a = 'audio/m4a',
  mpeg = 'audio/mpeg',
  mpeg3 = 'audio/mpeg3',
  mp3 = 'audio/mpeg',
  ogg = 'audio/ogg',
  opus = 'audio/opus',
  wav = 'audio/wav',
  xAac = 'audio/x-aac',
  xAiff = 'audio/x-aiff',
  xM4a = 'audio/x-m4a',
  xMpeg = 'audio/x-mpeg-3',
  xWav = 'audio/x-wav',
  // image formats
  // (https://mimetype.io/all-types/#image) overlayed with (https://cloudinary.com/documentation/formats_supported_for_transformation#supported_image_formats)
  ai = 'application/postscript',
  avif = 'image/avif',
  bmp = 'image/bmp',
  eps = 'application/postscript',
  eps3 = 'application/postscript',
  ept = 'application/postscript',
  gif = 'image/gif',
  heif = 'image/heic',
  heic = 'image/heic',
  ico = 'image/x-icon',
  jpeg = 'image/jpeg',
  jpg = 'image/jpg',
  jpe = 'image/jpg',
  pdf = 'application/pdf',
  png = 'image/png',
  ps = 'application/postscript',
  psd = 'image/vnd.adobe.photoshop',
  svg = 'image/svg+xml',
  svgz = 'image/svg+xml',
  tif = 'image/tiff',
  tiff = 'image/tiff',
  webp = 'image/webp',
  xPdf = 'application/x-pdf',
  xPng = 'application/x-png',
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

export const AudioTypes = _.uniq([MimeEnum.aac, MimeEnum.aiff, MimeEnum.flac, MimeEnum.m4a, MimeEnum.ogg, MimeEnum.opus, MimeEnum.mpeg, MimeEnum.mpeg3, MimeEnum.mp3, MimeEnum.wav, MimeEnum.xAac, MimeEnum.xAiff, MimeEnum.xM4a, MimeEnum.xMpeg, MimeEnum.xWav]);
export const ImageTypes = _.uniq([MimeEnum.ai, MimeEnum.avif, MimeEnum.bmp, MimeEnum.eps, MimeEnum.eps3, MimeEnum.ept, MimeEnum.gif, MimeEnum.heif, MimeEnum.heic, MimeEnum.ico, MimeEnum.jpeg, MimeEnum.jpg, MimeEnum.jpe, MimeEnum.pdf, MimeEnum.png, MimeEnum.ps, MimeEnum.psd, MimeEnum.svg, MimeEnum.svgz, MimeEnum.tif, MimeEnum.tiff, MimeEnum.webp, MimeEnum.xPdf, MimeEnum.xPng]);
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
