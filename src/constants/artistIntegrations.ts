
import { TitleExtractorTypes, IdExtractorTypes, ArtistIdExtractorTypes, ArtistNameExtractorTypes, WebsiteUrlExtractorTypes, ArtworkUrlExtractorTypes, AudioUrlExtractorTypes } from '../types/fieldExtractor';
import { MetaFactory, MetaFactoryTypeName } from '../types/metaFactory';
import { NftFactory, NFTContractTypeName, NFTStandard } from '../types/nft';
import { MusicPlatform, MusicPlatformType } from '../types/platform';
import { ethereumId } from '../utils/identifiers';

// Custom artist and platform migration details extracted in preparation
// for a fully CRDT based approach

// Migration 01
const NOIZD_PLATFORM: MusicPlatform = {
  id: 'noizd',
  type: MusicPlatformType.noizd,
  name: 'NOIZD'
}
const CATALOG_PLATFORM: MusicPlatform = {
  id: 'catalog',
  type: MusicPlatformType.catalog,
  name: 'Catalog'
}
const SOUND_ORIGINAL_PLATFORM: MusicPlatform = {
  id: 'sound',
  type: MusicPlatformType.sound,
  name: 'Sound.xyz'
}
const ZORA_ORIGINAL_PLATFORM: MusicPlatform = {
  id: 'zoraOriginal',
  type: MusicPlatformType.zora,
  name: 'Zora'
}
export const ZORA_LATEST_PLATFORM: MusicPlatform = {
  id: 'zora',
  type: MusicPlatformType.zora,
  name: 'Zora'
}

// Migration 02
const NOIZD_FACTORY: NftFactory = {
  id: '0xf5819e27b9bad9f97c177bf007c1f96f26d91ca6',
  platformId: NOIZD_PLATFORM.id,
  startingBlock: '13470560',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}

const CATALOG_FACTORY: NftFactory = {
  id: '0x0bc2a24ce568dad89691116d5b34deb6c203f342',
  platformId: CATALOG_PLATFORM.id,
  startingBlock: '14566825',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}

export const ZORA_ORIGINAL_FACTORY: NftFactory = {
  id: '0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7',
  platformId: ZORA_ORIGINAL_PLATFORM.id,
  startingBlock: '11565019',
  contractType: NFTContractTypeName.zora,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}

// Migration 03
const SOUND_ORIGINAL_META_FACTORY: MetaFactory = {
  id: '0x78e3adc0e811e4f93bd9f1f9389b923c9a3355c2',
  platformId: SOUND_ORIGINAL_PLATFORM.id,
  startingBlock: '13725565',
  contractType: MetaFactoryTypeName.soundArtistProfileCreator,
  gap: '500000',
  standard: NFTStandard.ERC721,
  autoApprove: true
}

// Migration 04
const HEDS_PLATFORM: MusicPlatform = {
  id: 'heds',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'Heds',
}
const HEDSTAPE_1_FACTORY: NftFactory = {
  id: '0xde8a0b17d3dc0468adc65309881d9d6a6cd66372',
  startingBlock: '14193218',
  platformId: HEDS_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}
const HEDSTAPE_2_FACTORY: NftFactory = {
  id: '0x5083cf11003f2b25ca7456717e6dc980545002e5',
  platformId: HEDS_PLATFORM.id,
  startingBlock: '14373902',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}
const HEDSTAPE_3_FACTORY: NftFactory = {
  id: '0x567e687c93103010962f9e9cf5730ae8dbfc6d41',
  platformId: HEDS_PLATFORM.id,
  startingBlock: '14548642',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}
const HEDSTAPE_4_FACTORY: NftFactory = {
  id: '0x8045fd700946a00436923f37d08f280ade3b4af6',
  platformId: HEDS_PLATFORM.id,
  startingBlock: '14813869',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}

// Migration 05
const CHAOS_PLATFORM: MusicPlatform = {
  id: '0x8427e46826a520b1264b55f31fcb5ddfdc31e349',
  type: MusicPlatformType.chaos,
  name: 'Chaos',
}

const CHAOS_FACTORY: NftFactory = {
  id: '0x8427e46826a520b1264b55f31fcb5ddfdc31e349',
  platformId: CHAOS_PLATFORM.id,
  startingBlock: '14891073',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
}

// Migration 06
const MINT_PLATFORM: MusicPlatform = {
  id: 'mintsongs',
  type: MusicPlatformType.mintsongsV2,
  name: 'Mintsongs'
}
const MINT_FACTORY: NftFactory = {
  id: '0x2B5426A5B98a3E366230ebA9f95a24f09Ae4a584',
  platformId: MINT_PLATFORM.id,
  startingBlock: '14793509',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
};

// Migration 07
const HEDSTAPE_5_FACTORY: NftFactory = {
  id: '0x8f36eb094f7b960a234a482d4d8ffb8b37f728c6',
  platformId: HEDS_PLATFORM.id,
  startingBlock: '14986141',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
};

// Migration 08
const ROHKI_PLATFORM: MusicPlatform = {
  id: 'rohki',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'RŌHKI',
}

const ROHKI_DESPERADO_FACTORY: NftFactory = {
  id: '0xe8e7Eb47dD7eaFeC80c1EF7f0aE39beE6Dbce469',
  platformId: ROHKI_PLATFORM.id,
  startingBlock: '14779299',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      track: {
        lossyAudioIPFSHash: 'QmcnpLmiLpMNMMpcJkKjKTgwcsUyUWTstFtRZat6TYsmBV',
        lossyArtworkIPFSHash: 'QmZWbY9VtabJ6ZRieUo5LoetBuBBETKeJhjF5upstj29jp',
        title: 'Desperado',
        websiteUrl: 'https://www.rohki.xyz/'
      },
      artist: {
        name: 'RŌHKI',
        avatarUrl: 'https://lh3.googleusercontent.com/jyOxrrZ5Nhton5vIAL10yCFexExXjLWhU_KfGYNjm7pC1conv3BzH1PUYGqyD_4cvAEskqs-gOCN5uhCbuKVdorh_MRwqitEjuWzDJs=s0',
        websiteUrl: 'https://www.rohki.xyz/'
      }
    }
  }
};

// Migration 09
const ROHKI_VROOM_FACTORY: NftFactory = {
  id: '0x317394c6dFB5606c2917E1a0DAD4f1B70EDDC921',
  platformId: ROHKI_PLATFORM.id,
  startingBlock: '15112828',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      track: {
        lossyAudioIPFSHash: 'QmdWicgFzBY1pK2Bg9FjHTu8gvXH6bfvdS3v5XksBHPdZ8',
        lossyArtworkIPFSHash: 'QmcjiGuADJz9v2MYVHt92Td5kEyHUhfCMQwvJav3c6a1Dv',
        title: 'Vroom',
        websiteUrl: 'https://www.rohki.xyz/'
      },
      artist: {
        name: 'RŌHKI',
        avatarUrl: 'https://lh3.googleusercontent.com/jyOxrrZ5Nhton5vIAL10yCFexExXjLWhU_KfGYNjm7pC1conv3BzH1PUYGqyD_4cvAEskqs-gOCN5uhCbuKVdorh_MRwqitEjuWzDJs=s0',
        websiteUrl: 'https://www.rohki.xyz/'
      }
    }
  }
};

// Migration 10
const HEDSTAPE_6_FACTORY: NftFactory = {
  id: '0x885236535D5Cf7033BdC5bC1050CaD7fdf4970a6',
  platformId: HEDS_PLATFORM.id,
  startingBlock: '15200392',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
};


// Migration 11
const danielAllanAddress = '0x719C6d392fc659f4fe9b0576cBC46E18939687a7';

const DANIEL_ALLAN_PLATFORM: MusicPlatform = {
  id: danielAllanAddress,
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'danielallan.xyz',
}

const DANIEL_ALLAN_GLASSHOUSE_FACTORY: NftFactory = {
  id: danielAllanAddress,
  platformId: DANIEL_ALLAN_PLATFORM.id,
  startingBlock: '15151004',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Daniel Allan',
        artistId: ethereumId('0xbcefc4906b443e4db64e2b00b9af2c39e76c785c'),
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

// Migration 12
const NINA_PLATFORM: MusicPlatform = {
  id: 'nina',
  type: MusicPlatformType.nina,
  name: 'Nina',
}

const NINA_META_FACTORY: MetaFactory = {
  id: 'ninaN2tm9vUkxoanvGcNApEeWiidLMM2TdBX8HoJuL4',
  platformId: NINA_PLATFORM.id,
  contractType: MetaFactoryTypeName.ninaMintCreator,
  standard: NFTStandard.METAPLEX,
  autoApprove: true,
};

// Migration 14
const HUME_PLATFORM: MusicPlatform = {
  id: 'hume',
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'Hume',
}

const HUME_OTHERSIDE_FACTORY: NftFactory = {
  id: '0x0301E208Ec282EC38934606EF53dBD5876ED7eB0',
  platformId: HUME_PLATFORM.id,
  startingBlock: '14886522',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      track: {
        websiteUrl: 'https://www.wearehume.com/'
      },
      artist: {
        name: 'angelbaby',
        artistId: 'angelbaby',
        platformInternalId: 'angelbaby',
        avatarUrl: 'https://pbs.twimg.com/profile_images/1547686210016907265/1pyVAGp7_400x400.jpg',
        websiteUrl: 'https://www.wearehume.com/',
      }
    }
  }
};

// Migration 15
const HUME_VIEW_FROM_THE_MOON_FACTORY: NftFactory = {
  id: '0x09d6e0f30cFdf2f62c1179516B1F980c5D96571E',
  platformId: HUME_PLATFORM.id,
  startingBlock: '14962984',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      track: {
        websiteUrl: 'https://www.wearehume.com/'
      },
      artist: {
        name: 'angelbaby',
        artistId: 'angelbaby',
        platformInternalId: 'angelbaby',
        avatarUrl: 'https://pbs.twimg.com/profile_images/1547686210016907265/1pyVAGp7_400x400.jpg',
        websiteUrl: 'https://www.wearehume.com/',
      }
    }
  }
};

// Migration 16
const HUME_MINTED_FACTORY: NftFactory = {
  id: '0x8056B7750D2A061757a0ECA13eEf78caeDD4a30F',
  platformId: HUME_PLATFORM.id,
  startingBlock: '15121180',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      track: {
        websiteUrl: 'https://www.wearehume.com/'
      },
      artist: {
        name: 'angelbaby',
        artistId: 'angelbaby',
        platformInternalId: 'angelbaby',
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/Qmf5N7GzNAgrL3WyACTwyXjCcUyzpPCqxNBEZD6s6sGog3',
        websiteUrl: 'https://www.wearehume.com/',
      }
    }
  }
};

// Migration 18
const HEDSTAPE_7_FACTORY: NftFactory = {
  id: '0x20f2717f113d0b3815124876f3d72f8e1179341e',
  platformId: HEDS_PLATFORM.id,
  startingBlock: '15373455',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
};

// Migration 22
const ZORA_META_FACTORY: MetaFactory = {
  id: '0xf74b146ce44cc162b601dec3be331784db111dc1',
  platformId: ZORA_LATEST_PLATFORM.id,
  startingBlock: '14758779',
  contractType: MetaFactoryTypeName.zoraDropCreator,
  gap: '500000',
  standard: NFTStandard.ERC721,
  autoApprove: false,
}

// Migration 23
const HEDS_COLLAB_FACTORY: NftFactory = {
  id: '0xEeB431Caa15B526f48Ee4DB3697FE57EC8223A8e',
  platformId: HEDS_PLATFORM.id, // part of existing heds platform
  startingBlock: '15416993',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      type: MusicPlatformType['hedsCollab'],
    }
  }
};

// Migration 24
const jagwarTwinAddress = '0xe80c7fee3d41e311e0351244231919e04e699e56';

const JAGWAR_TWIN_PLATFORM: MusicPlatform = {
  id: jagwarTwinAddress,
  type: MusicPlatformType['single-track-multiprint-contract'],
  name: 'jagwartwin.com',
}

const JAGWAR_TWIN_THOUGHT_FORMS_NFT_FACTORY: NftFactory = {
  id: '0x605B0E6b2Ec949235ff5Ac05bD452E22d21c702d',
  platformId: JAGWAR_TWIN_PLATFORM.id,
  startingBlock: '14779895',
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
        artistId: ethereumId(jagwarTwinAddress),
        avatarUrl: 'https://web3-music-pipeline.mypinata.cloud/ipfs/QmcBb9C69vvJXasxTYFPwpo9WuZv415KkH3wTdoeBMH2hH',
        websiteUrl: 'https://jagwartwin.com/'
      },
      extractor: {
        title: TitleExtractorTypes.METADATA_NAME,
      }
    }
  }
};

// Migration 25
const JAGWAR_TWIN_ALBUM_NFT_FACTORY: NftFactory = {
  id: '0xF85c1f4aC0040e4f2369cFcbAbfccfa2F3E6899E',
  platformId: JAGWAR_TWIN_PLATFORM.id,
  startingBlock: '14449703',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Jagwar Twin',
        artistId: ethereumId(jagwarTwinAddress),
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

// Migration 26
const JAGWAR_TWIN_ARTIFACTS_FACTORY: NftFactory = {
  id: '0x84F89f7bAcb20970073Be33F22847e58fbe78992',
  platformId: JAGWAR_TWIN_PLATFORM.id,
  startingBlock: '15316663',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: false,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Jagwar Twin',
        artistId: ethereumId(jagwarTwinAddress),
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

// Migration 28
const mighty33Address = '0x8C62dD796e13aD389aD0bfDA44BB231D317Ef6C6';

const MIGHTY_33_PLATFORM: MusicPlatform = {
  id: 'geniuscorp.fr',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'geniuscorp.fr',
}

const MIGHTY_33_OTHERS_DIE_FACTORY: NftFactory = {
  id: '0x97b9f21b41041e344f5bd71e3e86b69e79dcc0a6',
  platformId: MIGHTY_33_PLATFORM.id,
  startingBlock: '10688107',
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true,
  typeMetadata: {
    overrides: {
      artist: {
        name: 'Mighty33',
        artistId: ethereumId(mighty33Address),
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

// Migration 29
const HOLLY_PLUS_PLATFORM: MusicPlatform = {
  id: 'hollyplus',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'hollyplus',
}

const HOLLY_PLUS_FACTORY: NftFactory = {
  id: '0x6688Ee4E6e17a9cF88A13Da833b011E64C2B4203',
  platformId: HOLLY_PLUS_PLATFORM.id,
  startingBlock: '13001583',
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

// Migration 33
const RELICS_YXZ_PLATFORM: MusicPlatform = {
  id: 'relics',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'RELICS',
}

const RELICS_SEASON_1_FACTORY: NftFactory = {
  id: '0x441C1266E6fb13C38c2752eab0D11A99905FFef4',
  platformId: RELICS_YXZ_PLATFORM.id,
  startingBlock: '14180427',
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

// Migration 34
const SOUND_PROTOCOL_PLATFORM: MusicPlatform = {
  id: 'sound-protocol-v1',
  type: MusicPlatformType['multi-track-multiprint-contract'],
  name: 'Sound Protocol',
}

const SOUND_PROTOCOL_META_FACTORY: MetaFactory = {
  id: '0xaef3e8c8723d9c31863be8de54df2668ef7c4b89',
  startingBlock: '15570833',
  platformId: 'sound',
  contractType: MetaFactoryTypeName.soundCreatorV1,
  gap: '500000',
  standard: NFTStandard.ERC721,
  autoApprove: true,
}

// Migration 35
const HEDSTAPE_8_FACTORY: NftFactory = {
  id: '0xA2acEd918E8cff703b8BB4129a30146A1Dc35675',
  startingBlock: '15642296',
  platformId: HEDS_PLATFORM.id,
  contractType: NFTContractTypeName.default,
  standard: NFTStandard.ERC721,
  autoApprove: true,
  approved: true
};

export const PLATFORMS: MusicPlatform[] = [
  NOIZD_PLATFORM, CATALOG_PLATFORM, NINA_PLATFORM, MINT_PLATFORM,
  SOUND_ORIGINAL_PLATFORM, SOUND_PROTOCOL_PLATFORM,
  ZORA_ORIGINAL_PLATFORM, ZORA_LATEST_PLATFORM,
  HEDS_PLATFORM, CHAOS_PLATFORM, DANIEL_ALLAN_PLATFORM, ROHKI_PLATFORM, HUME_PLATFORM, JAGWAR_TWIN_PLATFORM, MIGHTY_33_PLATFORM, HOLLY_PLUS_PLATFORM, RELICS_YXZ_PLATFORM
]

export const FACTORIES: NftFactory[] = [
  NOIZD_FACTORY, CATALOG_FACTORY, ZORA_ORIGINAL_FACTORY,
  HEDS_COLLAB_FACTORY, HEDSTAPE_1_FACTORY, HEDSTAPE_2_FACTORY, HEDSTAPE_3_FACTORY, HEDSTAPE_4_FACTORY, HEDSTAPE_5_FACTORY, HEDSTAPE_6_FACTORY, HEDSTAPE_7_FACTORY, HEDSTAPE_8_FACTORY,
  CHAOS_FACTORY, MINT_FACTORY, DANIEL_ALLAN_GLASSHOUSE_FACTORY,
  ROHKI_DESPERADO_FACTORY, ROHKI_VROOM_FACTORY,
  HUME_OTHERSIDE_FACTORY, HUME_VIEW_FROM_THE_MOON_FACTORY, HUME_MINTED_FACTORY,
  JAGWAR_TWIN_THOUGHT_FORMS_NFT_FACTORY, JAGWAR_TWIN_ALBUM_NFT_FACTORY, JAGWAR_TWIN_ARTIFACTS_FACTORY,
  MIGHTY_33_OTHERS_DIE_FACTORY, HOLLY_PLUS_FACTORY, RELICS_SEASON_1_FACTORY,
]

export const META_FACTORIES: MetaFactory[] = [
  SOUND_ORIGINAL_META_FACTORY, SOUND_PROTOCOL_META_FACTORY,
  NINA_META_FACTORY, ZORA_META_FACTORY
]
