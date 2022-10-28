import { Metaplex } from '@metaplex-foundation/js';
import { AnchorProvider, Wallet, web3 } from '@project-serum/anchor';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { Keypair, PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';

export type SolanaClient = {
  metaplex: Metaplex;
  anchorProvider: AnchorProvider;
  connection: web3.Connection;
  getMintAddressesForCandyMachine: (CandyMachine: PublicKey) => Promise<string[]>;
  getMintTx: ( pubkey: PublicKey, options?: { before: string }) => Promise<ConfirmedSignatureInfo>
}

const MAX_NAME_LENGTH = 32;
const MAX_URI_LENGTH = 200;
const MAX_SYMBOL_LENGTH = 10;
const MAX_CREATOR_LEN = 32 + 1 + 1;
const MAX_CREATOR_LIMIT = 5;
const MAX_DATA_SIZE = 4 + MAX_NAME_LENGTH + 4 + MAX_SYMBOL_LENGTH + 4 + MAX_URI_LENGTH + 2 + 1 + 4 + MAX_CREATOR_LIMIT * MAX_CREATOR_LEN;
const MAX_METADATA_LEN = 1 + 32 + 32 + MAX_DATA_SIZE + 1 + 1 + 9 + 172;
const CREATOR_ARRAY_START = 1 + 32 + 32 + 4 + MAX_NAME_LENGTH + 4 + MAX_URI_LENGTH + 4 + MAX_SYMBOL_LENGTH + 2 + 1 + 4;

const TOKEN_METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const CANDY_MACHINE_V2_PROGRAM = new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ');

const getCandyMachineCreator = async (candyMachine: PublicKey): Promise<[PublicKey, number]> => (
  PublicKey.findProgramAddress(
    [Buffer.from('candy_machine'), candyMachine.toBuffer()],
    CANDY_MACHINE_V2_PROGRAM,
  )
);

const init = async (): Promise<SolanaClient> => {
  const endpoint = process.env.SOLANA_PROVIDER_ENDPOINT;

  if (!endpoint) {
    throw 'No solana endpoint configured'
  }

  const connection = new web3.Connection(endpoint);
  
  const anchorProvider = new AnchorProvider(connection, new Wallet(new Keypair()), {})
  const metaplex = new Metaplex(connection);

  const getMintAddressesForCandyMachine = async (candyMachine: PublicKey) => {
    const [candyMachineCreator] = (await getCandyMachineCreator(candyMachine));
     
    const metadataAccounts = await connection.getProgramAccounts(
      TOKEN_METADATA_PROGRAM,
      {
        // The mint address is located at byte 33 and lasts for 32 bytes.
        dataSlice: { offset: 33, length: 32 },
  
        filters: [
          // Only get Metadata accounts.
          { dataSize: MAX_METADATA_LEN },
  
          // Filter using the first creator.
          {
            memcmp: {
              offset: CREATOR_ARRAY_START,
              bytes: candyMachineCreator.toBase58(),
            },
          },
        ],
      },
    );
  
    return metadataAccounts.map((metadataAccountInfo) => {
      return bs58.encode(metadataAccountInfo.account.data)
    });
  };

  const getMintTx = async (pubkey: PublicKey, options?: { before: string }): Promise<ConfirmedSignatureInfo> => {
    const txList = await connection.getSignaturesForAddress(pubkey, { ...options });
  
    if (txList.length === 1000){
      return getMintTx(pubkey, { before: txList.at(-2)!.signature })
    }
  
    if (!txList.at(-1)){
      throw `no txs found for ${pubkey.toBase58()}`
    }
  
    return txList.at(-1)!
  } 

  return {
    anchorProvider,
    metaplex,
    connection,
    getMintAddressesForCandyMachine,
    getMintTx
  }
}

export default {
  init
};
