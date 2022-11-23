
import { DBClient, Table } from '../db/db';
import { EVMAddress } from '../types/evm';
import { getCrdtUpdateMessage, getCrdtUpsertMessage } from '../types/message'

import { AdminOperations, getCrdtContractApprovalMessage, MessagePayload, PublicOperations } from './types';
import { validateMessage } from './validation';

export const persistMessage = async (payload: MessagePayload, signer: EVMAddress, dbClient: DBClient) => {
  if (!signer) {
    throw new Error('must specify a signer');
  }

  validateMessage(payload, dbClient);

  const APIOperationMessageFnMap = {
    [AdminOperations.UPSERT]: getCrdtUpsertMessage,
    [AdminOperations.UPDATE]: getCrdtUpdateMessage,
    [PublicOperations.CONTRACT_APPROVAL]: getCrdtContractApprovalMessage,
  }

  const messageFn = APIOperationMessageFnMap[payload.operation];
  if (!messageFn) {
    throw new Error('must specify either `upsert`, `update`, or `contractApproval` operation');
  }

  const message = messageFn(Table[payload.entity], payload.data as any, signer);

  try {
    await dbClient.upsert(Table.seeds, [message])
  } catch (e: any) {
    console.error(e);
    throw new Error(e.message);
  }
}
