import { isValidChecksumAddress } from 'ethereumjs-util';

import { DBClient, Table } from '../db/db';
import { EthereumAddress } from '../types/ethereum';

import { MessagePayload } from './types';

enum AccessLevel {
  ADMIN = 'admin',
  OWNER_OR_ADMIN = 'owner_or_admin',
  PUBLIC = 'public',
}

// unless otherwise specified, endpoints are available to admins
const authorizationRules: any = {
  'nftFactories': {
    'contractApproval': AccessLevel.PUBLIC,
  },
  'artists': {
    'update': AccessLevel.OWNER_OR_ADMIN
  }
}

export const restrictAccess = async (payload: MessagePayload, signer: EthereumAddress, dbClient: DBClient) => {
  const { entity, operation } = payload;
  const accessLevel = authorizationRules[entity]?.[operation] || AccessLevel.ADMIN;

  switch (accessLevel) {
    case AccessLevel.PUBLIC:
      break;
    case AccessLevel.OWNER_OR_ADMIN:
      await ownerOrAdmin(payload, signer, dbClient);
      break;
    case AccessLevel.ADMIN:
      onlyAdmin(signer);
      break;
    default:
      onlyAdmin(signer);
  }
}

export const ownerOrAdmin = async (payload: MessagePayload, signer: EthereumAddress, dbClient: DBClient) => {
  if (!signer) {
    throw new Error('must specify a signer');
  }

  if (!notAdminAddress(signer)) {
    const persistedRecords: any = await dbClient.getRecords(payload.entity as Table, [
      ['where', [ 'id', payload.data.id ], ],
    ])
    if (!persistedRecords[0]) {
      // throw new Error(`${payload.entity} with id ${payload.data.id} does not exist`, { cause: 'does not exist' });
      throw new Error('not found');
    }
    return;
  }

  const persistedRecords: any = await dbClient.getRecords(payload.entity as Table, [
    ['where', [ 'id', payload.data.id ], ],
    ['where', [ 'address', payload.data.address ], ],
  ])

  if (!persistedRecords[0] || payload.data?.address !== signer) {
    // throw new Error(`only owner or admin can ${payload.operation} ${payload.entity}`);
    throw new Error('not found');
  }
}

const onlyAdmin = (signer: string | undefined): void => {
  if (notAdminAddress(signer)) {
    throw `Invalid admin address: ${signer}`;
  }
}

const notAdminAddress = (signer: string | undefined): boolean => {
  return (!signer || !isValidChecksumAddress(signer) || !permittedAdminAddresses().includes(signer.toLowerCase()))
}

const permittedAdminAddresses = (): string[] => {
  const addresses = process.env.PERMITTED_ADMIN_ADDRESSES?.toLowerCase();
  if (!addresses) {
    throw new Error('PERMITTED_ADMIN_ADDRESSES not set');
  }
  return addresses.split(',');
}
