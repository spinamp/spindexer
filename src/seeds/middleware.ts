import { isValidChecksumAddress } from 'ethereumjs-util'
import { Response, NextFunction } from 'express'
import Web3 from 'web3';

import { AuthRequest } from './types';

export const authMiddleware = (
  request: AuthRequest,
  response: Response,
  next: NextFunction,
) => {
  // skip preflight requests
  if (request.method === 'OPTIONS') { next(); return; }

  try {
    const auth = {
      message: JSON.stringify(request.body),
      signature: request.header('x-signature') || '',
    }

    try {
      request.signer = validateSignature(auth, permittedAdminAddresses());
    } catch (e) {
      throw e;
    }

    next();
  } catch (e) {
    response.status(403).send('Authentication failed');
    return;
  }
};

const validateSignature = (signatureData: {
  message: string;
  signature: string;
}, permittedAddresses: string[]): string => {
  let signer: string;

  try {
    const web3 = new Web3();
    signer = web3.eth.accounts.recover(
      signatureData.message,
      signatureData.signature,
    );
  } catch (e) {
    throw `Error verifying signature: ${e}`;
  }

  if (
    !isValidChecksumAddress(signer) ||
    !permittedAddresses.includes(signer.toLowerCase())
  ) {
    throw `Invalid signer address: ${signer}`;
  }

  return signer;
}

const permittedAdminAddresses = (): string[] => {
  const addresses = process.env.PERMITTED_ADMIN_ADDRESSES?.toLowerCase();
  if (!addresses) {
    throw new Error('PERMITTED_ADMIN_ADDRESSES not set');
  }
  return addresses.split(',');
}
