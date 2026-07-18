import { useState, useEffect } from 'react';
import { getTreeStats, mintTree, waterTree, getUserTreeId } from '../utils/web3Utils';

export const TreeGame = ({ account, hasTree, onUpdate }: { account: string, hasTree: boolean, onUpdate: () => void }) => {
  const [level, setLevel] = useState<number>(0);
  const [isWatered, setIsWatered] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Новые состояния для интерактива
  const [dailyEvent, setDailyEvent] = useState<'normal' | 'rain' | 'drought' | 'pests'>('normal');
  const [miceCaught, setMiceCaught] = useState(0);
  const [pestRemoved, setPestRemoved] = useState(false);

  // Генерация детерминированного события (одно событие на весь день для конкретного юзера)
  useEffect(() => {
    if (account) {
      const today = new Date().toISOString().split('T')[0];
      const seedString = today + account.toLowerCase();
      
      // Простой алгоритм хеширования строки в число
      let hash = 0;
      for (let i = 0; i < seedString.length; i++) {
        hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
      }
      const rand = Math.abs(hash) % 100;

      if (rand < 20) setDailyEvent('rain');         // 20% шанс дождя
      else if (rand < 40) setDailyEvent('drought'); // 20% шанс засухи
      else if (rand < 60) setDailyEvent('pests');   // 20% шанс вредителей
      else setDailyEvent('normal');                 // 40% обычный день
    }
  }, [account]);

  useEffect(() => {
    if (hasTree) {
      getUserTreeId(account).then(id => {
        setTokenId(id);
        if (id !== null) {
          getTreeStats(id).then(stats => {
            setLevel(stats.level);
            // При засухе дерево сохнет быстрее
            if (dailyEvent === 'drought') {
               // Для MVP просто симулируем это на фронте. В идеале это нужно проверять в контракте.
               setIsWatered(stats.isWatered); 
            } else {
               setIsWatered(stats.isWatered);
            }
          });
        }
      }).catch(console.error);
    }
  }, [hasTree, account, dailyEvent]);

  // Воспроизведение 8-битного звука
  const playTreeSound = () => {
    const audio = new Audio('/click.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {}); // Игнорируем ошибку автоплея браузера
    
    // Небольшая анимация при клике (визуальный фидбек)
    const treeImg = document.getElementById('pixel-tree-img');
    if (treeImg) {
      treeImg.style.transform = 'scale(0.95)';
      setTimeout(() => treeImg.style.transform = 'scale(1)', 100);
    }
  };

  const handleMouseCatch = () => {
    setMiceCaught(prev => prev + 1);
    const audio = new Audio('/click.mp3');
    audio.playbackRate = 2.0; // Делаем звук писклявым
    audio.play().catch(() => {});
  };

  const handleRemovePest = () => {
    // В будущем здесь будет вызов бесплатной транзакции контракта `removePest()`
    setPestRemoved(true);
    alert("Вы прогнали вредителя!");
  };

  const handleMint = async () => {
    try {
      setLoading(true);
      await mintTree(account);
      onUpdate();
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleWater = async () => {
    if (tokenId === null) return;
    try {
      setLoading(true);
      // Если дождь - отправляем 0 ETH (Потребует апдейта смарт-контракта!)
      const isRain = dailyEvent === 'rain';
      await waterTree(account, tokenId, isRain); 
      alert("Дерево полито!");
      onUpdate();
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const getTreeImage = (currentLevel: number) => {
    if (currentLevel === 0) return ''; 
    if (currentLevel === 1) return '/tree-1.png';
    if (currentLevel === 2) return '/tree-2.png';
    if (currentLevel === 3) return '/tree-3.png';
    if (currentLevel === 4) return '/tree-4.png';
    if (currentLevel === 5) return '/tree-5.png';
    if (currentLevel === 6) return '/tree-6.png';
    return '/tree-7.png'; 
  };

  if (!hasTree) {
    return (
      <div className="panel">
        <h2>У вас нет дерева</h2>
        <button className="pixel-btn" onClick={handleMint} disabled={loading}>
          {loading ? 'Ожидание...' : 'Посадить дерево (Бесплатно)'}
        </button>
      </div>
    );
  }

  return (
    <div className={`panel ${dailyEvent === 'rain' ? 'weather-rain' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* Бегающая мышь на фоне */}
      <div className="pixel-mouse" onClick={handleMouseCatch}>🐭</div>

      <h2>Ваше Дерево (ID: {tokenId})</h2>
      
      {/* Панель инфо о событиях */}
      <div style={{ minHeight: '30px', color: '#eab308' }}>
        {dailyEvent === 'rain' && '🌧️ ИДЕТ ДОЖДЬ! ПОЛИВ БЕСПЛАТНЫЙ!'}
        {dailyEvent === 'drought' && '☀️ ЗАСУХА! ДЕРЕВО СОХНЕТ БЫСТРЕЕ!'}
        {dailyEvent === 'pests' && !pestRemoved && '🐛 ВРЕДИТЕЛИ! ПРОГОНИТЕ ИХ!'}
        {miceCaught > 0 && <span style={{ float: 'right', color: '#a855f7' }}>Мышей поймано: {miceCaught}</span>}
      </div>

      <div style={{ margin: '20px auto', position: 'relative', width: '150px', height: '150px' }}>
        {level > 0 ? (
          <>
            <img 
              id="pixel-tree-img"
              src={getTreeImage(level)} 
              alt={`Tree Level ${level}`} 
              onClick={playTreeSound}
              style={{ 
                width: '100%', height: '100%', objectFit: 'contain', 
                imageRendering: 'pixelated', cursor: 'pointer', transition: 'transform 0.1s'
              }} 
            />
            {/* Рендерим жука поверх дерева, если выпало событие */}
            {dailyEvent === 'pests' && !pestRemoved && (
               <div className="pest-bug" title="Вредитель">🐛</div>
            )}
          </>
        ) : (
          <p style={{ fontSize: '2rem' }}>🌲</p>
        )}
      </div>

      <p>Уровень: <strong>{level}</strong></p>
      <p>Статус: <span style={{ color: isWatered ? '#4ade80' : '#ef4444' }}>
        {isWatered ? "ПОЛИТО" : "ХОЧЕТ ПИТЬ"}
      </span></p>
      
      {/* Логика кнопок в зависимости от погоды */}
      {!isWatered && dailyEvent === 'pests' && !pestRemoved ? (
        <button className="pixel-btn" onClick={handleRemovePest} style={{ backgroundColor: '#ef4444' }}>
          Прогнать жука!
        </button>
      ) : !isWatered && (
        <button className="pixel-btn" onClick={handleWater} disabled={loading}>
          {loading ? 'Поливаем...' : dailyEvent === 'rain' ? 'Полить (Бесплатно)' : 'Полить (0.000054 ETH)'}
        </button>
      )}
    </div>
  );
};
