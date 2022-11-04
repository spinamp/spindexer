import { isValidChecksumAddress } from 'ethereumjs-util';

import { EthereumAddress } from '../types/ethereum';

import { MessagePayload, PublicOperations } from './types';

export const restrictAccess = (payload: MessagePayload, signer?: EthereumAddress) => {
  if (Object.values(PublicOperations).includes(payload.operation as any)) {
    return;
  }
  onlyAdmin(signer);
}

const onlyAdmin = (signer: string | undefined): void => {
  if (!signer || !isValidChecksumAddress(signer) || !permittedAdminAddresses().includes(signer.toLowerCase())
  ) {
    throw `Invalid admin address: ${signer}`;
  }
}

const permittedAdminAddresses = (): string[] => {
  const addresses = process.env.PERMITTED_ADMIN_ADDRESSES?.toLowerCase();
  if (!addresses) {
    throw new Error('PERMITTED_ADMIN_ADDRESSES not set');
  }
  return addresses.split(',');
}
