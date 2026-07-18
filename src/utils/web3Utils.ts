// src/utils/web3Utils.ts

export const TREE_CONTRACT = '0x53E0881E01100C21D3E7990BaA45E5A24B195FA3';
export const BANK_CONTRACT = '0xADB2c80c3f3aF788Ea379787F25ac5996c0A9660';
export const BASE_CHAIN_ID = '0x2105'; // 8453 в hex

// Селекторы функций (первые 4 байта keccak256 от названия функции)
// Важно: замени кастомные селекторы на реальные из твоего смарт-контракта, если они отличаются!
const SELECTORS = {
  balanceOf: '0x70a08231',       // balanceOf(address)
  mintTree: '0x2a3e0fae',        // mintTree()
  waterTree: '0x6a1f26ee',       // waterTree(uint256)
  getTreeLevel: '0x15312389',    // getTreeLevel(uint256)
  trees: '0x9bf4e488',           // trees(uint256)
  enterRaffle: '0x7a2dcefb',     // enterRaffle(uint256)
  getFirstTreeId: '0x05a0d33c',  // getFirstTreeId(address)
};

export const getProvider = () => {
  if (window.ethereum) return window.ethereum;
  throw new Error("Кошелек не найден. Установите MetaMask или Rabby.");
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
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org']
        }]
      });
    } else {
      throw error;
    }
  }
};

// Универсальный метод для eth_call
const readContract = async (to: string, data: string) => {
  const provider = getProvider();
  return await provider.request({
    method: 'eth_call',
    params: [{ to, data }, 'latest']
  });
};

export const getTreeBalance = async (address: string): Promise<number> => {
  // Кодируем: селектор + паддинг адреса до 32 байт
  const data = SELECTORS.balanceOf + address.substring(2).padStart(64, '0');
  const result = await readContract(TREE_CONTRACT, data);
  return parseInt(result, 16);
};

export const getTreeStats = async () => {
  // Если контракту для этих методов нужен токен ID, 
  // добавь паддинг ID аналогично адресу. Здесь вызов без аргументов.
  const isWateredHex = await readContract(TREE_CONTRACT, SELECTORS.isWatered);
  const levelHex = await readContract(TREE_CONTRACT, SELECTORS.level);
  
  return {
    isWatered: parseInt(isWateredHex, 16) === 1,
    level: parseInt(levelHex, 16)
  };
};

export const getBankBalance = async (): Promise<string> => {
  const provider = getProvider();
  const balanceHex = await provider.request({
    method: 'eth_getBalance',
    params: [BANK_CONTRACT, 'latest']
  });
  // Конвертация wei в ETH
  const eth = parseInt(balanceHex, 16) / 1e18;
  return eth.toFixed(4);
};

export const fetchWinner = async (): Promise<string> => {
  const result = await readContract(BANK_CONTRACT, SELECTORS.getWinner);
  // Возвращаем как 0x + последние 40 символов
  return '0x' + result.substring(result.length - 40);
};

// Запись транзакций (eth_sendTransaction)
export const waterTree = async (from: string) => {
  const provider = getProvider();
  // 0.000054 ETH = 54,000,000,000,000 wei = 0x311CA9417800
  const valueHex = '0x311CA9417800'; 
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: BANK_CONTRACT,
      value: valueHex
      // data: '0x...' если у банка есть функция receive()
    }]
  });
};

export const mintTree = async (from: string) => {
  const provider = getProvider();
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: TREE_CONTRACT,
      data: SELECTORS.mint
    }]
  });
};

export const claimRafflePrize = async (from: string) => {
  const provider = getProvider();
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: BANK_CONTRACT,
      data: SELECTORS.claimPrize
    }]
  });
};
