import { useState, useEffect } from 'react';
import { getTreeStats, mintTree, waterTree, getUserTreeId } from '../utils/web3Utils';

export const TreeGame = ({ account, hasTree, onUpdate }: { account: string, hasTree: boolean, onUpdate: () => void }) => {
  const [level, setLevel] = useState<number>(0);
  const [isWatered, setIsWatered] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [dailyEvent, setDailyEvent] = useState<'normal' | 'rain' | 'drought' | 'pests'>('normal');
  const [pestRemoved, setPestRemoved] = useState(false);
  
  // Новые состояния для рандомной мыши
  const [miceCaught, setMiceCaught] = useState(0);
  const [mouseVisible, setMouseVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    if (account) {
      const today = new Date().toISOString().split('T')[0];
      const seedString = today + account.toLowerCase();
      let hash = 0;
      for (let i = 0; i < seedString.length; i++) {
        hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
      }
      const rand = Math.abs(hash) % 100;

      if (rand < 20) setDailyEvent('rain');
      else if (rand < 40) setDailyEvent('drought');
      else if (rand < 60) setDailyEvent('pests');
      else setDailyEvent('normal');
    }
  }, [account]);

  useEffect(() => {
    if (hasTree) {
      getUserTreeId(account).then(id => {
        setTokenId(id);
        if (id !== null) {
          getTreeStats(id).then(stats => {
            setLevel(stats.level);
            setIsWatered(stats.isWatered); 
          });
        }
      }).catch(console.error);
    }
  }, [hasTree, account, dailyEvent]);

  // СЛОЖНАЯ ЛОГИКА РАНДОМНОЙ МЫШИ
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let sessionIntervalId: NodeJS.Timeout;
    let hideTimeoutId: NodeJS.Timeout;

    const checkAndRunMouse = () => {
      const cooldownUntil = localStorage.getItem('mouseCooldownUntil');
      const now = Date.now();

      // Если кулдаун еще действует
      if (cooldownUntil && now < parseInt(cooldownUntil, 10)) {
        const timeToWait = parseInt(cooldownUntil, 10) - now;
        timeoutId = setTimeout(checkAndRunMouse, timeToWait);
        return;
      }

      // Начинаем сессию (от 5 до 7 появлений)
      let appearances = Math.floor(Math.random() * 3) + 5; 

      const showMouse = () => {
        if (appearances <= 0) {
          clearInterval(sessionIntervalId);
          // Ставим кулдаун на 2 часа (2 * 60 * 60 * 1000 мс)
          const nextTime = Date.now() + 2 * 60 * 60 * 1000;
          localStorage.setItem('mouseCooldownUntil', nextTime.toString());
          timeoutId = setTimeout(checkAndRunMouse, 2 * 60 * 60 * 1000);
          return;
        }

        // Рандомная позиция (отступаем от краев по 15%, чтобы не вылезала за панель)
        const randomTop = Math.floor(Math.random() * 70) + 15;
        const randomLeft = Math.floor(Math.random() * 70) + 15;
        
        setMousePos({ top: `${randomTop}%`, left: `${randomLeft}%` });
        setMouseVisible(true);
        appearances--;

        // Прячем мышь через 3 секунды, если юзер не успел кликнуть
        hideTimeoutId = setTimeout(() => {
          setMouseVisible(false);
        }, 3000);
      };

      // Первое появление сразу
      showMouse();
      // Затем каждые 10 секунд
      sessionIntervalId = setInterval(showMouse, 10000);
    };

    // Запускаем систему только если игрок авторизован и у него есть дерево
    if (hasTree) {
      checkAndRunMouse();
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(sessionIntervalId);
      clearTimeout(hideTimeoutId);
    };
  }, [hasTree]); // Перезапускаем только при изменении наличия дерева

  const playTreeSound = () => {
    const audio = new Audio('/click.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
    
    const treeImg = document.getElementById('pixel-tree-img');
    if (treeImg) {
      treeImg.style.transform = 'scale(0.95)';
      setTimeout(() => treeImg.style.transform = 'scale(1)', 100);
    }
  };

  const handleMouseCatch = () => {
    setMouseVisible(false); // Прячем мышь сразу при клике
    setMiceCaught(prev => prev + 1);
    const audio = new Audio('/click.mp3');
    audio.playbackRate = 2.0; 
    audio.play().catch(() => {});
  };

  const handleRemovePest = () => {
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
      
      {/* Рандомно появляющаяся мышь */}
      {mouseVisible && (
        <div 
          className="pixel-mouse" 
          onClick={handleMouseCatch}
          style={{ top: mousePos.top, left: mousePos.left }}
        >
          🐭
        </div>
      )}

      <h2>Ваше Дерево (ID: {tokenId})</h2>
      
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
