import { ethers } from 'ethers';

// ==========================================
// ⚠️ ВСТАВЬ СЮДА АДРЕСА НОВЫХ КОНТРАКТОВ ⚠️
// ==========================================
export const GAME_CONTRACT = '0x19e7c24779A582890bFD2A586eDa216F8b66548e'; 
export const BET_CONTRACT = '0x05037abC72DD95DfBd9984337B2008211FCDA3CF';
export const BASE_CHAIN_ID = '0x2105'; 

// Селекторы Дерева
const SELECTORS = {
  balanceOf: '0x70a08231',
  mintTree: '0x61c05ab6',
  waterTree: '0x998b723b',
  getTreeLevel: '0x2bce3fbe',
  trees: '0x7a508022',
  enterRaffle: '0x2e519f90',
  getFirstTreeId: '0x6465b6f6',
  prizePool: '0x719ce73e'
};

// --- Селекторы Тотализатора (Генерируются динамически!) ---
const BET_SELECTORS = {
  placeBet: ethers.id("placeBet(uint8)").substring(0, 10),
  claimReward: ethers.id("claimReward()").substring(0, 10),
  checkStatus: ethers.id("checkStatus(address)").substring(0, 10)
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

// --- ФУНКЦИИ ДЕРЕВА ---

export const getTreeBalance = async (address: string): Promise<number> => {
  const data = SELECTORS.balanceOf + address.substring(2).padStart(64, '0');
  const result = await readContract(GAME_CONTRACT, data);
  return parseInt(result, 16);
};

export const getUserTreeId = async (address: string): Promise<number | null> => {
  try {
    const data = SELECTORS.getFirstTreeId + address.substring(2).padStart(64, '0');
    const result = await readContract(GAME_CONTRACT, data);
    const id = parseInt(result, 16);
    if (id === 999999 || isNaN(id)) return null; // Защита, если дерева нет
    return id;
  } catch {
    return null;
  }
};

export const getTreeStats = async (tokenId: number) => {
  const dataLevel = SELECTORS.getTreeLevel + tokenId.toString(16).padStart(64, '0');
  const levelHex = await readContract(GAME_CONTRACT, dataLevel);

  const dataTree = SELECTORS.trees + tokenId.toString(16).padStart(64, '0');
  const treeHex = await readContract(GAME_CONTRACT, dataTree);
  
  const cleanHex = treeHex.replace('0x', '');
  const lastWateredHex = cleanHex.substring(0, 64);
  const lastWatered = parseInt(lastWateredHex, 16);
  const wateringsTodayHex = cleanHex.substring(192, 256); // 4-й параметр в структуре
  const wateringsToday = parseInt(wateringsTodayHex, 16);

  // Логика времени по UTC
  const now = Math.floor(Date.now() / 1000);
  const currentDay = Math.floor(now / 86400);
  const lastWateredDay = Math.floor(lastWatered / 86400);

  const isWatered = lastWateredDay === currentDay;

  return {
    isWatered,
    wateringsToday,
    level: parseInt(levelHex, 16),
    lastWateredAt: lastWatered
  };
};

export const getBankBalance = async (): Promise<string> => {
  const resultHex = await readContract(GAME_CONTRACT, SELECTORS.prizePool);
  if (resultHex === '0x') return '0.0000';
  const eth = parseInt(resultHex, 16) / 1e18;
  return eth.toFixed(5);
};

export const mintTree = async (from: string) => {
  const provider = getProvider();
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: GAME_CONTRACT, data: SELECTORS.mintTree }]
  });
};

export const waterTree = async (from: string, tokenId: number, isRain: boolean = false) => {
  const provider = getProvider();
  const data = SELECTORS.waterTree + tokenId.toString(16).padStart(64, '0');
  
  // Идеально точная сумма 0.000054 ETH (чтобы не было багов с wei)
  const valueHex = isRain ? '0x0' : '0x311CDAD16000'; 
  
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: GAME_CONTRACT, data, value: valueHex }]
  });
};

export const enterRaffle = async (from: string, tokenId: number) => {
  const provider = getProvider();
  const data = SELECTORS.enterRaffle + tokenId.toString(16).padStart(64, '0');
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: GAME_CONTRACT, data }]
  });
};


// --- ФУНКЦИИ ТОТАЛИЗАТОРА ---

export const checkBetStatus = async (address: string) => {
  try {
    const data = BET_SELECTORS.checkStatus + address.substring(2).padStart(64, '0');
    const result = await readContract(BET_CONTRACT, data);

    const cleanStr = result.replace('0x', '');
    const statusHex = cleanStr.substring(0, 64);
    const amountHex = cleanStr.substring(64, 128);

    return {
      status: parseInt(statusHex, 16),
      amount: parseInt(amountHex, 16) / 1e18
    };
  } catch (error) {
    return { status: 0, amount: 0 };
  }
};

export const placeBet = async (from: string, predictedWeather: number, amountEth: string) => {
  const provider = getProvider();
  const data = BET_SELECTORS.placeBet + predictedWeather.toString(16).padStart(64, '0');
  
  // Переводим строку ETH в hex wei (используем ethers)
  const weiAmount = ethers.parseEther(amountEth);
  const valueHex = '0x' + weiAmount.toString(16);

  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: BET_CONTRACT, data, value: valueHex }]
  });
};

export const claimBetReward = async (from: string) => {
  const provider = getProvider();
  return await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, to: BET_CONTRACT, data: BET_SELECTORS.claimReward }]
  });
};
