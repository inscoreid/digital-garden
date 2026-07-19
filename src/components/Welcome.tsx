export const Welcome = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="panel" style={{ position: 'relative', textAlign: 'left', padding: '20px 30px' }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'transparent', border: 'none', color: '#ef4444',
          fontSize: '1.2rem', cursor: 'pointer', padding: '5px'
        }}
      >
        ✖
      </button>

      <h2 style={{ textAlign: 'center', color: '#4ade80', marginBottom: '20px' }}>КАК ИГРАТЬ?</h2>

      {/* paddingLeft: '25px' решает проблему с вылезающими за край цифрами */}
      <ol style={{
        lineHeight: '1.6',
        paddingLeft: '25px', 
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        wordWrap: 'break-word'
      }}>
        <li><strong>Цель:</strong> Вырасти Древо Жизни (7 уровень) за 7 дней.</li>
        <li><strong>Полив:</strong> Поливай 1 раз в 24 часа. Стоимость: 0.000054 ETH (все деньги идут в Банк).</li>
        <li><strong>События:</strong> Следи за погодой! В дождь полив бесплатный, а вредителей нужно прогонять.</li>
        <li><strong>Раффл:</strong> Каждое воскресенье. Участие бесплатное, но только для деревьев 7 уровня.</li>
        <li><strong>Победа:</strong> 1 случайный победитель забирает весь Банк!</li>
        
        {/* Визуальный разделитель для нового блока правил */}
        <hr style={{ borderColor: '#374151', width: '100%', margin: '5px 0' }} />
        
        <li><strong>Метео-Тотализатор:</strong> Делай ставку (ETH) на то, какая погода будет у твоего дерева <strong>ЗАВТРА</strong>.</li>
        <li><strong>Пул и Выигрыш:</strong> Угадал погоду — забираешь свою ставку <strong>x2</strong> из пула. Не угадал — твой эфир остается в пуле и кормит будущих победителей!</li>
      </ol>
    </div>
  );
};
