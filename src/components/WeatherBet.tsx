import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ТВОЙ НОВЫЙ СМАРТ-КОНТРАКТ В СЕТИ BASE
const WEATHER_CONTRACT = "0xD5faA5C8fa8B4ffAA21769619AC7ffDb7166F1a3";

// ABI — это "инструкция" для сайта, какие функции есть в смарт-контракте
const WEATHER_ABI = [
  "function globalPool() view returns (uint256)",
  "function placeBet(uint8 _weatherType) payable"
];

export const WeatherBet = ({ account }: { account: string }) => {
  const [selectedWeather, setSelectedWeather] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>('0.0001');
  const [poolAmount, setPoolAmount] = useState<string>('0.0000');
  const [loading, setLoading] = useState(false);

  const weathers = [
    { id: 'rain', name: 'Дождь 🌧️', chance: '20%', color: '#3b82f6', value: 0 },
    { id: 'drought', name: 'Засуха ☀️', chance: '20%', color: '#eab308', value: 1 },
    { id: 'pests', name: 'Вредители 🐛', chance: '20%', color: '#ef4444', value: 2 },
    { id: 'normal', name: 'Норма 🌲', chance: '40%', color: '#4ade80', value: 3 }
  ];

  // Функция для чтения баланса пула из блокчейна
  const fetchPool = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(WEATHER_CONTRACT, WEATHER_ABI, provider);
      
      const pool = await contract.globalPool();
      
      // Конвертируем из длинного формата Wei в нормальный Ether (и оставляем 4 знака)
      const formattedPool = parseFloat(ethers.formatEther(pool)).toFixed(4);
      setPoolAmount(formattedPool);
    } catch (e) {
      console.error("Ошибка загрузки пула:", e);
    }
  };

  // Загружаем пул при старте и обновляем каждые 10 секунд
  useEffect(() => {
    fetchPool();
    const interval = setInterval(fetchPool, 10000);
    return () => clearInterval(interval);
  }, [account]);

  // Отправка ставки
  const handleBet = async () => {
    if (!selectedWeather) return alert("Выбери погоду!");
    if (!account) return alert("Подключи кошелек!");
    if (!window.ethereum) return;

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(WEATHER_CONTRACT, WEATHER_ABI, signer);

      const selectedObj = weathers.find(w => w.id === selectedWeather);

      // Вызываем placeBet в контракте, прикрепляя ETH к транзакции
      const tx = await contract.placeBet(selectedObj?.value, {
        value: ethers.parseEther(betAmount)
      });

      alert(`Транзакция отправлена! Ждем подтверждения сети Base...`);
      await tx.wait(); // Ждем, пока блок запишется

      alert(`Успех! Твоя ставка на ${selectedObj?.name} принята. Удачи завтра 🔮`);
      fetchPool(); // Сразу обновляем цифру пула на экране
      
    } catch (e: any) {
      console.error(e);
      alert("Ошибка: " + (e.reason || "Возможно, ставка на завтра уже сделана или недостаточно средств."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ position: 'relative', overflow: 'hidden' }}>
      <h2>Метео-Тотализатор 🔮</h2>
      <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
        Угадай свою погоду на <strong>ЗАВТРА</strong>. <br/>
        Угадаешь — заберешь долю из пула проигравших!
      </p>

      {/* Банк Раффла / Пул */}
      <div style={{ 
        border: '2px solid #eab308', 
        padding: '15px', 
        margin: '20px auto', 
        width: '80%',
        backgroundColor: 'rgba(0,0,0,0.5)' 
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#eab308' }}>ГЛОБАЛЬНЫЙ ПУЛ</h3>
        <p style={{ fontSize: '1.5rem', margin: 0 }}>{poolAmount} ETH</p>
      </div>

      {/* Выбор погоды */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {weathers.map(w => (
          <div 
            key={w.id}
            onClick={() => setSelectedWeather(w.id)}
            style={{
              border: `2px solid ${selectedWeather === w.id ? w.color : '#374151'}`,
              backgroundColor: selectedWeather === w.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              padding: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{w.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Шанс: {w.chance}</div>
          </div>
        ))}
      </div>

      {/* Ввод суммы */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', color: '#9ca3af' }}>Ставка (ETH):</label>
        <input 
          type="number" 
          step="0.0001"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          style={{
            background: '#111827',
            border: '2px solid #374151',
            color: 'white',
            padding: '10px',
            width: '100px',
            textAlign: 'center',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <button 
        className="pixel-btn" 
        onClick={handleBet} 
        disabled={loading || !selectedWeather}
        style={{ 
          backgroundColor: selectedWeather ? '#a855f7' : '#374151',
          opacity: selectedWeather ? 1 : 0.5
        }}
      >
        {loading ? 'Транзакция...' : 'Сделать ставку'}
      </button>
    </div>
  );
};
