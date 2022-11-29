
import axios from 'axios';
import _ from 'lodash';

import { IPFSFile } from './ipfsFile';

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

  const updated = ipfsFile;

  if (errorMsg) {
    updated.error = errorMsg;
  } else {
    updated.mimeType = contentType;
    if (AudioTypes.includes(contentType)) {
      updated.isAudio = true;
    }
    if (VideoTypes.includes(contentType)) {
      updated.isVideo = true;
    }
    if (ImageTypes.includes(contentType)) {
      updated.isImage = true;
    }
  }

  return updated;
}
