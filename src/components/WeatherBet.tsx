import { useState } from 'react';

export const WeatherBet = ({ account }: { account: string }) => {
  const [selectedWeather, setSelectedWeather] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>('0.0001');
  const [loading, setLoading] = useState(false);

  const weathers = [
    { id: 'rain', name: 'Дождь 🌧️', chance: '20%', color: '#3b82f6' },
    { id: 'drought', name: 'Засуха ☀️', chance: '20%', color: '#eab308' },
    { id: 'pests', name: 'Вредители 🐛', chance: '20%', color: '#ef4444' },
    { id: 'normal', name: 'Норма 🌲', chance: '40%', color: '#4ade80' }
  ];

  const handleBet = async () => {
    if (!selectedWeather) return alert("Выбери погоду!");
    if (!account) return alert("Подключи кошелек!");
    
    setLoading(true);
    try {
      // Здесь позже будет вызов смарт-контракта
      // await placeWeatherBet(account, selectedWeather, betAmount);
      
      // Имитация транзакции
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Ставка ${betAmount} ETH на ${selectedWeather} успешно принята! Жди завтрашнего дня.`);
    } catch (e) {
      console.error(e);
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
        <p style={{ fontSize: '1.5rem', margin: 0 }}>0.0450 ETH</p>
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
