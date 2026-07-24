import React, { useState, useEffect } from 'react';
import { checkBetStatus, placeBet, claimBetReward } from '../utils/web3Utils';

interface WeatherBetProps {
  account: string;
}

export const WeatherBet: React.FC<WeatherBetProps> = ({ account }) => {
  const [betStatus, setBetStatus] = useState<number>(0);
  const [winAmount, setWinAmount] = useState<number>(0);
  
  const [betAmount, setBetAmount] = useState<string>('0.001');
  const [selectedWeather, setSelectedWeather] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Загружаем статус ставки при открытии вкладки
  useEffect(() => {
    if (account) {
      loadStatus();
    }
  }, [account]);

  const loadStatus = async () => {
    const res = await checkBetStatus(account);
    setBetStatus(res.status);
    setWinAmount(res.amount);
  };

  const handlePlaceBet = async () => {
    if (!account) return alert('Подключите кошелек!');
    if (parseFloat(betAmount) <= 0) return alert('Сумма должна быть больше нуля');
    
    setIsLoading(true);
    try {
      await placeBet(account, selectedWeather, betAmount);
      alert('Ставка успешно принята! Ждем наступления 00:00 UTC.');
      loadStatus(); // Обновляем статус после ставки
    } catch (error: any) {
      console.error(error);
      alert('Ошибка при отправке ставки');
    }
    setIsLoading(false);
  };

  const handleClaim = async () => {
    setIsLoading(true);
    try {
      await claimBetReward(account);
      alert('Выигрыш успешно зачислен на ваш кошелек!');
      loadStatus(); // Обновит статус на "забрано" (4)
    } catch (error: any) {
      console.error(error);
      alert('Ошибка при получении выигрыша');
    }
    setIsLoading(false);
  };

  const weatherOptions = [
    { id: 0, name: 'Дождь 🌧️' },
    { id: 1, name: 'Засуха ☀️' },
    { id: 2, name: 'Вредители 🐛' },
    { id: 3, name: 'Норма 🌤️' }
  ];

  return (
    <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
      <h2 style={{ color: '#c084fc', marginBottom: '20px' }}>МЕТЕО-ТОТАЛИЗАТОР</h2>
      
      {/* --- БЛОК СТАТУСА --- */}
      <div style={{ marginBottom: '30px', padding: '15px', background: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
        {betStatus === 0 && <p style={{ color: '#9ca3af', margin: 0 }}>У вас нет активных ставок на завтра.</p>}
        
        {betStatus === 1 && <p style={{ color: '#fcd34d', margin: 0 }}>⏳ Ваша ставка принята! Ждем 00:00 UTC для результата.</p>}
        
        {betStatus === 2 && (
          <div style={{ color: '#4ade80' }}>
            <p style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>🎉 ПОБЕДА! Вы угадали погоду!</p>
            <p style={{ margin: '0 0 15px 0' }}>Ваш выигрыш: <strong>{winAmount} ETH</strong></p>
            <button 
              onClick={handleClaim}
              disabled={isLoading}
              style={{ background: '#22c55e', color: '#fff', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}
            >
              {isLoading ? 'ОБРАБОТКА...' : 'ЗАБРАТЬ ВЫИГРЫШ'}
            </button>
          </div>
        )}
        
        {betStatus === 3 && <p style={{ color: '#ef4444', margin: 0 }}>😢 Ставка ({winAmount} ETH) не сыграла. Вы не угадали погоду.</p>}
        
        {betStatus === 4 && <p style={{ color: '#9ca3af', margin: 0 }}>✅ Выигрыш ({winAmount} ETH) уже отправлен на ваш кошелек.</p>}
      </div>

      {/* --- БЛОК НОВОЙ СТАВКИ --- */}
      {/* Скрываем форму ставки, если юзер уже поставил (статус 1) или если еще не забрал выигрыш (статус 2) */}
      {(betStatus === 0 || betStatus === 3 || betStatus === 4) && (
        <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '2px solid #374151' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#e5e7eb' }}>Сделать ставку на ЗАВТРА</h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
            {weatherOptions.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWeather(w.id)}
                style={{
                  padding: '10px 15px',
                  background: selectedWeather === w.id ? '#8b5cf6' : '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background 0.2s'
                }}
              >
                {w.name}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '10px', color: '#9ca3af' }}>Ставка (ETH):</p>
            <input 
              type="number" 
              step="0.0001"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              style={{
                background: '#1f2937',
                border: '2px solid #4b5563',
                color: 'white',
                padding: '15px',
                width: '200px',
                fontSize: '1.5rem',
                textAlign: 'center',
                fontFamily: 'inherit',
                outline: 'none',
                borderRadius: '5px'
              }}
            />
          </div>

          <button
            onClick={handlePlaceBet}
            disabled={isLoading}
            style={{
              background: isLoading ? '#6b7280' : '#a855f7',
              color: 'white',
              padding: '15px 30px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              width: '100%',
              fontFamily: 'inherit'
            }}
          >
            {isLoading ? 'ТРАНЗАКЦИЯ...' : 'СДЕЛАТЬ СТАВКУ'}
          </button>
        </div>
      )}
    </div>
  );
};
