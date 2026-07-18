export const TREE_CONTRACT = '0x53E0881E01100C21D3E7990BaA45E5A24B195FA3'; // <-- ВСТАВЬ СЮДА
export const BANK_CONTRACT = '0xADB2c80c3f3aF788Ea379787F25ac5996c0A9660';    // <-- ВСТАВЬ СЮДА
export const BASE_CHAIN_ID = '0x2105'; // 8453 в hex

const SELECTORS = {
  balanceOf: '0x70a08231',       
  mintTree: '0x2a3e0fae',        
  waterTree: '0x6a1f26ee',       
  getTreeLevel: '0x15312389',    
  trees: '0x9bf4e488',           
  enterRaffle: '0x7a2dcefb',     
  getFirstTreeId: '0x05a0d33c',  
};

export const getProvider = () => {
  if (window.ethereum) return window.ethereum;
  throw new Error("Кошелек не найден");
};

export const switchNetwork = async () => {
  const provider = getProvider();
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_CHAIN_ID }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: BASE_CHAIN_ID,
          chainName: 'Base',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.base.org']
        }]
      });
    }
  }
};

const readContract = async (to: string, data: string) => {
  const provider = getProvider();
  return await provider.request({
    method: 'eth_call',
    params: [{ to, data }, 'latest']
  });
};

export const getTreeBalance = async (address: string): Promise<number> => {
  const data = SELECTORS.balanceOf + address.substring(2).padStart(64, '0');
  const result = await readContract(TREE_CONTRACT, data);
  return parseInt(result, 16);
};

export const getUserTreeId = async (address: string): Promise<number | null> => {
  try {
    const data = SELECTORS.getFirstTreeId + address.substring(2).padStart(64, '0');
    const result = await readContract(TREE_CONTRACT, data);
    if (result === '0x' || result === '0x0') return null;
    return parseInt(result, 16);
  } catch {
    return null;
  }
};

export const getTreeStats = async (tokenId: number) => {
  const dataLevel = SELECTORS.getTreeLevel + tokenId.toString(16).padStart(64, '0');
  const levelHex = await readContract(TREE_CONTRACT, dataLevel);

  const dataTree = SELECTORS.trees + tokenId.toString(16).padStart(64, '0');
  const treeHex = await readContract(TREE_CONTRACT, dataTree);
  
  const cleanHex = treeHex.replace('0x', '');
  const lastWateredHex = cleanHex.substring(0, 64);
  const lastWatered = parseInt(lastWateredHex, 16);

  const now = Math.floor(Date.now() / 1000);
  const hoursSinceWatered = (now - lastWatered) / 3600;

  // Если прошло меньше 24 часов - дерево считается политым
  const isWatered = hoursSinceWatered < 24;

  return {
    isWatered,
    level: parseInt(levelHex, 16)
  };
};

export const getBankBalance = async (): Promise<string> => {
  const provider = getProvider();
  const balanceHex = await provider.request({
    method: 'eth_getBalance',
    params: [BANK_CONTRACT, 'latest']
  });
  const eth = parseInt(balanceHex, 16) / 1e18;
  return eth.toFixed(4);
};

export const mintTree = async (from: string) => {
  const provider = getProvider();
  const valueHex = '0x11C37937E08000'; // 0.005 ETH
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: TREE_CONTRACT, data: SELECTORS.mintTree, value: valueHex }]
  });
};

export const waterTree = async (from: string, tokenId: number) => {
  const provider = getProvider();
  const data = SELECTORS.waterTree + tokenId.toString(16).padStart(64, '0');
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: TREE_CONTRACT, data }]
  });
};

export const enterRaffle = async (from: string, tokenId: number) => {
  const provider = getProvider();
  const valueHex = '0x38D7EA4C68000'; // 0.001 ETH
  const data = SELECTORS.enterRaffle + tokenId.toString(16).padStart(64, '0');
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: BANK_CONTRACT, data, value: valueHex }]
  });
};
