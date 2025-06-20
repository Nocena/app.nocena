import { WagmiProvider, createConfig, http } from 'wagmi';
import { lensTestnet, mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { WALLETCONNECT_PROJECT_ID } from '../lib/constants';

export const walletConfig = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet, lensTestnet],
    transports: {
      [lensTestnet.id]: http(lensTestnet.rpcUrls.default.http[0]),
      [mainnet.id]: http(mainnet.rpcUrls.default.http[0]),
    },
    // Required API Keys
    walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
    // Required App Info
    appName: 'Nocena',
    // Optional App Info
    appDescription: 'Challenge To Earn',
    appUrl: 'https://family.co', // your app's url
    appIcon: 'https://family.co/logo.png', // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
);

const queryClient = new QueryClient();
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={walletConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          customTheme={{
            '--ck-connectbutton-color': 'white',
            '--ck-connectbutton-background': '#ca1cf1',
            '--ck-connectbutton-hover-background': '#dd5bff',
            '--ck-connectbutton-active-background': '#e607d1',
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
