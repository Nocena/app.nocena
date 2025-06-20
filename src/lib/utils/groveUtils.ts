import { immutable, StorageClient } from '@lens-chain/storage-client';
import { lensTestnet } from 'wagmi/chains';

export const uploadMediaToGrove = async (file: File) => {
  if (!file) {
    throw new Error('File is required');
  }
  const storageClient = StorageClient.create();

  const acl = immutable(lensTestnet.id);

  return await storageClient.uploadFile(file, { acl });
};

export const uploadMetadataToGrove = async (metadata: object) => {
  if (!metadata) {
    throw new Error('Metadata is required');
  }
  const storageClient = StorageClient.create();

  const acl = immutable(lensTestnet.id);

  return await storageClient.uploadAsJson(metadata, { acl });
};
