import { Metaplex, convertToPublickKey } from '@metaplex-foundation/js';
import { web3 } from '@project-serum/anchor';
import axios from 'axios';
import knex from 'knex';
import slugify from 'slugify';

import { Table } from '../../db/db';
import { ninaContractsWithoutNfts } from '../../triggers/nina';
import { Artist } from '../../types/artist';
import { ERC721NFT } from '../../types/erc721nft';
import { ERC721Contract } from '../../types/ethereum';
import { Clients, Processor } from '../../types/processor';

export const createNinaNfts: Processor = {

  name: 'createNinaNfts',
  trigger: ninaContractsWithoutNfts,
  processorFunction: async (contracts: ERC721Contract[], clients: Clients) => {
    const connection = new web3.Connection('https://ssc-dao.genesysgo.net/');

    const metaplex = new Metaplex(connection);
    const metadataAccounts = (await metaplex.nfts().findAllByMintList(contracts.map(contract => convertToPublickKey(contract.address))))
      .filter(account => account?.uri)

    const nfts = (await Promise.all(metadataAccounts.map(async (metadataAccount) => {

      const metadataJson = (await axios.get(metadataAccount!.uri)).data
      const mintAddress = metadataAccount!.mint.toBase58();

      const createdAtTime = new Date(metadataJson.properties.date);

      const details: ERC721NFT = {
        id: mintAddress,
        metadata: metadataJson,
        contractAddress: mintAddress,
        platformId: contracts.find(contract => contract.address === mintAddress)!.platformId,
        tokenMetadataURI: metadataAccount!.uri,
        createdAtTime,
        tokenId: BigInt(10),
        owner: '',
        tokenURI: metadataAccount!.uri
      }
      return details
    })))
    // ignore nfts with no metadata
      .filter(nft => nft.metadata)

    await clients.db.insert<ERC721NFT>(Table.erc721nfts, nfts)

    // sort nfts by date
    const sortedNfts = nfts.sort((a,b) => a.createdAtTime.getTime() - b.createdAtTime.getTime())
    const uniqueArtistsNfts: { [artistName: string]: ERC721NFT } = {};

    for (const artistNft of sortedNfts){
      try {
        if (!uniqueArtistsNfts[artistNft.metadata.properties.artist]){
          uniqueArtistsNfts[artistNft.metadata.properties.artist] = artistNft;
        }
      } catch (e){
        console.log('error checking for dupe artist', e);
        console.log(artistNft)
        console.log(uniqueArtistsNfts)
      }
    }

    // insert new artists
    const artists: Artist[] = Object.values(uniqueArtistsNfts)
      .map(nft => ({
        createdAtTime: nft.createdAtTime,
        id: `nina/${nft.metadata.properties.artist.replace(' ', '-')}`,
        name: nft.metadata.properties.artist,
        slug: slugify(`${nft.metadata.properties.artist} ${nft.createdAtTime.getTime()}`).toLowerCase(),
        createdAtEthereumBlockNumber: '100'
      }))

    console.log('insert artists', artists)

    await knex(Table.artists).insert(artists)
    // .onConflict().ignore()
  },
  initialCursor: undefined
};
