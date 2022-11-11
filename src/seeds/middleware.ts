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

    request.signer = validateSignature(auth);
    next();
  } catch (e) {
    response.status(403).send('Authentication failed');
    return;
  }
};

const validateSignature = (signatureData: {
  message: string;
  signature: string;
}): string => {
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

  return signer;
}
