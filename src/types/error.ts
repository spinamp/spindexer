export type ProcessTrackError = {
  code: string,
  message: string
};

export const FAILED_AUDIO_EXTRACTION = '1';

export const ErrorMessages = {
  [FAILED_AUDIO_EXTRACTION]: `Failed to extract audio from nft`
}
