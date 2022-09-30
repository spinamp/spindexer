import { Metaplex } from '@metaplex-foundation/js';
import { AnchorProvider, Wallet, web3 } from '@project-serum/anchor';
import { Keypair } from '@solana/web3.js';


export type SolanaClient = {
  metaplex: Metaplex;
  anchorProvider: AnchorProvider;
  connection: web3.Connection;
}

const init = async (): Promise<SolanaClient> => {
  const endpoint = process.env.SOLANA_PROVIDER_ENDPOINT;

  if (!endpoint) {
    throw 'No solana endpoint configured'
  }

  const connection = new web3.Connection(endpoint);
  
  const anchorProvider = new AnchorProvider(connection, new Wallet(new Keypair()), {})
  const metaplex = new Metaplex(connection);

  return {
    anchorProvider,
    metaplex,
    connection
  }
}

export default {
  init
};
