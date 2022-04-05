import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract, Provider } from 'ethcall';
import MetaABI from '../abis/MetaABI.json';

export enum ValidContractCallFunction {
  tokenURI = "tokenURI",
  tokenMetadataURI = "tokenMetadataURI"
}

export type EthCall = {
  contractAddress: string,
  callFunction: ValidContractCallFunction,
  callInput: string,
}

export type EthClient = {
  call: (ethCalls: EthCall[]) => Promise<unknown[]>;
}

const init = async () => {
  const provider = new JsonRpcProvider(process.env.ETHEREUM_PROVIDER_ENDPOINT);
  const ethcallProvider = new Provider();
  await ethcallProvider.init(provider);
  return {
    call: async (ethCalls: EthCall[]) => {
      const calls = ethCalls.map(ethCall => {
        const contract = new Contract(ethCall.contractAddress, MetaABI.abi);
        const call = contract[ethCall.callFunction](ethCall.callInput);
        return call;
      })
      const data = await ethcallProvider.all(calls);
      return data;
    }
  }
}

export default {
  init
};
