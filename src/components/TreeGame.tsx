import { useState, useEffect } from 'react';
import { getTreeStats, mintTree, waterTree, getUserTreeId } from '../utils/web3Utils';

export const TreeGame = ({ account, hasTree, onUpdate }: { account: string, hasTree: boolean, onUpdate: () => void }) => {
  const [level, setLevel] = useState<number>(0);
  const [isWatered, setIsWatered] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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
  }, [hasTree, account]);

  const handleMint = async () => {
    try {
      setLoading(true);
      await mintTree(account);
      alert("Минт успешен! Дерево посажено.");
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWater = async () => {
    if (tokenId === null) return;
    try {
      setLoading(true);
      await waterTree(account, tokenId);
      alert("Дерево полито!");
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    <div className="panel">
      <h2>Ваше Дерево (ID: {tokenId})</h2>
      <p style={{ fontSize: '2rem' }}>🌲</p>
      <p>Уровень: <strong>{level}</strong></p>
      <p>Статус: <span style={{ color: isWatered ? '#4ade80' : '#ef4444' }}>
        {isWatered ? "ПОЛИТО" : "ХОЧЕТ ПИТЬ"}
      </span></p>
      
      {!isWatered && (
        <button className="pixel-btn" onClick={handleWater} disabled={loading}>
          {loading ? 'Поливаем...' : 'Полить (0.000054 ETH)'}
        </button>
      )}
    </div>
  );
};
