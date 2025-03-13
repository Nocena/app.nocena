import { ethers } from 'ethers';

export const createPolygonWallet = () => {
  const wallet = ethers.Wallet.createRandom();

  if (!wallet.mnemonic) {
    throw new Error('Failed to generate mnemonic for the wallet');
  }

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  };
};