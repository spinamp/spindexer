//noizd

// export const generateNOIZDId = (id: string, provider: MusicProvider) =>
//   `${provider}/${id}`;

// export const mapNoizdTrack = (track: INoizdTrack): IRawTrack => {
//   const {cover} = track;
//   const artwork = isVideo(cover.mime)
//     ? getVideoPosterUrl(cover.url)
//     : cover.url;

// artist: {
//   name: track.artist.username,
//   id: generateNOIZDId(track.artist.id, MusicProvider.noizd),
//   originalId: track.artist.id,
//   provider: MusicProvider.noizd,
//   avatarUrl: track.artist.profile?.image_profile?.url,
//   websiteUrl: `https://noizd.com/u/${track.artist.uri}`,
// },
