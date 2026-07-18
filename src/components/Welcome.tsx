export const Welcome = ({ onClose }: { onClose?: () => void }) => (
  <div className="panel" style={{ textAlign: 'left', lineHeight: '1.8', position: 'relative' }}>
    {onClose && (
      <button 
        onClick={onClose} 
        style={{ 
          position: 'absolute', top: '10px', right: '10px', 
          background: 'none', border: 'none', color: '#ef4444', 
          cursor: 'pointer', fontSize: '20px', fontFamily: 'inherit'
        }}
      >
        ✖
      </button>
    )}
    <h2 style={{ textAlign: 'center', marginTop: '0', marginBottom: '20px' }}>Как играть?</h2>
    <ol style={{ paddingLeft: '25px', margin: 0 }}>
      <li style={{ marginBottom: '15px', paddingLeft: '5px' }}>
        <strong>Цель:</strong> Вырасти Древо Жизни (7 уровень) за 7 дней.
      </li>
      <li style={{ marginBottom: '15px', paddingLeft: '5px' }}>
        <strong>Полив:</strong> Поливай 1 раз в 24 часа. Стоимость: 0.000054 ETH (все деньги идут в Банк).
      </li>
      <li style={{ marginBottom: '15px', paddingLeft: '5px' }}>
        <strong>События:</strong> Следи за погодой! В дождь полив бесплатный, а вредителей нужно прогонять.
      </li>
      <li style={{ marginBottom: '15px', paddingLeft: '5px' }}>
        <strong>Раффл:</strong> Каждое воскресенье. Участие <strong>бесплатное</strong>, но только для деревьев 7 уровня.
      </li>
      <li style={{ paddingLeft: '5px' }}>
        <strong>Победа:</strong> 1 случайный победитель забирает весь Банк!
      </li>
    </ol>
  </div>
);
