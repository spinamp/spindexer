
import { Table } from '../db/db';
import db from '../db/sql-db'
import { EthereumAddress } from '../types/ethereum';
import { CrdtOperation, getCrdtUpdateMessage, getCrdtUpsertMessage } from '../types/message'

import { getCrdtContractApprovalMessage, MessagePayload, PublicOperations } from './types';
import { validateMessage } from './validation';

export const persistMessage = async (payload: MessagePayload, signer?: EthereumAddress) => {
  if (!signer) {
    throw new Error('must specify a signer');
  }

  const dbClient = await db.init();
  validateMessage(payload);

  const APIOperationMessageFnMap = {
    [CrdtOperation.UPSERT]: getCrdtUpsertMessage,
    [CrdtOperation.UPDATE]: getCrdtUpdateMessage,
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
  } finally {
    await dbClient.close();
  }
}
