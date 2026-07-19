import { useState, useEffect } from 'react';
import { Welcome } from './components/Welcome';
import { TreeGame } from './components/TreeGame';
import { BankPanel } from './components/BankPanel';
import { WeatherBet } from './components/WeatherBet'; // Импортируем новый компонент
import { getProvider, switchNetwork, BASE_CHAIN_ID, getTreeBalance } from './utils/web3Utils';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [hasTree, setHasTree] = useState(false);
  
  // Состояние для отображения правил
  const [showRules, setShowRules] = useState(true);
  
  // Новое состояние для переключения вкладок
  const [activeTab, setActiveTab] = useState<'tree' | 'bet'>('tree');

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
      if (balance > 0) setShowRules(false); 
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
          setShowRules(true);
        }
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }, []);

  return (
    <div>
      {/* Шапка сайта */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', textAlign: 'left' }}>Base Pixel Tree 🌳</h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="pixel-btn" 
            style={{ padding: '10px', fontSize: '10px', backgroundColor: '#3b82f6', color: '#fff' }} 
            onClick={() => setShowRules(!showRules)}
          >
            📖 Правила
          </button>
          
          <a 
            href="https://x.com/IncoreID" 
            target="_blank" 
            rel="noreferrer" 
            className="pixel-btn" 
            style={{ padding: '10px', fontSize: '10px', textDecoration: 'none', backgroundColor: '#000', color: '#fff', borderColor: '#333' }}
          >
            X (Twitter)
          </a>
        </div>
      </header>
      
      {/* Отображение правил */}
      {showRules && (
        <div style={{ marginBottom: '30px' }}>
          <Welcome onClose={() => setShowRules(false)} />
        </div>
      )}

      {/* Основная логика */}
      {!account ? (
        <div style={{ marginTop: '20px' }}>
          <button className="pixel-btn" onClick={connectWallet} style={{ fontSize: '18px', padding: '20px', width: '100%' }}>
            Подключить кошелек
          </button>
        </div>
      ) : wrongNetwork ? (
        <div className="panel" style={{ borderColor: '#ef4444' }}>
          <h2 style={{ color: '#ef4444' }}>Неверная сеть</h2>
          <p>Пожалуйста, переключитесь на сеть Base Mainnet.</p>
          <button className="pixel-btn" onClick={switchNetwork}>Переключить сеть</button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '12px', color: '#888', textAlign: 'right' }}>
            Кошелек: {account.slice(0, 6)}...{account.slice(-4)}
          </p>

          {/* МЕНЮ ВКЛАДОК */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0' }}>
            <button 
              className="pixel-btn" 
              onClick={() => setActiveTab('tree')}
              style={{ 
                backgroundColor: activeTab === 'tree' ? '#4ade80' : '#374151',
                padding: '10px 20px'
              }}
            >
              Мое Дерево 🌲
            </button>
            <button 
              className="pixel-btn" 
              onClick={() => setActiveTab('bet')}
              style={{ 
                backgroundColor: activeTab === 'bet' ? '#a855f7' : '#374151',
                padding: '10px 20px'
              }}
            >
              Тотализатор 🔮
            </button>
          </div>

          {/* ЛОГИКА ОТОБРАЖЕНИЯ ВКЛАДОК */}
          {activeTab === 'tree' ? (
            <>
              <TreeGame account={account} hasTree={hasTree} onUpdate={() => checkState(account)} />
              <BankPanel account={account} />
            </>
          ) : (
            <WeatherBet account={account} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
