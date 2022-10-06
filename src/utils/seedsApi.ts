import { isValidChecksumAddress } from 'ethereumjs-util'
import { Request, Response, NextFunction } from 'express'
import Web3 from 'web3';

import db from '../db/sql-db'

export const connectDB = async () => { return db.init(); }

export const authMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {

  try {
    let signer;

    const auth = {
      message: request?.body?.msg,
      signature: request?.body?.sig,
      signer: request?.body?.address,
    }

    try {
      signer = validateSignature(auth, permittedAdminAddresses());
    } catch (e) {
      throw e;
    }

    next();
  } catch (e) {
    response.status(403).send('Authentication failed');
    return;
  }
};

export function validateSignature(signatureData: {
  message: string;
  signature: string;
  signer: string;
}, permittedAddresses: string[]): string {
  let signer: string;
  try {
    const web3 = new Web3();
    signer = web3.eth.accounts.recover( // TODO: check why this isn't erroring out with a blank signatureData.signature
      signatureData.message,
      signatureData.signature,
    );
  } catch (e) {
    console.error('Error verifying signature', e);
    throw 'Error verifying signature';
  }

  if (
    !signatureData.signature
  ) {
    console.error('No signature provided');
    throw 'No signature provided';
  }

  if (
    !isValidChecksumAddress(signer) ||
    !permittedAddresses.includes(signer.toLowerCase())
  ) {
    console.error('Invalid signer address: ', signer);
    throw 'Invalid signer address';
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
