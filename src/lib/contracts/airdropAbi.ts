export const AIRDROP_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_nocenite',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_nocenix',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'initialOwner',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'weekNumber',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'totalAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'recipientCount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'executor',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'executorReward',
        type: 'uint256',
      },
    ],
    name: 'AirdropExecuted',
    type: 'event',
  },
  {
    inputs: [],
    name: 'EXECUTOR_REWARD_PERCENTAGE',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'WEEK_DURATION',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'YEAR_DURATION',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'deploymentTime',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'recipients',
        type: 'address[]',
      },
    ],
    name: 'executeWeeklyAirdrop',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAirdropInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'currentWeek',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'currentYear',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'weeklyReward',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'weekExecuted',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'totalExecuted',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentWeek',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentYear',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getExecutorReward',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getWeeklyRewardAmount',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAirdropsExecuted',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'weeklyAirdropExecuted',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
