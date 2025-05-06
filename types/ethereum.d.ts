interface Window {
  ethereum: {
    isMetaMask?: boolean;
    request: (request: { method: string; params?: any[] }) => Promise<any>;
    on: (eventName: string, callback: (...args: any[]) => void) => void;
    removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
    autoRefreshOnNetworkChange?: boolean;
    chainId?: string;
    networkVersion?: string;
    selectedAddress?: string;
  };
}

interface ErrorWithCode extends Error {
  code: number;
}