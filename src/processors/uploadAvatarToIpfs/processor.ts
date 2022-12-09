import {extractHashFromURL, urlSource} from '../../clients/ipfs';
import {Table} from '../../db/db';
import {ArtistProfile} from '../../types/artist';
import {IPFSFile} from '../../types/ipfsFile';
import {Clients, Processor} from '../../types/processor';
import {rollPromises} from '../../utils/rollingPromises';
import {IPFSUploadError} from './IPFSUploadError';
import {avatarsNotOnIpfs} from './trigger';

type ProfileWithAvatarIpfsFile = ArtistProfile & Partial<IPFSFile>;

type ArtistProfileId = {
  artistId: string;
  platformId: string;
};

type UploadedAvatarDetails = ArtistProfileId & {
  cid: string;
  avatarUrl: string;
};

const extractArtistProfileId = (
  profileWithFile: ProfileWithAvatarIpfsFile,
): ArtistProfileId => ({
  artistId: profileWithFile.artistId,
  platformId: profileWithFile.platformId,
});

const uploadAvatar = async (
  profileWithFile: ProfileWithAvatarIpfsFile,
  clients: Clients,
): Promise<UploadedAvatarDetails> => {
  console.log('uploadAvatarToIpfs:: uploading ', profileWithFile.avatarUrl);

  if (profileWithFile.avatarUrl == null) {
    throw new Error(`Error uploading avatar: the URL to upload is null!`);
  }

  // Check if this file is already on IPFS -- if so, we don't need to upload it ourselves,
  // just to record its hash in the DB.
  const preexistingIpfsHash = extractHashFromURL(profileWithFile.avatarUrl);
  if (preexistingIpfsHash) {
    // Return everything that is needed to update both DB entries: artist profile, and IPFS file
    return {
      ...extractArtistProfileId(profileWithFile),
      avatarUrl: profileWithFile.avatarUrl,
      cid: preexistingIpfsHash,
    };
  }

  try {
    const file = await clients.ipfs.client.add(
      urlSource(profileWithFile.avatarUrl),
      {
        pin: false,
        timeout: parseInt(process.env.IPFS_API_TIMEOUT!),
      },
    );

    // Return everything that is needed to update both records: artist profile, and IPFS file
    return {
      ...extractArtistProfileId(profileWithFile),
      avatarUrl: profileWithFile.avatarUrl,
      cid: file.cid.toString(),
    };
  } catch (e: any) {
    throw new IPFSUploadError(e.message, profileWithFile.avatarUrl);
  }
};

/**
 * Adds avatar images for artist profiles to IPFS. Saves the CID of these newly-uploaded avatar images to the database as avatarIPFSHash.
 * @param artistProfilesWithFiles
 * @param clients
 */
const processorFunction = async (
  artistProfilesWithFiles: ProfileWithAvatarIpfsFile[],
  clients: Clients,
) => {
  const results = await rollPromises<
    ProfileWithAvatarIpfsFile,
    UploadedAvatarDetails,
    IPFSUploadError
  >(
    artistProfilesWithFiles,
    profileIpfsFile => uploadAvatar(profileIpfsFile, clients),
    300,
    10000,
  );

  const uploadedAvatarDetails = results
    .filter(result => !result.isError)
    .map(result => result.response) as UploadedAvatarDetails[];
  // We need to assert this type above because TypeScript isn't smart enough to know that this
  // filters out all error responses

  const artistProfileUpdates = uploadedAvatarDetails.map(
    ({artistId, platformId, cid}) => ({
      artistId,
      platformId,
      avatarIPFSHash: cid,
    }),
  );

  const ipfsFileSuccessUpdates = uploadedAvatarDetails.map(
    ({avatarUrl, cid}) => ({url: avatarUrl, cid}),
  );

  const ipfsFileFailureUpdates = results
    .filter(result => result.isError)
    .map(result => result.error as IPFSUploadError)
    .map(error => ({url: error.url, error: error.message}));

  const ipfsFileUpdates = [
    ...ipfsFileSuccessUpdates,
    ...ipfsFileFailureUpdates,
  ];

  if (ipfsFileFailureUpdates.length > 0) console.log("IPFS file uploads failed: ", JSON.stringify(ipfsFileFailureUpdates))

  // TODO: update rather than upsert (needs change to db client to accept multiple IDs)
  await clients.db.upsert(Table.artistProfiles, artistProfileUpdates, ['artistId', 'platformId']);
  await clients.db.upsert(Table.ipfsFiles, ipfsFileUpdates, 'url');
};

export const ipfsAvatarUploader: Processor = {
  name: 'ipfsAvatarUploader',
  trigger: avatarsNotOnIpfs,
  processorFunction,
};
