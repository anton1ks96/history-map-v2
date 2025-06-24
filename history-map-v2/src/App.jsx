import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import brusilovData from './brusilovData.json';
import citiesData from './citiesData.json';
import NewVideo from './assets/NewVideo.mp4';


// Фикс для иконок Leaflet в React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Кастомные иконки для разных типов маркеров
const createCustomIcon = (color, size = [30, 40]) => {
  return L.divIcon({
    html: `<svg width="${size[0]}" height="${size[1]}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="${color}"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>`,
    className: 'custom-div-icon',
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]]
  });
};



// Компонент для отображения движения войск
const TroopMovements = ({ movements, selectedMovement, selectedPhase }) => {
  // Фильтруем движения по выбранной фазе
  const filteredMovements = selectedPhase ?
    movements.filter(movement => movement.operation_phase === selectedPhase) :
    movements;

  return filteredMovements.map((movement) => {
    const isSelected = selectedMovement?.id === movement.id;
    const isEnemyMovement = movement.is_enemy;

    // Определяем цвет и стиль стрелки в зависимости от типа
    let color = isEnemyMovement ? '#dc2626' : '#3b82f6';
    let dashArray = null;
    let weight = 4;

    if (movement.arrow_type === 'wide') {
      weight = 8;
      color = '#1e40af';
    } else if (movement.arrow_type === 'counterattack') {
      dashArray = '10, 5';
      color = '#dc2626';
    } else if (movement.arrow_type === 'stopped' || movement.arrow_type === 'multiple_stopped') {
      dashArray = '15, 10';
      color = '#f59e0b';
    } else if (movement.arrow_type === 'short_unsuccessful') {
      dashArray = '5, 5';
      color = '#ef4444';
    }

    if (isSelected) {
      weight = weight + 2;
    }

    return (
      <React.Fragment key={movement.id}>
        <Polyline
          positions={movement.path}
          color={color}
          weight={weight}
          opacity={isSelected ? 1 : 0.8}
          dashArray={dashArray}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg mb-2">{movement.name}</h3>
              <p><strong>Армия:</strong> {movement.army}</p>
              <p><strong>Командующий:</strong> {movement.commander}</p>
              <p><strong>Численность:</strong> {movement.strength}</p>
              <p><strong>Период:</strong> {movement.period}</p>
              {movement.description && (
                <p><strong>Описание:</strong> {movement.description}</p>
              )}
              {movement.note && (
                <p><strong>Примечание:</strong> {movement.note}</p>
              )}
            </div>
          </Popup>
        </Polyline>
        {/* Стрелка в конце линии */}
        <Marker
          position={movement.path[movement.path.length - 1]}
          icon={L.divIcon({
            html: `<div style="transform: rotate(${getArrowRotation(movement.path)}deg);">
              <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2 L22 12 L12 22 L12 16 L2 16 L2 8 L12 8 Z" fill="${color}"/>
              </svg>
            </div>`,
            className: 'arrow-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })}
        />
      </React.Fragment>
    );
  });
};

// Функция для расчета угла поворота стрелки
const getArrowRotation = (path) => {
  const lastTwo = path.slice(-2);
  const dx = lastTwo[1][1] - lastTwo[0][1];
  const dy = lastTwo[1][0] - lastTwo[0][0];
  return Math.atan2(dx, -dy) * (180 / Math.PI);
};

// Компонент для отображения линий фронта
const FrontLines = ({ frontLines, selectedPhase }) => {
  return frontLines.map((frontLine) => {
    // Определяем, показывать ли эту линию фронта в зависимости от выбранной фазы
    let shouldShow = false;
    
    if (selectedPhase === '') {
      // Показываем все линии фронта
      shouldShow = true;
    } else if (selectedPhase === 'lutsk_breakthrough') {
      // Показываем начальную, линию на 16 июня и финальную
      shouldShow = frontLine.type === 'initial' || frontLine.type === 'advance' || frontLine.type === 'final';
    } else if (selectedPhase === 'kovel_strike') {
      // Показываем начальную, на 16 июня и финальную
      shouldShow = frontLine.type === 'initial' || frontLine.type === 'advance' || frontLine.type === 'final';
    } else {
      // Для остальных фаз показываем все
      shouldShow = true;
    }

    if (!shouldShow) return null;

    // Определяем цвет и стиль линии
    let color = '#dc2626'; // красный для начальной
    let dashArray = null;
    
    if (frontLine.type === 'initial') {
      color = '#dc2626';
      dashArray = '15, 10';
    } else if (frontLine.type === 'advance') {
      color = '#22c55e';
      dashArray = null;
    } else if (frontLine.type === 'final') {
      color = '#16a34a';
      dashArray = '10, 5';
    }

    return (
      <Polyline
        key={frontLine.id}
        positions={frontLine.coordinates}
        color={color}
        weight={3}
        opacity={0.8}
        dashArray={dashArray}
      >
        <Popup>
          <div style={{ padding: '8px', maxWidth: '300px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
              {frontLine.name}
            </h3>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Дата:</strong> {frontLine.date}
            </p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Длина:</strong> {frontLine.length}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', lineHeight: '1.4' }}>
              {frontLine.description}
            </p>
          </div>
        </Popup>
      </Polyline>
    );
  });
};

// Компонент для отображения рек
const Rivers = ({ rivers, onRiverClick }) => {
  return rivers.map((river) => {
    if (river.type === 'estuary') {
      // Для устья реки показываем точку
      return (
        <Marker
          key={river.id}
          position={river.coordinates}
          icon={L.divIcon({
            html: `<div style="background: #4A90E2; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;"></div>`,
            className: 'river-estuary-marker',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })}
          eventHandlers={{
            click: () => onRiverClick(river)
          }}
        >
          <Tooltip permanent={true} direction="top" offset={[0, -10]} className="river-tooltip">
            <div className="text-xs font-semibold">{river.name}</div>
          </Tooltip>
        </Marker>
      );
    }
    // Обычные реки (линии) больше не отображаются
    return null;
  }).filter(Boolean);
};

// Компонент для отображения городов
const CityMarkers = ({ cities, selectedPhase }) => {
  const getCityIcon = (city) => {
    const { importance, captured, id } = city;
    const size = importance === 'major' ? [18, 18] : importance === 'strategic' ? [14, 14] : importance === 'regional' ? [12, 12] : [10, 10];

    // Определяем статус захвата в зависимости от фазы операции
    let isCaptured = Boolean(captured);
    
    // Специальная логика для городов, захваченных в фазе "Удар на Ковель"
    const kovelStrikeCities = ['manevychi', 'gorodok', 'galuzia'];
    if (kovelStrikeCities.includes(id)) {
      if (selectedPhase === 'kovel_strike' || selectedPhase === '') {
        isCaptured = true; // Показываем как захваченные в фазе "Удар на Ковель" и "Все ходы"
      } else {
        isCaptured = false; // В остальных фазах показываем как незахваченные
      }
    }

    const color = isCaptured ? '#22c55e' : '#dc2626'; // Зеленый для захваченных, красный для незахваченных
    const borderColor = isCaptured ? 'rgba(34, 197, 94, 0.8)' : 'rgba(220, 38, 38, 0.8)';

    return L.divIcon({
      html: `<div style="
        background: ${color}; 
        width: ${size[0]}px; 
        height: ${size[1]}px; 
        border-radius: 50%; 
        border: 2px solid ${borderColor};
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      "></div>`,
      className: 'city-marker',
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1] / 2]
    });
  };

  return cities.map((city) => {
    // Определяем статус захвата для попапа (та же логика, что и для иконки)
    let isCaptured = Boolean(city.captured);
    let captureDate = city.captureDate;
    let captureArmy = '';
    
    const kovelStrikeCities = ['manevychi', 'gorodok', 'galuzia'];
    if (kovelStrikeCities.includes(city.id)) {
      if (selectedPhase === 'kovel_strike' || selectedPhase === '') {
        isCaptured = true;
        captureDate = '22 июня (5 июля) 1916';
        captureArmy = '8-я и 3-я армии';
      } else {
        isCaptured = false;
        captureDate = null;
        captureArmy = '';
      }
    }

    return (
      <Marker
        key={city.id}
        position={city.coordinates}
        icon={getCityIcon(city)}
      >
        <Popup>
          <div style={{ maxWidth: '300px', padding: '8px' }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: 'bold',
              color: isCaptured ? '#22c55e' : '#dc2626'
            }}>
              {city.name}
            </h3>

            <div style={{ marginBottom: '8px' }}>
              <strong>Статус:</strong>
              <span style={{ color: isCaptured ? '#22c55e' : '#dc2626', fontWeight: 'bold', marginLeft: '4px' }}>
                {isCaptured ? 'Захвачен' : 'Не захвачен'}
              </span>
            </div>

            {captureDate && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Дата захвата:</strong> {captureDate}
              </div>
            )}

            {captureArmy && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Захвачен:</strong> {captureArmy}
              </div>
            )}

            <div style={{ marginBottom: '8px' }}>
              <strong>Население:</strong> {city.population?.toLocaleString() || 'Неизвестно'}
            </div>

            {city.description && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Описание:</strong> {city.description}
              </div>
            )}

            {city.significance && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '4px',
                fontSize: '13px'
              }}>
                <strong>Значение:</strong> {city.significance}
              </div>
            )}
          </div>
        </Popup>
        <Tooltip permanent={true} direction="top" offset={[0, -10]} className="city-tooltip">
          <div className="text-xs font-semibold">{city.name}</div>
        </Tooltip>
      </Marker>
    );
  });
};

// Компонент вступления
const IntroComponent = ({ onComplete }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [showText, setShowText] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Показать видео с задержкой
    const videoTimer = setTimeout(() => {
      setShowVideo(true);
    }, 500);

    // Показать текст через 3 секунды
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 3500);

    // Дополнительная проверка для зацикливания видео
    const videoCheckInterval = setInterval(() => {
      const video = videoRef.current;
      if (video && video.paused && !video.ended) {
        video.play().catch(() => {
          // Игнорируем ошибки автовоспроизведения
        });
      }
    }, 1000);

    return () => {
      clearTimeout(videoTimer);
      clearTimeout(textTimer);
      clearInterval(videoCheckInterval);
    };
  }, []);

  // Обработчик для плавного зацикливания видео
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration && video.currentTime >= video.duration - 0.05) {
      video.currentTime = 0.01;
    }
  };

  // Обработчик окончания видео для дополнительной гарантии
  const handleVideoEnded = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play();
    }
  };

  const handleStartClick = () => {
    setFadeOut(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  return (
    <div className={`intro-container ${fadeOut ? 'fade-out' : ''}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        preload="auto"
        playsInline
        className={`intro-video ${showVideo ? 'show' : ''}`}
        onTimeUpdate={handleVideoTimeUpdate}
        onEnded={handleVideoEnded}
        onLoadedData={() => {
          if (videoRef.current) {
            videoRef.current.playbackRate = 1.0;
          }
        }}
      >
        <source src={NewVideo} type="video/mp4" />
        Ваш браузер не поддерживает видео.
      </video>
      <div className="intro-overlay">
        <div className={`intro-text ${showText ? 'show' : ''}`}>
          <h1 className="intro-title">Брусиловский прорыв</h1>
          <p className="intro-subtitle">Интерактивная карта крупнейшей операции Первой мировой войны</p>
          <div className={`intro-button-container ${showText ? 'show' : ''}`}>
            <button
              className="intro-start-button"
              onClick={handleStartClick}
            >
              Начать исследование
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Основной компонент приложения
export default function BrusilovOffensiveMap() {
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [selectedRiver, setSelectedRiver] = useState(null);

  const [showLegend, setShowLegend] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [showMainContent, setShowMainContent] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [showOperationInfo, setShowOperationInfo] = useState(false);
  const [isOperationInfoClosing, setIsOperationInfoClosing] = useState(false);

  // Фазы операции для выпадающего списка
  const operationPhases = [
    { value: '', label: 'Все ходы операции' },
    { value: 'lutsk_breakthrough', label: '«Луцкий» прорыв' },
    { value: 'kovel_strike', label: 'Удар на Ковель' }
  ];

  // Данные о движениях войск
  const movements = [
    {
      id: 'attack_manevychi_kovel',
      name: 'Атака на Маневичи',
      army: '8-я и 3-я армии',
      commander: 'Юго-Западный фронт',
      strength: 'Части 8-й и 3-й армий',
      period: '22 июня (5 июля) 1916',
      description: 'Возобновление наступления Юго-Западного фронта. Главный удар силами 8-й и 3-й армий на Ковель.',
      path: [
        [51.451, 25.75], // Начальная позиция с востока от Маневичей
        [51.292329951327766, 25.53192294204842] // Маневичи
      ],
      operation_phase: 'kovel_strike',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'attack_gorodok_kovel',
      name: 'Атака на Городок',
      army: '8-я и 3-я армии',
      commander: 'Юго-Западный фронт',
      strength: 'Части 8-й и 3-й армий',
      period: '22 июня (5 июля) 1916',
      description: 'Возобновление наступления Юго-Западного фронта. Главный удар силами 8-й и 3-й армий на Ковель.',
      path: [
        [51.370134518234714 - 0.3, 25.478750830537187 - 0.3], // Начальная позиция с востока от Городка
        [51.370134518234714, 25.478750830537187] // Городок
      ],
      operation_phase: 'kovel_strike',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'attack_galuzia_kovel',
      name: 'Атака на Галузию',
      army: '8-я и 3-я армии',
      commander: 'Юго-Западный фронт',
      strength: 'Части 8-й и 3-й армий',
      period: '22 июня (5 июля) 1916',
      description: 'Возобновление наступления Юго-Западного фронта. Главный удар силами 8-й и 3-й армий на Ковель.',
      path: [
        [51.40224997054743 - 0.3, 25.59724009597908 - 0.3], // Начальная позиция с востока от Галузии
        [51.40224997054743, 25.59724009597908] // Галузия
      ],
      operation_phase: 'kovel_strike',
      is_enemy: false,
      arrow_type: 'normal'
    }
  ];

  // Данные об операциях
  const operationInfo = {
    '': {
      title: 'Брусиловский прорыв',
      subtitle: 'Общая информация об операции',
      content: 'Здесь будет общая информация об операции, которую вы предоставите позже.'
    },
    'lutsk_breakthrough': {
      title: '«Луцкий» прорыв',
      subtitle: '4-15 июня 1916 года',
      content: `Первая и наиболее успешная фаза Брусиловского наступления. Главный удар наносила 8-я армия генерала А.М. Каледина в направлении Луцка.

      Основные события:
      • 4 июня - начало артиллерийской подготовки
      • 7 июня - захват Луцка русскими войсками
      • 15 июня - стабилизация фронта после первых успехов
      
      Результаты:
      • Прорыв австро-венгерской обороны на глубину 60-80 км
      • Захват ключевых городов: Луцк, Дубно
      • Начало отступления 4-й австро-венгерской армии`
    },

          'kovel_strike': {
        title: 'Удар на Ковель',
        subtitle: '22 июня (5 июля) 1916 года',
        content: `Возобновление наступления Юго-Западного фронта. Наступление велось всеми армиями, кроме 11-й. Главный удар наносился силами 8-й и 3-й армий на Ковель.

        Основные события:
        • Прорыв германского фронта за три дня боев
        • Беспорядочное отступление австро-германских войск
        • Захват городов: Галузия, Маневичи, Городок
        
        Результаты:
        • Успешное развитие наступления на Ковельском направлении
        • Расширение прорыва в немецкой обороне
        • Улучшение тактического положения русских войск`
      },


  };

  // Состояния для анимаций модальных окон
  const [isRiverModalClosing, setIsRiverModalClosing] = useState(false);

  // Функции для плавного закрытия модальных окон
  const closeRiverModal = () => {
    setIsRiverModalClosing(true);
    setTimeout(() => {
      setSelectedRiver(null);
      setIsRiverModalClosing(false);
    }, 300); // Время анимации
  };

  const closeOperationInfoModal = () => {
    setIsOperationInfoClosing(true);
    setTimeout(() => {
      setShowOperationInfo(false);
      setIsOperationInfoClosing(false);
    }, 300); // Время анимации
  };

  // Обработчики для закрытия модальных окон кликом по overlay
  const handleRiverOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeRiverModal();
    }
  };

  const handleOperationInfoOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeOperationInfoModal();
    }
  };

  // Обработчик для закрытия модальных окон клавишей Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showOperationInfo && !isOperationInfoClosing) {
          closeOperationInfoModal();
        } else if (selectedRiver && !isRiverModalClosing) {
          closeRiverModal();
        }
      }
    };

    if (selectedRiver || showOperationInfo) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedRiver, isRiverModalClosing, showOperationInfo, isOperationInfoClosing]);



  const mapCenter = [49.8, 25.2];
  const mapZoom = 7;

  const mapBounds = [
    [46.0, 22.0], // юго-запад
    [54.0, 30.0]  // северо-восток
  ];



  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: `
        linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)
      `,
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {showIntro ? (
        <IntroComponent onComplete={() => {
          setShowIntro(false);
          setTimeout(() => {
            setShowMainContent(true);
          }, 500);
        }} />
      ) : (
        <div className={`main-content ${showMainContent ? 'show' : ''}`}>
          <header style={{
            background: 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(20px)',
            color: '#ffffff',
            padding: '24px 32px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            opacity: showMainContent ? 1 : 0,
            transition: showMainContent
              ? 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
              : 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
            transform: showHeader ? 'translateY(0px)' : 'translateY(-150px)',
            willChange: 'transform, opacity',
            zIndex: 10,
            pointerEvents: showHeader ? 'auto' : 'none'
          }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              textAlign: 'center',
              margin: 0,
              fontFamily: 'SF Pro Display, Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              letterSpacing: '-1px',
              color: '#ffffff',
              lineHeight: 1.2,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              Брусиловский прорыв 1916
            </h1>
            <p style={{
              textAlign: 'center',
              margin: '8px 0 0 0',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '16px',
              fontWeight: '400',
              letterSpacing: '0.5px',
              fontFamily: 'SF Pro Text, Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              lineHeight: 1.5
            }}>
              Интерактивная карта крупнейшей операции Первой мировой войны
            </p>
          </header>

          <div style={{
            flex: 1,
            width: '100%',
            height: '100%',
            padding: '20px',
            paddingTop: '20px',
            boxSizing: 'border-box',
            transition: 'margin-top 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            marginTop: showHeader ? '0px' : '-130px'
          }}>
            <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%', borderRadius: '16px' }}
                scrollWheelZoom={true}
                maxBounds={mapBounds}
                maxBoundsViscosity={1.0}
                minZoom={6}
                maxZoom={12}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Отображение линий фронта */}
                <FrontLines
                  frontLines={brusilovData.front_lines || []}
                  selectedPhase={selectedPhase}
                />

                {/* Стрелки 8-й армии - отображаются только в фазе Луцкий прорыв и Все ходы */}
                {(selectedPhase === '' || selectedPhase === 'lutsk_breakthrough') && (
                  <>
                    {/* Стрелка 8-й армии к Луцку */}
                    <Polyline
                      positions={[
                        [50.58, 25.54],
                        [50.747, 25.325]
                      ]}
                      color="#1e40af"
                      weight={6}
                      opacity={0.9}
                    >
                      <Popup>
                        <div style={{ padding: '8px', maxWidth: '250px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            8-я армия к Луцку
                          </h3>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Командующий:</strong> Генерал А.М. Каледин
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Дата:</strong> 4-7 июня 1916
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Результат:</strong> Луцк занят 7 июня
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            Главный удар Брусиловского наступления
                          </p>
                        </div>
                      </Popup>
                    </Polyline>
                    <Marker
                      position={[50.747, 25.325]}
                      icon={L.divIcon({
                        html: `<div style="transform: rotate(232deg);">
                          <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5 L19 12 L8 19 L8 15 L1 15 L1 9 L8 9 Z" fill="#1e40af" stroke="#ffffff" stroke-width="0.5"/>
                          </svg>
                        </div>`,
                        className: 'army-arrow',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                      })}
                    />

                    {/* Стрелка 8-й армии к Дубно */}
                    <Polyline
                      positions={[
                        [50.56, 25.54],
                        [50.4171, 25.7578]
                      ]}
                      color="#1e40af"
                      weight={5}
                      opacity={0.9}
                    >
                      <Popup>
                        <div style={{ padding: '8px', maxWidth: '250px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            8-я армия к Дубно
                          </h3>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Корпус:</strong> 32-й корпус
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Командующий:</strong> Генерал А.М. Каледин
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Дата:</strong> 4-15 июня 1916
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Результат:</strong> Дубно захвачен
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            Части 32-го корпуса, действующего южнее Луцка
                          </p>
                        </div>
                      </Popup>
                    </Polyline>
                    <Marker
                      position={[50.4171, 25.7578]}
                      icon={L.divIcon({
                        html: `<div style="transform: rotate(50deg);">
                          <svg width="28" height="28" viewBox="2 -1 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5 L19 12 L8 19 L8 15 L1 15 L1 9 L8 9 Z" fill="#1e40af" stroke="#ffffff" stroke-width="0.5"/>
                          </svg>
                        </div>`,
                        className: 'army-arrow',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                      })}
                    />
                  </>
                )}

                {/* Контрудары австро-германских войск - отображаются только в фазе Луцкий прорыв и Все ходы */}
                {(selectedPhase === '' || selectedPhase === 'lutsk_breakthrough') && (
                  <>
                    {/* Контрудар австро-германских войск - северное направление */}
                    <Polyline
                      positions={[
                        [50.77, 25.07], // 55.75399400, 37.62209300
                        [50.754, 25.262]
                      ]}
                      color="#dc2626"
                      weight={5}
                      opacity={0.9}
                      dashArray="8, 4"
                    >
                      <Popup>
                        <div style={{ padding: '8px', maxWidth: '280px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            Контрудар австро-германских войск (ген. Линзинген)
                          </h3>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Командующий:</strong> Генерал А. фон Линзинген
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Дата:</strong> 3 (16) июня 1916 г.
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Направление:</strong> Северное направление к Луцку
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            Попытка отбить захваченный русскими Луцк
                          </p>
                        </div>
                      </Popup>
                    </Polyline>
                    <Marker
                      position={[50.754, 25.262]}
                      icon={L.divIcon({
                        html: `<div style="transform: rotate(9deg);">
                          <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5 L19 12 L8 19 L8 15 L1 15 L1 9 L8 9 Z" fill="#dc2626" stroke="#ffffff" stroke-width="0.5"/>
                          </svg>
                        </div>`,
                        className: 'counterattack-arrow',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                      })}
                    />

                    {/* Контрудар австро-германских войск - южное направление */}
                    <Polyline
                      positions={[
                        [50.849, 25.133], 
                        [50.802, 25.248] 
                      ]}
                      color="#dc2626"
                      weight={5}
                      opacity={0.9}
                      dashArray="8, 4"
                    >
                      <Popup>
                        <div style={{ padding: '8px', maxWidth: '280px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            Контрудар австро-германских войск (ген. Линзинген)
                          </h3>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Командующий:</strong> Генерал А. фон Линзинген
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Дата:</strong> 3 (16) июня 1916 г.
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Направление:</strong> Южное направление к Луцку
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            Попытка отбить захваченный русскими Луцк
                          </p>
                        </div>
                      </Popup>
                    </Polyline>
                    <Marker
                      position={[50.802, 25.248]}
                      icon={L.divIcon({
                        html: `<div style="transform: rotate(36deg);">
                          <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5 L19 12 L8 19 L8 15 L1 15 L1 9 L8 9 Z" fill="#dc2626" stroke="#ffffff" stroke-width="0.5"/>
                          </svg>
                        </div>`,
                        className: 'counterattack-arrow',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                      })}
                    />
                  </>
                )}

                {/* Стрелки 9-й армии генерала Лечицкого - отображаются только в фазе Луцкий прорыв и Все ходы */}
                {(selectedPhase === '' || selectedPhase === 'lutsk_breakthrough') && (
                  <>
                    {/* 9-я армия (ген. Лечицкий) - наступление на Черновцы */}
                    <Polyline
                      positions={[
                        [48.9, 25.9],
                        [48.6, 25.93],
                        [48.291899, 25.935892]
                      ]}
                      color="#1e40af"
                      weight={6}
                      opacity={0.9}
                    >
                      <Popup>
                        <div style={{ padding: '8px', maxWidth: '280px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            Наступление на Черновцы
                          </h3>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Армия:</strong> 9-я армия
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Командующий:</strong> Генерал П. А. Лечицкий
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Результат:</strong> Черновцы взяты 18 июня 1916 г.
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            Главный удар левофланговой армии
                          </p>
                        </div>
                      </Popup>
                    </Polyline>
                    <Marker
                      position={[48.291899, 25.935892]}
                      icon={L.divIcon({
                        html: `<div style="transform: rotate(95deg);">
                          <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5 L19 12 L8 19 L8 15 L1 15 L1 9 L8 9 Z" fill="#1e40af" stroke="#ffffff" stroke-width="0.5"/>
                          </svg>
                        </div>`,
                        className: 'army-arrow',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                      })}
                    />

                    {/* 9-я армия - 12-й корпус к Кутам */}
                    <Polyline
                      positions={[
                        [48.7, 25.5],
                        [48.45, 25.35],
                        [48.263, 25.179]
                      ]}
                      color="#1e40af"
                      weight={5}
                      opacity={0.9}
                    >
                      <Popup>
                        <div style={{ padding: '8px', maxWidth: '280px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            12-й корпус: захват Куты
                          </h3>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Армия:</strong> 9-я армия
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Командующий:</strong> Генерал П. А. Лечицкий
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Корпус:</strong> 12-й корпус
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            Движение к румынской границе
                          </p>
                        </div>
                      </Popup>
                    </Polyline>
                    <Marker
                      position={[48.263, 25.179]}
                      icon={L.divIcon({
                        html: `<div style="transform: rotate(132deg);">
                          <svg width="28" height="28" viewBox="0 -4 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5 L19 12 L8 19 L8 15 L1 15 L1 9 L8 9 Z" fill="#1e40af" stroke="#ffffff" stroke-width="0.5"/>
                          </svg>
                        </div>`,
                        className: 'army-arrow',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                      })}
                    />

                    {/* 9-я армия - 3-й кавалерийский корпус в Кымпулунг */}
                    <Polyline
                      positions={[
                        [48.283, 25.754],
                        [47.527, 25.575]
                      ]}
                      color="#1e40af"
                      weight={4}
                      opacity={0.9}
                    >
                      <Popup>
                        <div style={{ padding: '8px', maxWidth: '280px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            3-й кавалерийский корпус: рейд в Кымпулунг
                          </h3>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Армия:</strong> 9-я армия
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Командующий:</strong> Генерал П. А. Лечицкий
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Корпус:</strong> 3-й кавалерийский корпус
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            Кавалерийский прорыв в Румынию
                          </p>
                        </div>
                      </Popup>
                    </Polyline>
                    <Marker
                      position={[47.527, 25.575]}
                      icon={L.divIcon({
                        html: `<div style="transform: rotate(100deg);">
                          <svg width="26" height="26" viewBox="0 -3 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5 L19 12 L8 19 L8 15 L1 15 L1 9 L8 9 Z" fill="#1e40af" stroke="#ffffff" stroke-width="0.5"/>
                          </svg>
                        </div>`,
                        className: 'cavalry-arrow',
                        iconSize: [26, 26],
                        iconAnchor: [13, 13]
                      })}
                    />

                    {/* 9-я армия - 41-й корпус к Коломые */}
                    <Polyline
                      positions={[
                        [48.8, 25.3],
                        [48.67, 25.18],
                        [48.5208, 25.0375]
                      ]}
                      color="#1e40af"
                      weight={5}
                      opacity={0.9}
                    >
                      <Popup>
                        <div style={{ padding: '8px', maxWidth: '280px' }}>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                            41-й корпус: занятие Коломыи, 30 июня
                          </h3>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Армия:</strong> 9-я армия
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Командующий:</strong> Генерал П. А. Лечицкий
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Корпус:</strong> 41-й корпус
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            Продвижение к Карпатам
                          </p>
                        </div>
                      </Popup>
                    </Polyline>
                    <Marker
                      position={[48.5208, 25.0375]}
                      icon={L.divIcon({
                        html: `<div style="transform: rotate(132deg);">
                          <svg width="28" height="28" viewBox="0 -4 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5 L19 12 L8 19 L8 15 L1 15 L1 9 L8 9 Z" fill="#1e40af" stroke="#ffffff" stroke-width="0.5"/>
                          </svg>
                        </div>`,
                        className: 'army-arrow',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                      })}
                    />
                  </>
                )}

                {/* Движения войск */}
                <TroopMovements 
                  movements={movements} 
                  selectedMovement={selectedMovement} 
                  selectedPhase={selectedPhase} 
                />

                {/* Отображение городов */}
                <CityMarkers cities={citiesData.cities || []} selectedPhase={selectedPhase} />

              </MapContainer>



              {/* Кнопка управления легендой */}
              <button
                className="legend-button"
                onClick={() => {
                  setShowLegend(!showLegend);
                  setShowHeader(!showHeader);
                }}
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '24px',
                  background: 'rgba(26, 26, 46, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  zIndex: 1001,
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
                }}
                title={showLegend ? "Скрыть легенду и заголовок" : "Показать легенду и заголовок"}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transition: 'transform 0.3s ease',
                    transform: showLegend ? 'rotate(0deg)' : 'rotate(180deg)'
                  }}
                >
                  {showLegend ? (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="12" x2="15" y2="12" />
                    </>
                  ) : (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="12" x2="15" y2="12" />
                      <line x1="12" y1="9" x2="12" y2="15" />
                    </>
                  )}
                </svg>
              </button>

              {/* Кнопка информации об операции */}
              <button
                className="operation-info-button"
                onClick={() => setShowOperationInfo(true)}
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '80px',
                  background: 'rgba(26, 26, 46, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  zIndex: 1001,
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                title="Информация об операции"
                onMouseEnter={(e) => {
                  if (!e.target.matches(':active')) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(26, 26, 46, 0.9)';
                }}
                onMouseDown={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.transform = 'scale(1)';
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255, 255, 255, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
                  e.target.style.background = 'rgba(26, 26, 46, 0.9)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
              </button>

              {/* Легенда */}
              <div
                className={`legend ${showLegend ? 'show' : 'hide'}`}
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '136px',
                  background: 'rgba(26, 26, 46, 0.9)',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  zIndex: 1000,
                  backdropFilter: 'blur(20px)',
                  maxWidth: '320px'
                }}
              >
                <h3 style={{
                  fontWeight: '600',
                  marginBottom: '16px',
                  margin: '0 0 16px 0',
                  color: '#ffffff',
                  fontSize: '16px',
                  letterSpacing: '0.5px',
                  fontFamily: 'SF Pro Text, Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  Легенда
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '400' }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '24px' }}>
                    <div style={{
                      width: '30px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '26px',
                        height: '4px',
                        backgroundColor: '#dc2626',
                        borderRadius: '2px',
                        background: 'repeating-linear-gradient(90deg, #dc2626 0, #dc2626 8px, transparent 8px, transparent 12px)'
                      }}></div>
                    </div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Фронт на 4 июня 1916</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '24px' }}>
                    <div style={{
                      width: '30px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '26px',
                        height: '4px',
                        backgroundColor: '#22c55e',
                        borderRadius: '2px'
                      }}></div>
                    </div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Фронт на 16 июня 1916</span>
                  </div>



                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '24px' }}>
                    <div style={{
                      width: '30px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '26px',
                        height: '4px',
                        backgroundColor: '#16a34a',
                        borderRadius: '2px',
                        background: 'repeating-linear-gradient(90deg, #16a34a 0, #16a34a 5px, transparent 5px, transparent 8px)'
                      }}></div>
                    </div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Финальная линия фронта</span>
                  </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '24px' }}>
                <div style={{ 
                  width: '30px', 
                  height: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <div style={{ 
                    width: '20px', 
                    height: '4px', 
                    backgroundColor: '#1e40af', 
                    borderRadius: '2px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '0',
                      height: '0',
                      borderLeft: '4px solid #1e40af',
                      borderTop: '3px solid transparent',
                      borderBottom: '3px solid transparent',
                      position: 'absolute',
                      right: '-4px',
                      top: '-1px'
                    }}></div>
                  </div>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Русские войска</span>
              </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '24px' }}>
                    <div style={{
                      width: '30px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        border: '2px solid rgba(34, 197, 94, 0.8)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}></div>
                    </div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Захваченные города</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '24px' }}>
                    <div style={{
                      width: '30px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#dc2626',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                      }}></div>
                    </div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Незахваченные города</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '24px' }}>
                    <div style={{ 
                      width: '30px', 
                      height: '24px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{ 
                        width: '20px', 
                        height: '4px', 
                        backgroundColor: '#dc2626', 
                        borderRadius: '2px',
                        position: 'relative',
                        background: 'repeating-linear-gradient(90deg, #dc2626 0, #dc2626 4px, transparent 4px, transparent 6px)'
                      }}>
                        <div style={{
                          width: '0',
                          height: '0',
                          borderLeft: '4px solid #dc2626',
                          borderTop: '3px solid transparent',
                          borderBottom: '3px solid transparent',
                          position: 'absolute',
                          right: '-4px',
                          top: '-1px'
                        }}></div>
                      </div>
                    </div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Контрудар врага</span>
                  </div>

                </div>
              </div>

              {/* Панель управления */}
              <div style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(26, 26, 46, 0.9)',
                padding: '16px 24px',
                borderRadius: '24px',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 1000,
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                {/* Выбор хода операции */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="control-element"
                    style={{
                      background: 'rgba(26, 26, 46, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '500',
                      outline: 'none',
                      letterSpacing: '0.5px',
                      fontFamily: 'SF Pro Text, Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                      cursor: 'pointer',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
                      transition: 'all 0.3s ease',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      minWidth: '280px'
                    }}
                  >
                    {operationPhases.map(phase => (
                      <option key={phase.value} value={phase.value} style={{ backgroundColor: '#1a1a2e', color: '#ffffff' }}>
                        {phase.label}
                      </option>
                    ))}
                  </select>
                </div>




              </div>
            </div>
          </div>
        </div>
      )}



      {selectedRiver && (
        <div
          className={`modal-overlay ${isRiverModalClosing ? 'closing' : ''}`}
          onClick={handleRiverOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}
        >
          <div
            className={`modal-content ${isRiverModalClosing ? 'closing' : ''}`}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: '24px',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '70vh',
              overflow: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', color: 'white' }}>{selectedRiver?.name || 'Неизвестная река'}</h2>
              <button
                onClick={closeRiverModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  color: '#d1d5db'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: 'white' }}>Тип:</strong> <span style={{ color: '#d1d5db' }}>
                {selectedRiver?.type === 'estuary' ? 'Устье реки' : 'Река'}
              </span>
            </div>

            {selectedRiver?.river_type && (
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'white' }}>Водный объект:</strong> <span style={{ color: '#d1d5db' }}>{selectedRiver.river_type}</span>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: 'white' }}>Описание:</strong>
              <p style={{ margin: '8px 0 0 0', color: '#d1d5db', lineHeight: '1.6' }}>
                {selectedRiver?.description || 'Водный объект на территории Брусиловского прорыва'}
              </p>
            </div>

            {selectedRiver?.strategic_importance && (
              <div style={{ marginBottom: '20px' }}>
                <strong style={{ color: 'white' }}>Стратегическое значение:</strong>
                <p style={{ margin: '8px 0 0 0', color: '#d1d5db', lineHeight: '1.6' }}>
                  {selectedRiver.strategic_importance}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно с информацией об операции */}
      {showOperationInfo && (
        <div
          className={`modal-overlay ${isOperationInfoClosing ? 'closing' : ''}`}
          onClick={handleOperationInfoOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
          }}
        >
          <div
            className={`modal-content ${isOperationInfoClosing ? 'closing' : ''}`}
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.95)',
              padding: '32px',
              borderRadius: '20px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '28px', 
                  color: '#ffffff',
                  fontWeight: '700',
                  letterSpacing: '-0.5px'
                }}>
                  {operationInfo[selectedPhase]?.title || 'Информация об операции'}
                </h2>
                <p style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500'
                }}>
                  {operationInfo[selectedPhase]?.subtitle}
                </p>
              </div>
              <button
                onClick={closeOperationInfoModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  width: '40px',
                  height: '40px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                title="Закрыть"
              >
                ×
              </button>
            </div>

            <div style={{ 
              fontSize: '16px', 
              color: 'rgba(255, 255, 255, 0.9)', 
              lineHeight: '1.6',
              fontFamily: 'SF Pro Text, Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              <div style={{ whiteSpace: 'pre-line' }}>
                {operationInfo[selectedPhase]?.content || 'Информация временно недоступна.'}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}