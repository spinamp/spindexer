
import { EthClient, ValidContractCallFunction } from '../../clients/ethereum';
import { Table } from '../../db/db';
import { fromDBRecords } from '../../db/orm';
import { NftFactory, NFTStandard } from '../../types/nft';
import { Clients } from '../../types/processor';
import { Trigger } from '../../types/trigger';

const name = 'getERC721ContractFields';

export const getERC721ContractFields = async (contracts: NftFactory[], ethClient: EthClient) => {
  const allContractCalls = contracts.map(contract => {
    return [
      {
        contractAddress: contract.id,
        callFunction: ValidContractCallFunction.name,
      },
      {
        contractAddress: contract.id,
        callFunction: ValidContractCallFunction.symbol,
      }
    ]
  });
  const flatContractCalls: {
    contractAddress: string;
    callFunction: ValidContractCallFunction;
  }[] = [];
  let flatContractCallsIndex = 0;
  const contractIndexToCalls = allContractCalls.map((contractCalls) => {
    const callIndexes: number[] = [];
    contractCalls.forEach(call => {
      flatContractCalls.push(call);
      callIndexes.push(flatContractCallsIndex)
      flatContractCallsIndex++;
    });
    return callIndexes;
  });
  const callResults = await ethClient.call(flatContractCalls);
  const contractUpdates = contracts.map((contract, index) => {
    console.info(`Processing contract with address ${contract.id}`);
    const contractUpdate: Partial<NftFactory> = {
      id: contract.id,
    };
    const callIndexes = contractIndexToCalls[index];
    callIndexes.forEach(callIndex => {
      const key = flatContractCalls[callIndex].callFunction;
      const value = callResults[callIndex];
      contractUpdate[key] = value as string;
    });
    return contractUpdate;
  });
  return contractUpdates;
};

const processorFunction = async (contracts: NftFactory[], clients: Clients) => {
  const contractUpdates = await getERC721ContractFields(contracts, clients.eth);
  await clients.db.update(Table.nftFactories, contractUpdates);
};

export const unprocessedContracts: Trigger<undefined> = async (clients: Clients) => {
  // return results for ERC721 contracts that are approved and have no name or symbol
  const contracts = (await clients.db.rawSQL(
    `select * from "${Table.nftFactories}" where ("name" is null or "symbol" is null) and "standard" = '${NFTStandard.ERC721}' and "approved" = true;`
  )).rows.slice(0, parseInt(process.env.QUERY_TRIGGER_BATCH_SIZE!));
  return fromDBRecords(Table.nftFactories, contracts);
};

export const getERC721ContractFieldsProcessor = {
  name,
  trigger: unprocessedContracts,
  processorFunction: processorFunction,
  initialCursor: undefined,
};
