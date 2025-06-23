import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import brusilovData from './brusilovData.json';
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

// Компонент для отображения сражений
const BattleMarkers = ({ battles, onBattleClick }) => {
  return battles.map((battle) => (
    <Marker
      key={battle.id}
      position={battle.coordinates}
      icon={createCustomIcon('#c41e3a', [35, 45])}
      eventHandlers={{
        click: () => onBattleClick(battle)
      }}
    >
      <Tooltip permanent={false} direction="top" offset={[0, -20]}>
        <div className="font-bold">{battle.name}</div>
        <div className="text-sm">{battle.date}</div>
      </Tooltip>
    </Marker>
  ));
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
const FrontLines = ({ frontLines, showInitial, showFinal }) => {
  return frontLines.map((frontLine) => {
    if (frontLine.type === 'initial' && !showInitial) return null;
    if (frontLine.type === 'final' && !showFinal) return null;

    return (
      <Polyline
        key={frontLine.id}
        positions={frontLine.coordinates}
        color={frontLine.type === 'initial' ? '#dc2626' : '#16a34a'}
        weight={3}
        opacity={0.8}
        dashArray={frontLine.type === 'initial' ? '15, 10' : null}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold">{frontLine.name}</h3>
            <p>{frontLine.date}</p>
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
const CityMarkers = ({ cities }) => {
  const getCityIcon = (importance) => {
    const size = importance === 'major' ? [18, 18] : importance === 'strategic' ? [14, 14] : importance === 'regional' ? [12, 12] : [10, 10];
    const color = importance === 'major' ? '#000000' : importance === 'strategic' ? '#333333' : '#666666';

    return L.divIcon({
      html: `<div style="background: ${color}; width: ${size[0]}px; height: ${size[1]}px; border-radius: 50%; border: 2px solid white;"></div>`,
      className: 'city-marker',
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1] / 2]
    });
  };

  return cities.map((city) => (
    <Marker
      key={city.id}
      position={city.coordinates}
      icon={getCityIcon(city.importance)}
    >
      <Tooltip permanent={true} direction="top" offset={[0, -10]} className="city-tooltip">
        <div className="text-xs font-semibold">{city.name}</div>
      </Tooltip>
    </Marker>
  ));
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
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [selectedRiver, setSelectedRiver] = useState(null);


  const [showLegend, setShowLegend] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [showMainContent, setShowMainContent] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('');
  
  // Фазы операции для выпадающего списка
  const operationPhases = [
    { value: '', label: 'Все ходы операции' },
    { value: 'lutsk_breakthrough', label: '1. «Луцкий» прорыв (4-15 июня)' },
    { value: 'kovel_offensive', label: '2. Наступление на Ковель (5-14 июля)' },
    { value: 'july_august_offensive', label: '3. Июль-августовское наступление (28 июля – 5 сентября)' },
    { value: 'september_battles', label: '4. Заключительные бои сентября (6-20 сентября)' }
  ];
  
  // Состояния для анимаций модальных окон
  const [isBattleModalClosing, setIsBattleModalClosing] = useState(false);
  const [isRiverModalClosing, setIsRiverModalClosing] = useState(false);

  // Функции для плавного закрытия модальных окон
  const closeBattleModal = () => {
    setIsBattleModalClosing(true);
    setTimeout(() => {
      setSelectedBattle(null);
      setIsBattleModalClosing(false);
    }, 300); // Время анимации
  };

  const closeRiverModal = () => {
    setIsRiverModalClosing(true);
    setTimeout(() => {
      setSelectedRiver(null);
      setIsRiverModalClosing(false);
    }, 300); // Время анимации
  };

  // Обработчики для закрытия модальных окон кликом по overlay
  const handleBattleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeBattleModal();
    }
  };

  const handleRiverOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeRiverModal();
    }
  };

  // Обработчик для закрытия модальных окон клавишей Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (selectedBattle && !isBattleModalClosing) {
          closeBattleModal();
        } else if (selectedRiver && !isRiverModalClosing) {
          closeRiverModal();
        }
      }
    };

    if (selectedBattle || selectedRiver) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedBattle, selectedRiver, isBattleModalClosing, isRiverModalClosing]);

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
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <FrontLines
              frontLines={brusilovData.front_lines}
              showInitial={true}
              showFinal={true}
            />
            <TroopMovements
              movements={brusilovData.troop_movements}
              selectedMovement={selectedMovement}
              selectedPhase={selectedPhase}
            />
            <BattleMarkers
              battles={brusilovData.battles}
              onBattleClick={setSelectedBattle}
            />
            <CityMarkers cities={brusilovData.cities} />
            <Rivers rivers={brusilovData.rivers} onRiverClick={setSelectedRiver} />
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="12" x2="15" y2="12"/>
                </>
              ) : (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="12" x2="15" y2="12"/>
                  <line x1="12" y1="9" x2="12" y2="15"/>
                </>
              )}
            </svg>
          </button>

          {/* Легенда */}
          <div 
            className={`legend ${showLegend ? 'show' : 'hide'}`}
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '80px',
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
                  <svg width="18" height="22" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z" fill="#c41e3a" />
                    <circle cx="12" cy="12" r="4" fill="white" />
                  </svg>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Крупные сражения</span>
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
                  <div style={{ width: '26px', height: '6px', backgroundColor: '#1e40af', borderRadius: '2px' }}></div>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Главные удары</span>
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
                  <div style={{ width: '26px', height: '4px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Успешные наступления</span>
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
                    backgroundColor: '#f59e0b', 
                    borderRadius: '2px',
                    background: 'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 6px, transparent 6px, transparent 10px)'
                  }}></div>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Остановленные атаки</span>
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
                    backgroundColor: '#dc2626', 
                    borderRadius: '2px',
                    background: 'repeating-linear-gradient(90deg, #dc2626 0, #dc2626 4px, transparent 4px, transparent 8px)'
                  }}></div>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Контрудары противника</span>
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
                    backgroundColor: '#dc2626', 
                    borderRadius: '2px',
                    background: 'repeating-linear-gradient(90deg, #dc2626 0, #dc2626 8px, transparent 8px, transparent 12px)'
                  }}></div>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Начальная линия фронта</span>
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
                  <div style={{ width: '26px', height: '4px', backgroundColor: '#16a34a', borderRadius: '2px' }}></div>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Конечная линия фронта</span>
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
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'black', border: '2px solid rgba(255, 255, 255, 0.6)' }}></div>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Крупные города</span>
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
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#333333', border: '2px solid rgba(255, 255, 255, 0.4)' }}></div>
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Важные города</span>
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
                   <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6b7280', border: '1px solid rgba(255, 255, 255, 0.3)' }}></div>
                 </div>
                 <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Города</span>
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
                   <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#4A90E2', border: '2px solid rgba(255, 255, 255, 0.4)' }}></div>
                 </div>
                 <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Устья рек</span>
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

      {selectedBattle && (
        <div 
          className={`modal-overlay ${isBattleModalClosing ? 'closing' : ''}`}
          onClick={handleBattleOverlayClick}
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
            className={`modal-content ${isBattleModalClosing ? 'closing' : ''}`}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: '24px',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', color: 'white' }}>{selectedBattle?.name || 'Неизвестное сражение'}</h2>
              <button
                onClick={closeBattleModal}
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
              <strong style={{ color: 'white' }}>Дата:</strong> <span style={{ color: '#d1d5db' }}>{selectedBattle?.date || 'Неизвестно'}</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: 'white' }}>Описание:</strong>
              <p style={{ margin: '8px 0 0 0', color: '#d1d5db', lineHeight: '1.6' }}>
                {selectedBattle?.description || 'Описание недоступно'}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: 'white' }}>Результат:</strong>
              <p style={{ margin: '8px 0 0 0', color: '#d1d5db', lineHeight: '1.6' }}>
                {selectedBattle?.result || 'Результат неизвестен'}
              </p>
            </div>

            {selectedBattle?.participants && (
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'white' }}>Участники:</strong>
                <div style={{
                  marginTop: '8px',
                  display: 'grid',
                  gridTemplateColumns: selectedBattle.participants.enemy ? '1fr 1fr' : '1fr',
                  gap: '16px'
                }}>
                  {selectedBattle.participants.russian && (
                    <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.15)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#22c55e', fontSize: '16px' }}>Русские войска</h4>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#d1d5db' }}>
                        <strong>Армия:</strong> {selectedBattle.participants.russian.army}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#d1d5db' }}>
                        <strong>Командующий:</strong> {selectedBattle.participants.russian.commander}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#d1d5db' }}>
                        <strong>Численность:</strong> {selectedBattle.participants.russian.strength}
                      </p>
                    </div>
                  )}
                  {selectedBattle.participants.enemy && (
                    <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '16px' }}>Противник</h4>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#d1d5db' }}>
                        <strong>Армия:</strong> {selectedBattle.participants.enemy.army}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#d1d5db' }}>
                        <strong>Командующий:</strong> {selectedBattle.participants.enemy.commander}
                      </p>
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#d1d5db' }}>
                        <strong>Численность:</strong> {selectedBattle.participants.enemy.strength}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedBattle?.significance && (
              <div style={{ marginBottom: '20px' }}>
                <strong style={{ color: 'white' }}>Значение:</strong>
                <p style={{ margin: '8px 0 0 0', color: '#d1d5db', lineHeight: '1.6' }}>
                  {selectedBattle.significance}
                </p>
              </div>
            )}
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
    </div>
  );
}