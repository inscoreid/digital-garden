// ВСТАВЬ СЮДА АДРЕС НОВОГО ЕДИНОГО КОНТРАКТА
export const GAME_CONTRACT = '0x6CcF55750328a44B5Fa25299Cb2E433EB7bCBBd8'; 
export const BASE_CHAIN_ID = '0x2105'; 

// Точные селекторы из твоего смарт-контракта PixelTreeGame
const SELECTORS = {
  balanceOf: '0x70a08231',       // balanceOf(address)
  mintTree: '0x61c05ab6',        // mintTree()
  waterTree: '0x998b723b',       // waterTree(uint256)
  getTreeLevel: '0x2bce3fbe',    // getTreeLevel(uint256)
  trees: '0x7a508022',           // trees(uint256)
  enterRaffle: '0x2e519f90',     // enterRaffle(uint256)
  getFirstTreeId: '0x6465b6f6',  // getFirstTreeId(address)
  prizePool: '0x719ce73e'        // prizePool()
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

const readContract = async (data: string) => {
  const provider = getProvider();
  return await provider.request({
    method: 'eth_call',
    params: [{ to: GAME_CONTRACT, data }, 'latest']
  });
};

export const getTreeBalance = async (address: string): Promise<number> => {
  const data = SELECTORS.balanceOf + address.substring(2).padStart(64, '0');
  const result = await readContract(data);
  return parseInt(result, 16);
};

export const getUserTreeId = async (address: string): Promise<number | null> => {
  try {
    const data = SELECTORS.getFirstTreeId + address.substring(2).padStart(64, '0');
    const result = await readContract(data);
    if (result === '0x' || result === '0x0') return null;
    return parseInt(result, 16);
  } catch {
    return null;
  }
};

export const getTreeStats = async (tokenId: number) => {
  const dataLevel = SELECTORS.getTreeLevel + tokenId.toString(16).padStart(64, '0');
  const levelHex = await readContract(dataLevel);

  const dataTree = SELECTORS.trees + tokenId.toString(16).padStart(64, '0');
  const treeHex = await readContract(dataTree);
  
  const cleanHex = treeHex.replace('0x', '');
  const lastWateredHex = cleanHex.substring(0, 64);
  const lastWatered = parseInt(lastWateredHex, 16);

  const now = Math.floor(Date.now() / 1000);
  const hoursSinceWatered = (now - lastWatered) / 3600;

  const isWatered = hoursSinceWatered < 24;

  return {
    isWatered,
    level: parseInt(levelHex, 16),
    lastWateredAt: lastWatered
  };
};

export const getBankBalance = async (): Promise<string> => {
  const resultHex = await readContract(SELECTORS.prizePool);
  if (resultHex === '0x') return '0.0000';
  const eth = parseInt(resultHex, 16) / 1e18;
  return eth.toFixed(5);
};

// МИНТ ТЕПЕРЬ БЕСПЛАТНЫЙ
export const mintTree = async (from: string) => {
  const provider = getProvider();
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: GAME_CONTRACT, data: SELECTORS.mintTree }]
  });
};

// ПОЛИВ СТОИТ 0.000054 ETH
export const waterTree = async (from: string, tokenId: number, isRain: boolean = false) => {
  const provider = getProvider();
  const data = SELECTORS.waterTree + tokenId.toString(16).padStart(64, '0');
  const valueHex = isRain ? '0x0' : '0x311CA9417800'; // 0 ETH или 0.000054 ETH
  
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: GAME_CONTRACT, data, value: valueHex }]
  });
};

// РАФФЛ ТЕПЕРЬ БЕСПЛАТНЫЙ
export const enterRaffle = async (from: string, tokenId: number) => {
  const provider = getProvider();
  const data = SELECTORS.enterRaffle + tokenId.toString(16).padStart(64, '0');
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: GAME_CONTRACT, data }]
  });
};
