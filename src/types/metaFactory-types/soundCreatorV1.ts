import { ethereumId } from '../../utils/identifiers';
import { formatAddress } from '../address';
import { IdExtractorTypes, TitleExtractorTypes, ArtistNameExtractorTypes, AvatarUrlExtractorTypes, WebsiteUrlExtractorTypes } from '../fieldExtractor';
import { MetaFactoryType } from '../metaFactory';
import { NFTContractTypeName, NFTStandard } from '../nft';
import { MusicPlatformType } from '../platform';
import { Clients } from '../processor';

const type: MetaFactoryType = {
  newContractCreatedEvent: 'SoundEditionCreated',
  metadataAPI: async (events, clients: Clients) => {
    const editionAddresses = new Set(events.map(event => formatAddress(event.args!.soundEdition)));
    let soundPublicTimes: any;
    try {
      soundPublicTimes = await clients.sound.fetchPublicTimes([...editionAddresses]);
    } catch {
      // If API Fails/is down, assume it's official and no presales
      return { officialEditions: new Set([...editionAddresses]), soundPublicTimes: {} };
    }
    const publicAddresses = new Set(Object.keys(soundPublicTimes));
    const officialEditions = new Set([...editionAddresses].filter((address) => publicAddresses.has(address)));
    return { soundPublicTimes, officialEditions };
  },
  creationMetadataToNftFactory: (event: any, autoApprove: boolean, metaFactory, factoryMetadata: any) => {
    const official = factoryMetadata.officialEditions.has(formatAddress(event.args!.soundEdition));
    const publicReleaseTimeRaw = factoryMetadata.soundPublicTimes[formatAddress(event.args!.soundEdition)];
    const publicReleaseTime = publicReleaseTimeRaw ? new Date(publicReleaseTimeRaw) : undefined;
    return ({
      id: formatAddress(event.args!.soundEdition),
      chainId: metaFactory.chainId,
      platformId: official ? 'sound' : 'sound-protocol-v1',
      startingBlock: `${parseInt(event.blockNumber) - 1}`,
      contractType: NFTContractTypeName.default,
      standard: NFTStandard.ERC721,
      autoApprove: official,
      approved: official,
      typeMetadata: {
        other: {
          publicReleaseTime
        },
        overrides: {
          type: MusicPlatformType['multi-track-multiprint-contract'],
          artist: {
            artistId: ethereumId(event.args!.deployer),
          },
          extractor: {
            id: IdExtractorTypes.TRACK_NUMBER,
            title: TitleExtractorTypes.METADATA_TITLE,
            artistName: ArtistNameExtractorTypes.METADATA_ARTIST,
            avatarUrl: AvatarUrlExtractorTypes.METADATA_IMAGE,
            websiteUrl: WebsiteUrlExtractorTypes.METADATA_EXTERNAL_URL,
            artistWebsiteUrl: WebsiteUrlExtractorTypes.EXTERNAL_URL_WITH_ONLY_FIRST_SEGMENT
          }
        }
      }
    })}
}

export default type;
