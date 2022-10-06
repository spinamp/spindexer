export type ProcessTrackError = {
  code: string,
  message: string
};

export const FailedAudioExtractionError = new Error('Failed to extract audio from nft');
FailedAudioExtractionError.name = 'FailedAudioExtractionError';
