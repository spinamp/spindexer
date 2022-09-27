import { TitleExtractorTypes, IdExtractorTypes, ArtistIdExtractorTypes, ArtistNameExtractorTypes, WebsiteUrlExtractorTypes, ArtworkUrlExtractorTypes, AudioUrlExtractorTypes } from '../types/fieldExtractor';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../types/nft';
import { MusicPlatform, MusicPlatformType } from '../types/platform';
import { ethereumArtistId } from '../utils/identifiers';

// Custom artist integration details are being extracted from the migrations in preparation
// for a fully CRDT based approach

// 11
const glassHouseAddress = '0x719C6d392fc659f4fe9b0576cBC46E18939687a7';

export const GLASSHOUSE_PLATFORM: MusicPlatform = {
  id: glassHouseAddress,
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'danielallan.xyz',
}

export const GLASSHOUSE: NftFactory = {
  id: glassHouseAddress,
  startingBlock: '15151004',
  platformId: GLASSHOUSE_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Daniel Allan',
        artistId: ethereumArtistId('0xbcefc4906b443e4db64e2b00b9af2c39e76c785c'),
        avatarUrl: 'https://storageapi.fleek.co/catalogworks-team-bucket/prod/users/0xbcefc4906b443e4db64e2b00b9af2c39e76c785c/images/profile_picture.jpeg'
      },
      extractor: {
        title: TitleExtractorTypes.ATTRIBUTES_TRAIT_TRACK,
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
        artistId: ArtistIdExtractorTypes.USE_ARTIST_ID_OVERRIDE,
        artistName: ArtistNameExtractorTypes.USE_ARTIST_NAME_OVERRIDE,
      }
    }
  }
};

// 24
const jagwarTwinAddress = '0xe80c7fee3d41e311e0351244231919e04e699e56';

export const JAGWAR_TWIN_PLATFORM: MusicPlatform = {
  id: jagwarTwinAddress,
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'jagwartwin.com',
}

export const THOUGHT_FORMS_NFT_FACTORY: NftFactory = {
  id: '0x605B0E6b2Ec949235ff5Ac05bD452E22d21c702d',
  startingBlock: '14779895',
  platformId: JAGWAR_TWIN_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  approved: true,
  autoApprove: true,
  typeMetadata: {
    overrides: {
      track: {
        title: 'East Is Everywhere',
        websiteUrl: 'https://jagwartwin.com/'
      },
      artist: {
        name: 'Jagwar Twin',
        artistId: ethereumArtistId(jagwarTwinAddress),
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmcBb9C69vvJXasxTYFPwpo9WuZv415KkH3wTdoeBMH2hH',
        websiteUrl: 'https://jagwartwin.com/'
      },
      extractor: {
        title: TitleExtractorTypes.METADATA_NAME,
      }
    }
  }
};

// 25
export const ALBUM_NFT_FACTORY: NftFactory = {
  id: '0xF85c1f4aC0040e4f2369cFcbAbfccfa2F3E6899E',
  startingBlock: '14449703',
  platformId: jagwarTwinAddress,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Jagwar Twin',
        artistId: ethereumArtistId(jagwarTwinAddress),
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmcBb9C69vvJXasxTYFPwpo9WuZv415KkH3wTdoeBMH2hH',
        websiteUrl: 'https://jagwartwin.com/'
      },
      type: MusicPlatformType['multi-track-multiprint-contract'],
      extractor: {
        title: TitleExtractorTypes.ATTRIBUTES_TRAIT_SONG_TITLE,
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
        artistId: ArtistIdExtractorTypes.USE_ARTIST_ID_OVERRIDE,
        artistName: ArtistNameExtractorTypes.USE_ARTIST_NAME_OVERRIDE,
      }
    }
  }
};


// 26
export const ARTIFACTS: NftFactory = {
  id: '0x84F89f7bAcb20970073Be33F22847e58fbe78992',
  startingBlock: '15316663',
  platformId: jagwarTwinAddress,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: false,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Jagwar Twin',
        artistId: ethereumArtistId(jagwarTwinAddress),
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmcBb9C69vvJXasxTYFPwpo9WuZv415KkH3wTdoeBMH2hH',
        websiteUrl: 'https://jagwartwin.com/'
      },
      type: MusicPlatformType['multi-track-multiprint-contract'],
      extractor: {
        title: TitleExtractorTypes.METADATA_NAME,
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
        artistId: ArtistIdExtractorTypes.USE_ARTIST_ID_OVERRIDE,
        artistName: ArtistNameExtractorTypes.USE_ARTIST_NAME_OVERRIDE,
      }
    }
  }
};

// 28
const mighty33Address = '0x8C62dD796e13aD389aD0bfDA44BB231D317Ef6C6';

export const MIGHTY_33: MusicPlatform = {
  id: 'geniuscorp.fr',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'geniuscorp.fr',
}

export const OTHERS_DIE: NftFactory = {
  id: '0x97b9f21b41041e344f5bd71e3e86b69e79dcc0a6',
  startingBlock: '10688107',
  platformId: 'geniuscorp.fr',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Mighty33',
        artistId: ethereumArtistId(mighty33Address),
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmS8dBxzgmNcCL71XYM5WxCkb2MM8rhQdCqAf1as8XXCVo',
        websiteUrl: 'https://geniuscorp.fr/m33'
      },
      track: {
        websiteUrl: 'https://geniuscorp.fr/m33'
      },
      type: MusicPlatformType['multi-track-multiprint-contract'],
      extractor: {
        title: TitleExtractorTypes.METADATA_NAME_WITHOUT_LEADING_INFO,
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
        artistId: ArtistIdExtractorTypes.USE_ARTIST_ID_OVERRIDE,
        artistName: ArtistNameExtractorTypes.USE_ARTIST_NAME_OVERRIDE,
      }
    }
  }
};

// 29
export const HOLLY_PLUS_PLATFORM: MusicPlatform = {
  id: 'hollyplus',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'hollyplus',
}

export const HOLLY_PLUS: NftFactory = {
  id: '0x6688Ee4E6e17a9cF88A13Da833b011E64C2B4203',
  startingBlock: '13001583',
  platformId: 'hollyplus',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'hollyplus',
        websiteUrl: 'https://auction.holly.plus/',
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmQ2AbbqTD5BF4Y12YwtDaosn2k9LGGS6VeXn28bapwHJY',
      },
      type: MusicPlatformType['multi-track-multiprint-contract'],
      extractor: {
        title: TitleExtractorTypes.METADATA_NAME,
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
        websiteUrl: WebsiteUrlExtractorTypes.USE_TOKEN_ID_APPENDED_EXTERNAL_URL,
        artistName: ArtistNameExtractorTypes.USE_ARTIST_NAME_OVERRIDE,
      }
    }
  }
};

// 33
export const RELICS_YXZ: MusicPlatform = {
  id: 'relics',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'RELICS',
}

export const SEASONS_1: NftFactory = {
  id: '0x441C1266E6fb13C38c2752eab0D11A99905FFef4',
  startingBlock: '14180427',
  platformId: 'relics',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        websiteUrl: 'https://relics.xyz',
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmSRN9HKXiziZzvkWrPG92UUHYiDKSZhfrFKf42EkniZVt',
      },
      track: {
        websiteUrl: 'https://relics.xyz',
        lossyArtworkURL: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmSRN9HKXiziZzvkWrPG92UUHYiDKSZhfrFKf42EkniZVt',
      },
      type: MusicPlatformType['multi-track-multiprint-contract'],
      extractor: {
        id: IdExtractorTypes.USE_TITLE_EXTRACTOR,
        title: TitleExtractorTypes.METADATA_NAME_WITHOUT_TRAILING_INFO,
        audioUrl: AudioUrlExtractorTypes.ATTRIBUTES_TRAIT_AUDIO,
        artworkUrl: ArtworkUrlExtractorTypes.USE_ARTWORK_URL_OVERRIDE,
        artistName: ArtistNameExtractorTypes.ATTRIBUTES_TRAIT_MUSICIAN,
        artistId: ArtistIdExtractorTypes.USE_PLATFORM_AND_ARTIST_NAME,
      }
    }
  }
};
