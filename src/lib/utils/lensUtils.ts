import { APP_ADDRESS, lensPublicClient } from '../constants';
import { AccountStatusType, AccountType } from '../types';
import {
  fetchAccount,
  fetchAccountRecommendations,
  fetchAccountsAvailable,
  fetchAccountStats,
  fetchFollowers,
  fetchFollowing,
  lastLoggedInAccount,
} from '@lens-protocol/client/actions';
import { SessionClient } from '@lens-protocol/client';

const getAccountDataByRaw = (rawData: any): AccountType => {
  return {
    accountAddress: rawData.address,
    createdAt: rawData.createdAt,
    avatar: rawData.metadata?.picture ?? '',
    displayName: rawData.metadata?.name ?? '',
    localName: rawData.username?.localName ?? '',
    bio: rawData.metadata?.bio ?? '',
    isFollowedByMe: rawData.operations?.isFollowedByMe ?? false,
  };
};

export const fetchAvailableLensAccounts = async (
  sessionClient: SessionClient | null,
  walletAddress: string,
): Promise<AccountType[]> => {
  if (!walletAddress) {
    return [];
  }
  const result = await fetchAccountsAvailable(sessionClient ?? sessionClient ?? lensPublicClient, {
    managedBy: walletAddress,
    includeOwned: true,
  });

  if (result.isErr()) {
    console.error(result.error);
    return [];
  }

  return result.value.items.map((item) => {
    return getAccountDataByRaw(item.account);
  });
};

export const fetchRecommendedAccounts = async (
  sessionClient: SessionClient | null,
  accountAddress: string,
): Promise<AccountType[]> => {
  if (!accountAddress) {
    return [];
  }
  const result = await fetchAccountRecommendations(sessionClient ?? lensPublicClient, {
    account: accountAddress,
    shuffle: true,
  });

  if (result.isErr()) {
    console.error(result.error);
    return [];
  }

  const value = result.value;
  if (!value) return [];

  return value.items.slice(0, 5).map((item) => {
    return getAccountDataByRaw(item);
  });
};

export const fetchAccountByUserName = async (
  sessionClient: SessionClient | null,
  userName: string,
): Promise<AccountType | null> => {
  if (!userName) {
    return null;
  }
  const result = await fetchAccount(sessionClient ?? lensPublicClient, {
    username: {
      localName: userName,
    },
  });

  if (result.isErr()) {
    console.error(result.error);
    return null;
  }

  const item = result.value;
  if (!item) return null;

  return getAccountDataByRaw(item);
};

export const getLastLoggedInAccount = async (
  sessionClient: SessionClient | null,
  walletAddress: string,
): Promise<AccountType | null> => {
  if (!walletAddress) {
    return null;
  }

  try {
    const result = await lastLoggedInAccount(sessionClient ?? lensPublicClient, {
      app: APP_ADDRESS,
      address: walletAddress,
    });

    if (result.isErr()) {
      console.error(result.error);
      return null;
    }

    const item = result.value;
    if (!item) return null;

    return getAccountDataByRaw(item);
  } catch (e) {
    console.log('error getLastLoggedInAccount', e);
    return null;
  }
};

export const getAccountStats = async (
  sessionClient: SessionClient | null,
  accountAddress: string,
): Promise<AccountStatusType | null> => {
  if (!accountAddress) {
    return null;
  }

  try {
    const result = await fetchAccountStats(sessionClient ?? lensPublicClient, {
      account: accountAddress,
    });

    if (result.isErr()) {
      console.error(result.error);
      return null;
    }

    const item = result.value;
    if (!item) return null;

    return {
      followers: item!.graphFollowStats.followers,
      following: item!.graphFollowStats.following,
      posts: item!.feedStats.posts,
      comments: item!.feedStats.comments,
      reposts: item!.feedStats.reposts,
      quotes: item!.feedStats.quotes,
      reacted: item!.feedStats.reacted,
      reactions: item!.feedStats.reactions,
      collects: item!.feedStats.collects,
    };
  } catch (e) {
    console.log('error getAccountStats', e);
    return null;
  }
};

export const getAccountFollowers = async (
  sessionClient: SessionClient | null,
  accountAddress: string,
): Promise<AccountType[]> => {
  if (!accountAddress) {
    return [];
  }

  try {
    const result = await fetchFollowers(sessionClient ?? lensPublicClient, {
      account: accountAddress,
    });

    if (result.isErr()) {
      console.error(result.error);
      return [];
    }

    const items = result.value.items;
    if (!items) return [];

    return items.map((item) => {
      return getAccountDataByRaw(item.follower);
    });
  } catch (e) {
    console.log('error getAccountFollowers', e);
    return [];
  }
};

export const getAccountFollowings = async (
  sessionClient: SessionClient | null,
  accountAddress: string,
): Promise<AccountType[]> => {
  if (!accountAddress) {
    return [];
  }

  try {
    const result = await fetchFollowing(sessionClient ?? lensPublicClient, {
      account: accountAddress,
    });

    if (result.isErr()) {
      console.error(result.error);
      return [];
    }

    const items = result.value.items;
    if (!items) return [];

    return items.map((item) => {
      return getAccountDataByRaw(item.following);
    });
  } catch (e) {
    console.log('error getAccountFollowers', e);
    return [];
  }
};
