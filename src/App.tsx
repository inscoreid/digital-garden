import { useState, useEffect } from 'react';
import { Welcome } from './components/Welcome';
import { TreeGame } from './components/TreeGame';
import { BankPanel } from './components/BankPanel';
import { getProvider, switchNetwork, BASE_CHAIN_ID, getTreeBalance } from './utils/web3Utils';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [hasTree, setHasTree] = useState(false);

  const checkState = async (addr: string) => {
    const provider = getProvider();
    const chainId = await provider.request({ method: 'eth_chainId' });
    
    if (chainId !== BASE_CHAIN_ID) {
      setWrongNetwork(true);
      return;
    }
    setWrongNetwork(false);

    try {
      const balance = await getTreeBalance(addr);
      setHasTree(balance > 0);
    } catch (e) {
      console.error("Ошибка получения NFT", e);
    }
  };

  const connectWallet = async () => {
    try {
      const provider = getProvider();
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await switchNetwork();
      await checkState(accounts[0]);
    } catch (error) {
      console.error("Ошибка подключения:", error);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          checkState(accounts[0]);
        } else {
          setAccount(null);
        }
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  return (
    <div>
      <h1>Base Pixel Tree 🌳</h1>
      
      {!account ? (
        <>
          <Welcome />
          <button className="pixel-btn" onClick={connectWallet} style={{ fontSize: '18px', padding: '20px' }}>
            Подключить кошелек
          </button>
        </>
      ) : wrongNetwork ? (
        <div className="panel" style={{ borderColor: '#ef4444' }}>
          <h2 style={{ color: '#ef4444' }}>Неверная сеть</h2>
          <p>Пожалуйста, переключитесь на сеть Base Mainnet.</p>
          <button className="pixel-btn" onClick={switchNetwork}>Переключить сеть</button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '12px', color: '#888' }}>
            Кошелек: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
          <TreeGame account={account} hasTree={hasTree} onUpdate={() => checkState(account)} />
          <BankPanel account={account} />
        </>
      )}
    </div>
  );
}

export default App;