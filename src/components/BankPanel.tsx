import { useState, useEffect } from 'react';
import { getBankBalance, enterRaffle, getUserTreeId } from '../utils/web3Utils';

export const BankPanel = ({ account }: { account: string }) => {
  const [balance, setBalance] = useState('0.0000');
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBank = async () => {
      try {
        setBalance(await getBankBalance());
      } catch (e) {
        console.error("Ошибка чтения банка", e);
      }
    };
    loadBank();

    const interval = setInterval(() => {
      const now = new Date();
      const nextSunday = new Date();
      nextSunday.setUTCHours(0, 0, 0, 0);
      nextSunday.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay()) % 7 || 7));
      
      const diff = nextSunday.getTime() - now.getTime();
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      
      setTimeLeft(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEnterRaffle = async () => {
    try {
      setLoading(true);
      const tokenId = await getUserTreeId(account);
      if (tokenId === null) {
        alert("Сначала посадите дерево!");
        return;
      }
      await enterRaffle(account, tokenId);
      alert("Вы участвуете в розыгрыше!");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ borderColor: '#eab308' }}>
      <h2 style={{ color: '#eab308' }}>Банк Раффла</h2>
      <p style={{ fontSize: '1.5rem' }}>{balance} ETH</p>
      <p>До розыгрыша: <strong>{timeLeft}</strong></p>
      
      <div style={{ marginTop: '20px' }}>
        <button className="pixel-btn" onClick={handleEnterRaffle} disabled={loading} style={{ backgroundColor: '#eab308' }}>
          {loading ? 'Ожидание...' : 'Участвовать (0.001 ETH)'}
        </button>
      </div>
    </div>
  );
};
