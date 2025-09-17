#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const BROADCAST_DIR = path.join(__dirname, '../nocena-subscription-service/broadcast/Demo.s.sol/8217/dry-run');
const DEPLOYMENTS_FILE = path.join(__dirname, '../src/lib/kaia/deployments.json');

function getLatestDeployment() {
  try {
    const files = fs.readdirSync(BROADCAST_DIR);
    const runFiles = files.filter(f => f.startsWith('run-') && f.endsWith('.json'));
    
    if (runFiles.length === 0) {
      console.log('No deployment files found');
      return null;
    }

    // Get the latest file (run-latest.json or most recent timestamp)
    const latestFile = runFiles.includes('run-latest.json') 
      ? 'run-latest.json' 
      : runFiles.sort().pop();

    const filePath = path.join(BROADCAST_DIR, latestFile);
    const deploymentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`Reading deployment from: ${latestFile}`);
    return deploymentData;
  } catch (error) {
    console.error('Error reading deployment files:', error.message);
    return null;
  }
}

function extractContractAddresses(deploymentData) {
  const contracts = {};
  const transactions = deploymentData.transactions || [];

  transactions.forEach(tx => {
    if (tx.transactionType === 'CREATE' && tx.contractAddress) {
      const contractName = tx.contractName;
      
      if (contractName === 'Nocenix') {
        contracts.NCXToken = {
          address: tx.contractAddress,
          name: 'Nocenix',
          symbol: 'NCX'
        };
      } else if (contractName === 'Subscription') {
        contracts.Subscription = {
          address: tx.contractAddress
        };
      } else if (contractName === 'CrowdfundingEscrow') {
        contracts.CrowdfundingEscrow = {
          address: tx.contractAddress
        };
      }
    }
  });

  return contracts;
}

function updateDeploymentsFile(contracts) {
  const deploymentConfig = {
    network: 'kaia-mainnet',
    chainId: 8217,
    lastUpdated: new Date().toISOString(),
    contracts,
    external: {
      USDT: '0xd077A400968890Eacc75cdc901F0356c943e4fDb',
      KlaySwapRouter: '0x6C14E2e4bae412137437A8Ec9e57263212d141A0'
    },
    minter: {
      address: '0x0fd8926eedf2d5e19692d18df02a8fbef9dec89a'
    }
  };

  try {
    fs.writeFileSync(DEPLOYMENTS_FILE, JSON.stringify(deploymentConfig, null, 2));
    console.log('Updated deployments.json with latest contract addresses');
    console.log('Contract addresses:');
    Object.entries(contracts).forEach(([name, info]) => {
      console.log(`   ${name}: ${info.address}`);
    });
  } catch (error) {
    console.error('Error writing deployments file:', error.message);
  }
}

function main() {
  console.log('Updating deployment configuration...');
  
  const deploymentData = getLatestDeployment();
  if (!deploymentData) {
    console.log('No deployment data found');
    process.exit(1);
  }

  const contracts = extractContractAddresses(deploymentData);
  if (Object.keys(contracts).length === 0) {
    console.log('No contract addresses found in deployment');
    process.exit(1);
  }

  updateDeploymentsFile(contracts);
  console.log('Deployment configuration updated successfully');
}

if (require.main === module) {
  main();
}

module.exports = { main };
