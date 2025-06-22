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
const TroopMovements = ({ movements, selectedMovement }) => {
  return movements.map((movement) => {
    const isSelected = selectedMovement?.id === movement.id;
    return (
      <React.Fragment key={movement.id}>
        <Polyline
          positions={movement.path}
          color={isSelected ? '#1e40af' : '#3b82f6'}
          weight={isSelected ? 6 : 4}
          opacity={isSelected ? 1 : 0.7}
          dashArray={isSelected ? null : '10, 10'}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg mb-2">{movement.name}</h3>
              <p><strong>Армия:</strong> {movement.army}</p>
              <p><strong>Численность:</strong> {movement.strength}</p>
              <p><strong>Период:</strong> {movement.period}</p>
            </div>
          </Popup>
        </Polyline>
        {/* Стрелка в конце линии */}
        <Marker
          position={movement.path[movement.path.length - 1]}
          icon={L.divIcon({
            html: `<div style="transform: rotate(${getArrowRotation(movement.path)}deg);">
              <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2 L22 12 L12 22 L12 16 L2 16 L2 8 L12 8 Z" fill="${isSelected ? '#1e40af' : '#3b82f6'}"/>
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
    }, 1000);
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
          <h1 className="intro-title">БРУСИЛОВСКИЙ ПРОРЫВ</h1>
          <p className="intro-subtitle">Июнь 1916 г.</p>
          <div className={`intro-button-container ${showText ? 'show' : ''}`}>
            <button 
              className="intro-start-button"
              onClick={handleStartClick}
            >
              СТАРТ
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
  const [showInitialFront, setShowInitialFront] = useState(true);
  const [showFinalFront, setShowFinalFront] = useState(true);
  const [mapLayer, setMapLayer] = useState('modern');
  const [showIntro, setShowIntro] = useState(true);
  const [showMainContent, setShowMainContent] = useState(false);
  
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

  const tileLayers = {
    modern: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    historical: brusilovData.map_config.historical_map_url
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#111827', margin: 0, padding: 0, overflow: 'hidden' }}>
      {showIntro ? (
        <IntroComponent onComplete={() => {
          setShowIntro(false);
          setTimeout(() => {
            setShowMainContent(true);
          }, 200);
        }} />
      ) : (
        <div className={`main-content ${showMainContent ? 'show' : ''}`}>
          <header style={{ backgroundColor: '#111827', color: 'white', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>Брусиловский прорыв 1916 года</h1>
            <p style={{ textAlign: 'center', marginTop: '8px', color: '#d1d5db', margin: '8px 0 0 0' }}>Интерактивная карта крупнейшей операции Первой мировой войны</p>
          </header>

          <div style={{ flex: 1, width: '100%', height: '100%', padding: '20px', boxSizing: 'border-box' }}>
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
              showInitial={showInitialFront}
              showFinal={showFinalFront}
            />
            <TroopMovements
              movements={brusilovData.troop_movements}
              selectedMovement={selectedMovement}
            />
            <BattleMarkers
              battles={brusilovData.battles}
              onBattleClick={setSelectedBattle}
            />
            <CityMarkers cities={brusilovData.cities} />
            <Rivers rivers={brusilovData.rivers} onRiverClick={setSelectedRiver} />
          </MapContainer>

          {/* Легенда */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '16px 20px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            maxWidth: '320px'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px', margin: '0 0 12px 0', color: 'white', fontSize: '16px' }}>Легенда</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'white' }}>
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
                <span style={{ color: 'white', lineHeight: '1.2' }}>Крупные сражения</span>
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
                <span style={{ color: 'white', lineHeight: '1.2' }}>Направления наступления</span>
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
                <span style={{ color: 'white', lineHeight: '1.2' }}>Начальная линия фронта</span>
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
                <span style={{ color: 'white', lineHeight: '1.2' }}>Конечная линия фронта</span>
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
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'black', border: '2px solid white' }}></div>
                </div>
                <span style={{ color: 'white', lineHeight: '1.2' }}>Крупные города</span>
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
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#333333', border: '2px solid white' }}></div>
                </div>
                <span style={{ color: 'white', lineHeight: '1.2' }}>Важные города</span>
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
                   <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#6b7280', border: '1px solid white' }}></div>
                 </div>
                 <span style={{ color: 'white', lineHeight: '1.2' }}>Города</span>
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
                   <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#4A90E2', border: '2px solid white' }}></div>
                 </div>
                 <span style={{ color: 'white', lineHeight: '1.2' }}>Устья рек</span>
               </div>
            </div>
          </div>

          {/* Пилюля с элементами управления */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '12px 24px',
            borderRadius: '50px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            {/* Выбор карты */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={mapLayer}
                onChange={(e) => setMapLayer(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="modern" style={{ backgroundColor: '#333', color: 'white' }}>Современная карта</option>
                <option value="historical" style={{ backgroundColor: '#333', color: 'white' }}>Историческая карта</option>
              </select>
            </div>

            {/* Разделитель */}
            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.3)' }}></div>

            {/* Линии фронта */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showInitialFront}
                  onChange={(e) => setShowInitialFront(e.target.checked)}
                  style={{ accentColor: '#dc2626' }}
                />
                <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>4 июня</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showFinalFront}
                  onChange={(e) => setShowFinalFront(e.target.checked)}
                  style={{ accentColor: '#16a34a' }}
                />
                <span style={{ color: '#16a34a', fontSize: '14px', fontWeight: '500' }}>20 сентября</span>
              </label>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={closeBattleModal}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                Закрыть
              </button>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={closeRiverModal}
                style={{
                  backgroundColor: '#4A90E2',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#357ABD'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4A90E2'}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}