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
        {/* Стрелка в начале или конце линии */}
        <Marker
          position={movement.id === 'fourth_kovel_battle_bypass_south' || movement.id === 'fifth_kovel_battle_special_army_vladimir' ? movement.path[movement.path.length - 1] : movement.path[0]}
          icon={L.divIcon({
            html: `<div style="transform: rotate(${
              180 + // Глобальный поворот на 180 градусов для всех стрелок
              (movement.id === 'fourth_kovel_battle_bypass_south' || movement.id === 'fifth_kovel_battle_special_army_vladimir' ? getArrowRotationEnd(movement.path) : getArrowRotation(movement.path)) +
              (movement.id === '8th_army_lutsk_kovel' ? 180 : 0) +
              (movement.id === 'first_kovel_battle_selec' || movement.id === 'first_kovel_battle_tristen' || 
                movement.id === 'first_kovel_battle_koshevo' || movement.id === 'first_kovel_battle_torchin' ||
                movement.id === 'first_kovel_battle_brody' || movement.id === 'first_kovel_battle_halych' ||
                movement.id === 'first_kovel_battle_monastyryska' || movement.id === 'first_kovel_battle_stanislau' ||
                movement.id === 'second_kovel_battle_bolshoy_porsk' || movement.id === 'third_kovel_battle_shelvo' ||
                movement.id === 'third_kovel_battle_bubnov' || movement.id === 'third_kovel_battle_korytnica' ? 180 : 0) +
              (movement.id === 'second_kovel_battle_velitsk_guard' ? -90 : 0) +
              (movement.id === 'third_kovel_battle_assault_corps' ? 180 : 0) +
              (movement.operation_phase === 'halych_offensive' ? 90 : 0) +
              (movement.id === 'halych_offensive_german_counterattack_3' ? -90 : 0) +
              (movement.id === 'fourth_kovel_battle_korytnica_success' || movement.id === 'fourth_kovel_battle_svinyukhy_success' ? 90 : 0) +
              (movement.arrow_type === 'counterattack' ? 90 : 0) +
              (movement.id === 'army_offensive_8th_grubeshov' || movement.id === 'army_offensive_11th_lviv' ? 180 : 0)
            }deg);">
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
  const firstTwo = path.slice(0, 2);
  const dx = firstTwo[1][1] - firstTwo[0][1];
  const dy = firstTwo[1][0] - firstTwo[0][0];
  return Math.atan2(dx, -dy) * (180 / Math.PI);
};

// Функция для расчета угла поворота стрелки в конце линии
const getArrowRotationEnd = (path) => {
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
    } else if (selectedPhase === 'kovel_battles') {
      // Показываем все линии фронта для Ковельских сражений
      shouldShow = true;
    } else if (selectedPhase === 'halych_offensive') {
      // Показываем все линии фронта для наступления на Галич
      shouldShow = true;
    } else if (selectedPhase === 'fourth_kovel_battle') {
      // Показываем все линии фронта для четвертого Ковельского сражения
      shouldShow = true;
    } else if (selectedPhase === 'fifth_kovel_battle') {
      // Показываем все линии фронта для пятого Ковельского сражения
      shouldShow = true;
    } else {
      // Для остальных фаз показываем все
      shouldShow = true;
    }

    if (!shouldShow) return null;

    // Определяем цвет и стиль линии
    let color = '#dc2626'; // красный для начальной
    let dashArray = null;

    if (frontLine.id === 'july_14_front') {
      color = '#f97316'; // оранжевый для линии 14 июля
      dashArray = null;
    } else if (frontLine.type === 'initial') {
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
    const kovelStrikeCities = ['manevychi', 'gorodok', 'galuzia', 'baranovichi', 'lyubeshov', 'brody'];
    if (kovelStrikeCities.includes(id)) {
      if (selectedPhase === 'kovel_strike' || selectedPhase === 'kovel_battles' || selectedPhase === 'halych_offensive' || selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true; // Показываем как захваченные в фазах "Удар на Ковель", "Ковельские сражения", "Наступление на Галич", "Четвертое Ковельское Сражение", "Пятое Ковельское сражение" и "Все ходы"
      } else {
        isCaptured = false; // В остальных фазах показываем как незахваченные
      }
    }

    // Специальная логика для городов, захваченных в Ковельских сражениях
    const kovelBattlesCities = ['selec', 'tristen', 'koshevo', 'torchin', 'monastyryska', 'stanislau'];
    if (kovelBattlesCities.includes(id)) {
      if (selectedPhase === 'kovel_battles' || selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true; // Показываем как захваченные в фазах "Ковельские сражения", "Четвертое Ковельское Сражение", "Пятое Ковельское сражение" и "Все ходы"
      } else {
        isCaptured = false; // В остальных фазах показываем как незахваченные
      }
    }

    // Специальная логика для городов, захваченных в Четвертом Ковельском сражении
    const fourthKovelBattleCities = ['korytnica', 'svinyukhy'];
    if (fourthKovelBattleCities.includes(id)) {
      if (selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true; // Показываем как захваченные в фазах "Четвертое Ковельское Сражение", "Пятое Ковельское сражение" и "Все ходы"
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

    const kovelStrikeCities = ['manevychi', 'gorodok', 'galuzia', 'baranovichi', 'lyubeshov'];
    if (kovelStrikeCities.includes(city.id)) {
      if (selectedPhase === 'kovel_strike' || selectedPhase === 'kovel_battles' || selectedPhase === 'halych_offensive' || selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true;
        captureDate = '22 июня (5 июля) 1916';
        captureArmy = '8-я и 3-я армии';
      } else {
        isCaptured = false;
        captureDate = null;
        captureArmy = '';
      }
    }

    // Специальная логика для города Броды, захваченного в ударе на Ковель
    if (city.id === 'brody') {
      if (selectedPhase === 'kovel_strike' || selectedPhase === 'kovel_battles' || selectedPhase === 'halych_offensive' || selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true;
        captureDate = '22 июня (5 июля) 1916';
        captureArmy = '11-я армия';
      } else {
        isCaptured = false;
        captureDate = null;
        captureArmy = '';
      }
    }

    // Специальная логика для городов, захваченных Особой армией в Ковельских сражениях
    const kovelBattlesSpecialArmy = ['selec', 'tristen'];
    if (kovelBattlesSpecialArmy.includes(city.id)) {
      if (selectedPhase === 'kovel_battles' || selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true;
        captureDate = '15 (28) июля 1916';
        captureArmy = 'Особая армия';
      } else {
        isCaptured = false;
        captureDate = null;
        captureArmy = '';
      }
    }

    // Специальная логика для городов, захваченных 8-й армией в Ковельских сражениях
    const kovelBattles8thArmy = ['koshevo', 'torchin'];
    if (kovelBattles8thArmy.includes(city.id)) {
      if (selectedPhase === 'kovel_battles' || selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true;
        captureDate = '15 (28) июля 1916';
        captureArmy = '8-я армия';
      } else {
        isCaptured = false;
        captureDate = null;
        captureArmy = '';
      }
    }

    // Специальная логика для городов, захваченных 7-й армией в Ковельских сражениях
    const kovelBattles7thArmy = ['monastyryska'];
    if (kovelBattles7thArmy.includes(city.id)) {
      if (selectedPhase === 'kovel_battles' || selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true;
        captureDate = '15 (28) июля 1916';
        captureArmy = '7-я армия';
      } else {
        isCaptured = false;
        captureDate = null;
        captureArmy = '';
      }
    }

    // Специальная логика для городов, захваченных 9-й армией в Ковельских сражениях
    const kovelBattles9thArmy = ['stanislau'];
    if (kovelBattles9thArmy.includes(city.id)) {
      if (selectedPhase === 'kovel_battles' || selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true;
        captureDate = '11 августа 1916';
        captureArmy = '9-я армия (ген. П. А. Лечицкий)';
      } else {
        isCaptured = false;
        captureDate = null;
        captureArmy = '';
      }
    }

    // Специальная логика для городов, захваченных в Четвертом Ковельском сражении
    if (city.id === 'korytnica') {
      if (selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true;
        captureDate = 'сентябрь - октябрь 1916';
        captureArmy = '8-й армейский корпус';
      } else {
        isCaptured = false;
        captureDate = null;
        captureArmy = '';
      }
    }

    if (city.id === 'svinyukhy') {
      if (selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true;
        captureDate = 'сентябрь - октябрь 1916';
        captureArmy = '1-й гвардейский корпус';
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

    // Показать текст через 1.5 секунды
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 1500);

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
              <span>Начать исследование</span>
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
    { value: 'kovel_strike', label: 'Удар на Ковель' },
    { value: 'kovel_battles', label: '1-3 Ковельские Сражения' },
    { value: 'halych_offensive', label: 'Наступление на Галич' },
    { value: 'fourth_kovel_battle', label: 'Четвертое Ковельское Сражение' },
    { value: 'fifth_kovel_battle', label: 'Пятое Ковельское сражение' }
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
        [51.292, 25.531], // Маневичи
        [51.406, 25.9108] // Начальная позиция с востока от Маневичей
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
        [51.370, 25.478], // Городок
        [51.590, 25.671] // Начальная позиция с востока от Городка
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
        [51.402, 25.597], // Галузия
        [51.551, 25.801] // Начальная позиция с востока от Галузии
      ],
      operation_phase: 'kovel_strike',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'western_front_baranovichi',
      name: 'Наступление на Барановичи',
      army: 'Западный фронт',
      commander: 'А. Е. Эверта',
      strength: 'Ударная группировка',
      period: '3 июля 1916',
      description: 'Западный фронт попытался перейти ударной группировкой в наступление на Барановичи.',
      path: [
        [53.13674031131521, 26.043097704371075], // Барановичи
        [53.308171320764124, 27.240607469996053] // Начальная позиция
      ],
      operation_phase: 'kovel_strike',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: '3rd_special_army_kovel',
      name: 'Наступление 3-й и Особой армий на Ковель',
      army: '3-я армия и Особая армия',
      commander: '3-я армия (с Западного фронта) и Особая армия',
      strength: '3-я армия и Особая армия (из стратегического резерва)',
      period: 'июль 1916',
      description: 'От позиций 3-й русской армии (переданной с Западного фронта) и Особой армии (созданной в июле из стратегического резерва) — на Ковель.',
      path: [
        [51.24228636424136, 24.76597116918847],
        [51.4280975853997, 25.397685036375982],
        [51.47700490305248, 25.881083473875982]
      ],
      operation_phase: 'kovel_strike',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: '8th_army_lutsk_kovel',
      name: 'Главный удар 8-й армии от Луцка на Ковель',
      army: '8-я армия',
      commander: 'Генерал А.М. Каледин',
      strength: '8-я армия',
      period: 'после 7 июня 1916',
      description: 'От района Луцка (который был взят 8-й русской армией А.М. Каледина 7 июня) — на северо-запад, прямо на Ковель. Главный удар 8-й армии.',
      path: [
        [51.166875755001044, 24.747325772528892],
        [50.842823056652165, 25.227977627997646]
      ],
      operation_phase: 'kovel_strike',
      is_enemy: false,
      arrow_type: 'wide'
    },
    {
      id: 'first_kovel_battle_selec',
      name: '1-е Ковельское сражение: направление на Селец',
      army: 'Особая армия',
      commander: 'Юго-Западный фронт (А. А. Брусилов)',
      strength: 'Особая армия',
      period: '15 (28) июля 1916',
      description: 'Особая армия одержала победу у местечка Селец в ходе Первого Ковельского сражения.',
      path: [
        [51.11510126681912,24.61571015637205],
        [51.10818567507992,24.926073925903303]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'first_kovel_battle_tristen',
      name: '1-е Ковельское сражение: направление на Трыстень',
      army: 'Особая армия',
      commander: 'Юго-Западный фронт (А. А. Брусилов)',
      strength: 'Особая армия',
      period: '15 (28) июля 1916',
      description: 'Особая армия одержала победу у местечка Трыстень в ходе Первого Ковельского сражения.',
      path: [
        [50.92941491924978, 24.946316968749084],
        [50.92116940551891, 25.218228589842848]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'first_kovel_battle_koshevo',
      name: '1-е Ковельское сражение: атака на Кошево',
      army: '8-я армия',
      commander: 'Генерал А.М. Каледин',
      strength: '8-я армия',
      period: '15 (28) июля 1916',
      description: '8-я армия одолела врага у Кошева в ходе Первого Ковельского сражения.',
      path: [
        [50.704829662583684, 24.906260866055774],
        [50.683458865184384, 25.201518434415153]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'first_kovel_battle_torchin',
      name: '1-е Ковельское сражение: атака на Торчин',
      army: '8-я армия',
      commander: 'Генерал А.М. Каледин',
      strength: '8-я армия',
      period: '15 (28) июля 1916',
      description: '8-я армия взяла Торчин в ходе Первого Ковельского сражения.',
      path: [
        [50.7646866060992, 25.01389247077463],
        [50.7612026440575, 25.196883498606677]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'first_kovel_battle_brody',
      name: '1-е Ковельское сражение: наступление на Броды',
      army: '11-я армия',
      commander: '11-я армия',
      strength: '11-я армия',
      period: '15 (28) июля 1916',
      description: '11-я армия наступала на Броды в ходе Первого Ковельского сражения.',
      path: [
        [50.081743759874854, 25.145775314819318],
        [50.11001307631964, 25.43965959216307]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'first_kovel_battle_halych',
      name: '1-е Ковельское сражение: наступление на Галич',
      army: '7-я армия',
      commander: '7-я армия',
      strength: '7-я армия',
      period: '15 (28) июля 1916',
      description: '7-я армия овладела городом Галич в ходе Первого Ковельского сражения.',
      path: [
        [49.12966301533356, 24.74997493664553],
        [49.13326770457837, 25.001470456068752]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'first_kovel_battle_monastyryska',
      name: '1-е Ковельское сражение: наступление на Монастыриска',
      army: '7-я армия',
      commander: '7-я армия',
      strength: '7-я армия',
      period: '15 (28) июля 1916',
      description: '7-я армия овладела городом Монастыриска в ходе Первого Ковельского сражения.',
      path: [
        [49.09134691118318, 25.196477780287488],
        [49.10442280928764, 25.398351559584366]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'first_kovel_battle_stanislau',
      name: '1-е Ковельское сражение: наступление на Станислав',
      army: '9-я армия',
      commander: 'Генерал П. А. Лечицкий',
      strength: '9-я армия',
      period: '11 августа 1916',
      description: '9-я армия (генерал П. А. Лечицкий) успешно заняла Станислав (Ивано-Франковск) 11 августа.',
      path: [
        [48.92556971762826, 24.783117184584377],
        [48.89931978848843, 25.25552929395937]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'second_kovel_battle_bolshoy_porsk',
      name: '2-е Ковельское сражение: наступление на Большой Порск',
      army: '1-й армейский корпус',
      commander: 'Генерал А. А. Брусилов',
      strength: '1-й армейский корпус',
      period: '26 июля (8 августа) 1916',
      description: '1-й армейский корпус наступал на Большой Порск, но был отброшен.',
      path: [
        [51.076843803277114, 25.168553770019503],
        [51.06191835335807, 25.420552671386687]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'second_kovel_battle_velitsk_guard',
      name: '2-е Ковельское сражение: атака гвардии от Велицка',
      army: 'Гвардия',
      commander: 'Генерал А. А. Брусилов',
      strength: 'Гвардейские части',
      period: '26 июля (8 августа) 1916',
      description: 'Гвардия атаковала от Велицка в направлении к юго-западу от Кухарского леса, но была отброшена после неудачи 1-го армейского корпуса.',
      path: [
        [51.094347846815346, 25.19051930151366],
        [51.118555150911845, 25.19807240209961]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'third_kovel_battle_assault_corps',
      name: '3-е Ковельское сражение: ударные корпуса 8-й армии',
      army: '8-я армия (ударные корпуса)',
      commander: 'Западный фронт (А. Е. Эверт)',
      strength: 'Ударные корпуса 8-й армии',
      period: 'август 1916',
      description: 'Целью по-прежнему был Ковель, но Западный фронт под командованием Эверта не выполнил поставленную задачу.',
      path: [
        [51.20814078179218, 24.728063552001945],
        [51.132166158927895, 24.833806960205074]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'third_kovel_battle_shelvo',
      name: '3-е Ковельское сражение: наступление на Шельвов',
      army: 'Ударные корпуса 8-й армии',
      commander: 'Западный фронт (А. Е. Эверт)',
      strength: 'Ударные корпуса 8-й армии',
      period: 'август 1916',
      description: 'Ударные корпуса 8-й армии пытались занять деревню Шельвов и 1-2 линии неприятельских окопов.',
      path: [
        [50.71505579033239, 24.7930984180907],
        [50.67580438931161, 24.907081572387593]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'third_kovel_battle_bubnov',
      name: '3-е Ковельское сражение: наступление на Бубнов',
      army: 'Ударные корпуса 8-й армии',
      commander: 'Западный фронт (А. Е. Эверт)',
      strength: 'Ударные корпуса 8-й армии',
      period: 'август 1916',
      description: 'Ударные корпуса 8-й армии пытались занять деревню Бубнов и 1-2 линии неприятельских окопов.',
      path: [
        [50.658330481147786, 24.84848233248863],
        [50.65352902648121, 24.956972322723008]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'third_kovel_battle_korytnica',
      name: '3-е Ковельское сражение: наступление на Корытницу',
      army: 'Ударные корпуса 8-й армии',
      commander: 'Западный фронт (А. Е. Эверт)',
      strength: 'Ударные корпуса 8-й армии',
      period: 'август 1916',
      description: 'Ударные корпуса 8-й армии пытались занять деревню Корытница и 1-2 линии неприятельских окопов.',
      path: [
        [50.62499874950922, 24.818009195922826],
        [50.60621323096069, 24.96357804357907]
      ],
      operation_phase: 'kovel_battles',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'halych_offensive_8th_army_vladimir',
      name: 'Наступление на Владимир-Волынский',
      army: '8-я армия',
      commander: 'Генерал А.М. Каледин',
      strength: '8-я армия',
      period: '18 (31) августа 1916',
      description: '8-й армии надлежало атаковать на Владимир-Волынский в рамках общего наступления Юго-Западного фронта.',
      path: [
        [50.84521405627265, 24.315699583411416],
        [50.843800278090406, 24.346593801757788],
        [50.83119115656848, 24.560140554687482]
      ],
      operation_phase: 'halych_offensive',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'halych_offensive_11th_army_berezhany',
      name: 'Наступление на Бережаны',
      army: '11-я армия',
      commander: '11-я армия',
      strength: '11-я армия',
      period: '18 (31) августа 1916',
      description: '11-й армии — наступать на Бережаны в рамках общего наступления Юго-Западного фронта.',
      path: [
        [49.448322222772546, 24.939362609677953],
        [49.449538168422826, 24.96271624649289],
        [49.47057420320909, 25.15909686172727]
      ],
      operation_phase: 'halych_offensive',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'halych_offensive_7th_army_halych',
      name: 'Наступление на Галич',
      army: '7-я армия',
      commander: 'Генерал Щербачёв',
      strength: '7-я армия (усиленная 33-м и 41-м корпусами)',
      period: '18 (31) августа 1916',
      description: '7-й армии (усиленной 33-м и 41-м корпусами) — наступать на Галич. Непосредственно на Галич наступала 7-я армия под командованием генерала Щербачёва.',
      path: [
        [49.12684666844231, 24.731693000000018],
        [49.12763526179011, 24.74705669323731],
        [49.102619443113724, 25.315255850952155]
      ],
      operation_phase: 'halych_offensive',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'halych_offensive_9th_army_marmaros',
      name: 'Наступление на Мармарош-Сигет',
      army: '9-я армия',
      commander: 'Генерал П. А. Лечицкий',
      strength: '9-я армия',
      period: '18 (31) августа 1916',
      description: '9-й армии — наступать по двум расходящимся направлениям: на Галич (позже передано 7-й армии) и на Мармарош—Сигет.',
      path: [
        [47.98464110531735, 23.870654301794776],
        [47.93890654581989, 23.896744793579096],
        [48.19728021654308, 25.074754871854857]
      ],
      operation_phase: 'halych_offensive',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'halych_offensive_german_counterattack_1',
      name: 'Контратака немецких резервов (северная)',
      army: 'Немецкие резервы',
      commander: 'Германские войска',
      strength: 'Подошедшие немецкие резервы',
      period: '26 августа (8 сентября) 1916',
      description: 'Контратаки немецких резервов вынудили русские войска оставить захваченные плацдармы и отступить за реки.',
      path: [
        [49.24406579239822, 24.768694273189837],
        [49.24933094311577, 24.696840025257433]
      ],
      operation_phase: 'halych_offensive',
      is_enemy: true,
      arrow_type: 'counterattack'
    },
    {
      id: 'halych_offensive_german_counterattack_2',
      name: 'Контратака немецких резервов (южная)',
      army: 'Немецкие резервы',
      commander: 'Германские войска',
      strength: 'Подошедшие немецкие резервы',
      period: '26 августа (8 сентября) 1916',
      description: 'Контратаки немецких резервов вынудили русские войска оставить захваченные плацдармы и отступить за реки.',
      path: [
        [49.130556989926134, 24.722553386605156],
        [49.127628038929245, 24.65903867713249]
      ],
      operation_phase: 'halych_offensive',
      is_enemy: true,
      arrow_type: 'counterattack'
    },
    {
      id: 'halych_offensive_german_counterattack_3',
      name: 'Контратака немецких резервов (центральная)',
      army: 'Немецкие резервы',
      commander: 'Германские войска',
      strength: 'Подошедшие немецкие резервы',
      period: '26 августа (8 сентября) 1916',
      description: 'Контратаки немецких резервов вынудили русские войска оставить захваченные плацдармы и отступить за реки.',
      path: [
        [49.10982528687537, 24.71294034949577],
        [49.079162454668484, 24.677234783089528]
      ],
      operation_phase: 'halych_offensive',
      is_enemy: true,
      arrow_type: 'counterattack'
    },
    {
      id: 'fourth_kovel_battle_bypass_south',
      name: 'Обход Ковеля с юга через Владимир-Волынский',
      army: '8-я армия',
      commander: 'Генерал А. А. Брусилов',
      strength: '40-й армейский, 2-й гвардейский, 1-й гвардейский и 8-й армейские корпуса',
      period: 'сентябрь - октябрь 1916',
      description: 'Брусилов решил попробовать атаковать в обход Ковеля с юга, через Владимир-Волынский.',
      path: [
        [50.73142827333148, 25.237145367085947],
        [50.84937776085173, 24.32459348720315],
        [51.06101988367474, 24.367165508687506],
        [51.20876571612448, 24.64319700282814]
      ],
      operation_phase: 'fourth_kovel_battle',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'fourth_kovel_battle_shelvo_attack',
      name: 'Наступление у Шельвова',
      army: '8-я армия',
      commander: 'Генерал А. А. Брусилов',
      strength: 'Части 8-й армии',
      period: 'сентябрь - октябрь 1916',
      description: 'Наступление было отражено по всему фронту у Шельвова.',
      path: [
        [50.7129648759659, 24.766575988287045],
        [50.711220992280566, 24.656026061529236]
      ],
      operation_phase: 'fourth_kovel_battle',
      is_enemy: false,
      arrow_type: 'short_unsuccessful'
    },
    {
      id: 'fourth_kovel_battle_bubnov_attack',
      name: 'Наступление у Бубнова',
      army: '8-я армия',
      commander: 'Генерал А. А. Брусилов',
      strength: 'Части 8-й армии',
      period: 'сентябрь - октябрь 1916',
      description: 'Наступление было отражено по всему фронту у Бубнова.',
      path: [
        [50.65988224584447, 24.828483359680114],
        [50.65704517652469, 24.731323020324638]
      ],
      operation_phase: 'fourth_kovel_battle',
      is_enemy: false,
      arrow_type: 'short_unsuccessful'
    },
    {
      id: 'fourth_kovel_battle_korytnica_success',
      name: 'Захват Корытницы 8-м армейским корпусом',
      army: '8-й армейский корпус',
      commander: '8-я армия',
      strength: '8-й армейский корпус',
      period: 'сентябрь - октябрь 1916',
      description: '8-й армейский корпус овладел Корытницей, но скромный этот успех стоил громадных потерь — до 30 000 человек.',
      path: [
        [50.62641827861774, 24.816206751464815],
        [50.61637145379073, 24.967955408691385]
      ],
      operation_phase: 'fourth_kovel_battle',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'fourth_kovel_battle_svinyukhy_success',
      name: 'Захват Свинюх 1-м гвардейским корпусом',
      army: '1-й гвардейский корпус',
      commander: '8-я армия',
      strength: '1-й гвардейский корпус',
      period: 'сентябрь - октябрь 1916',
      description: '1-й гвардейский корпус — Свинюхами, но скромный этот успех стоил громадных потерь. Кровопролитнейшее Четвёртое Ковельское сражение окончилось безрезультатно.',
      path: [
        [50.64246687887535, 24.757155237792933],
        [50.648142615751965, 24.872855005859343]
      ],
      operation_phase: 'fourth_kovel_battle',
      is_enemy: false,
      arrow_type: 'normal'
    },
    // Пятое Ковельское сражение (19 сентября (2 октября) 1916 года)
    {
      id: 'fifth_kovel_battle_special_army_vladimir',
      name: 'Наступление Особой армии на Владимир-Волынский',
      army: 'Особая армия',
      commander: 'Генерал В. И. Гурко',
      strength: '39-й и 40-й армейские корпуса 8-й армии, 4-й Сибирский корпус',
      period: '19 сентября (2 октября) 1916',
      description: 'Особая армия получила задачу решительного наступления на Владимир-Волынский левым флангом в обход Ковеля с юга.',
      path: [
        [50.77012147037857, 25.0658635513578], // Исходная позиция на линии Стохода
        [50.81364390807222, 24.368231715420293] // Владимир-Волынский
      ],
      operation_phase: 'fifth_kovel_battle',
      is_enemy: false,
      arrow_type: 'wide'
    },
    // Наступление армий на заданные направления
    {
      id: 'army_offensive_8th_grubeshov',
      name: 'Наступление 8-й армии на направлении Грубешов',
      army: '8-я армия',
      commander: 'Генерал А.М. Каледин',
      strength: '8-я армия',
      period: 'Брусиловское наступление 1916',
      description: '8-й армии предписывалось содействовать наступлением на Грубешов.',
      path: [
        [50.79802791615846, 23.940414450375773], // Направление на Грубешов
        [50.74752114365017, 24.368881247250787]  // Начальная позиция
      ],
      operation_phase: 'fifth_kovel_battle',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'army_offensive_11th_lviv',
      name: 'Наступление 11-й армии на Львов',
      army: '11-я армия',
      commander: '11-я армия',
      strength: '11-я армия',
      period: 'Брусиловское наступление 1916',
      description: '11-й армии — бить на Львов.',
      path: [
        [49.85298148513665, 24.128555319516398], // Направление на Львов
        [49.94878028569539, 25.007461569516416]  // Начальная позиция
      ],
      operation_phase: 'fifth_kovel_battle',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'army_offensive_7th_halych',
      name: 'Наступление 7-й армии на Галич',
      army: '7-я армия (усиленная 3-м Кавказским корпусом)',
      commander: 'Генерал Щербачёв',
      strength: '7-я армия, усиленная 3-м Кавказским корпусом',
      period: 'Брусиловское наступление 1916',
      description: '7-й армии (усиленной 3-м Кавказским корпусом) — на Галич.',
      path: [
        [49.13163436242544, 24.75332233349611], // Начальная позиция
        [49.19197572550114, 25.023174018066417] // Направление на Галич
      ],
      operation_phase: 'fifth_kovel_battle',
      is_enemy: false,
      arrow_type: 'normal'
    },
    {
      id: 'army_offensive_9th_dorna_vatra',
      name: 'Наступление 9-й армии на Дорна-Ватру',
      army: '9-я армия',
      commander: 'Генерал П. А. Лечицкий',
      strength: '9-я армия',
      period: 'Брусиловское наступление 1916',
      description: '9-й армии — на Дорна-Ватру.',
      path: [
        [47.357524550414674, 25.36819794982909], // Начальная позиция
        [47.495896696660736, 25.63314032761266]  // Направление на Дорна-Ватру
      ],
      operation_phase: 'fifth_kovel_battle',
      is_enemy: false,
      arrow_type: 'normal'
    }
  ];

  // Данные об операциях
  const operationInfo = {
    '': {
      title: 'Брусиловский прорыв',
      subtitle: 'Общая информация об операции',
      content: `<div style="max-width: 1200px; margin: 0 auto;">
        <div style="background: rgba(255, 255, 255, 0.03); padding: 32px; border-radius: 16px; margin-bottom: 32px; border-left: 4px solid #3b82f6;">
          <p style="font-size: 20px; line-height: 1.6; margin: 0; color: rgba(255, 255, 255, 0.95); font-weight: 400;">
            Брусиловский прорыв — это <strong style="color: #60a5fa;">крупномасштабная наступательная операция</strong> русской армии на Юго-Западном фронте под командованием генерала <strong style="color: #fbbf24;">Алексея Брусилова</strong> во время Первой мировой войны. Современники часто называли её <em style="color: #a78bfa;">«Луцким прорывом»</em>.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px;">
          <div style="background: rgba(59, 130, 246, 0.1); padding: 24px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
            <h3 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
              <span style="margin-right: 12px;">📅</span> Временные рамки
            </h3>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">
              <strong>Начало:</strong> 4 июня (22 мая по старому стилю) 1916 года<br>
              <strong>Окончание:</strong> 7 (20) сентября 1916 года по одним данным<br>
              <strong>Альтернативно:</strong> бои завершились в ноябре 1916 года
            </p>
          </div>
          
          <div style="background: rgba(34, 197, 94, 0.1); padding: 24px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2);">
            <h3 style="color: #4ade80; margin: 0 0 16px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
              <span style="margin-right: 12px;">🎯</span> Основная цель
            </h3>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">
              Прорвать позиционную оборону противника и разгромить австро-венгерские и германские войска на Юго-Западном фронте. Развить тактический успех в стратегический прорыв.
            </p>
          </div>
        </div>

        <h2 style="color: #fbbf24; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(251, 191, 36, 0.3); padding-bottom: 16px;">
          ⚡ Значимость операции
        </h2>

        <div style="display: grid; gap: 24px; margin-bottom: 40px;">
          <div style="background: rgba(139, 69, 19, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #a16207;">
            <h3 style="color: #fbbf24; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
              🔥 Новаторская тактика
            </h3>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Брусилов применил новую форму прорыва позиционного фронта, заключавшуюся в <strong style="color: #60a5fa;">одновременном наступлении всех армий</strong> Юго-Западного фронта (7-й, 8-й, 9-й и 11-й). Это было отличие от традиционной тактики сосредоточения сил на одном участке и позволяло противнику не определить направление главного удара.
            </p>
          </div>

          <div style="background: rgba(168, 85, 247, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #a855f7;">
            <h3 style="color: #c084fc; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
              💥 «Артиллерийское наступление»
            </h3>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 12px 0; line-height: 1.7;">
              При подготовке операции было разработано и впервые применено так называемое <em style="color: #a78bfa;">«артиллерийское наступление»</em> (сам термин родился в ходе этой операции).
            </p>
            <div style="background: rgba(168, 85, 247, 0.05); padding: 16px; border-radius: 8px; margin-top: 12px;">
              <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85);">
                <li>Тщательная разведка с аэрофотосъемкой (почти <strong>15 000 аэрофотоснимков</strong>)</li>
                <li>Точная пристрелка каждой цели</li>
                <li>Многофазный артиллерийский огонь с паузами</li>
                <li>Использование газа для контрбатарейной борьбы</li>
              </ul>
            </div>
          </div>

          <div style="background: rgba(34, 197, 94, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #22c55e;">
            <h3 style="color: #4ade80; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
              🗺️ Прорыв и территориальные успехи
            </h3>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 12px 0; line-height: 1.7;">
              Русским войскам удалось прорвать позиционную оборону австро-венгерской армии сразу на <strong style="color: #4ade80;">13 участках</strong>.
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
              <div style="background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 6px;">
                <strong style="color: #4ade80;">8-я армия (ген. Каледин)</strong><br>
                <span style="color: rgba(255, 255, 255, 0.8);">7 июня заняла Луцк</span>
              </div>
              <div style="background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 6px;">
                <strong style="color: #4ade80;">9-я армия</strong><br>
                <span style="color: rgba(255, 255, 255, 0.8);">18 июня взяла Черновцы</span>
              </div>
            </div>
            <p style="color: rgba(255, 255, 255, 0.85); margin: 16px 0 0 0; font-style: italic;">
              Продвижение: 50-120 км • Заняты: почти вся Волынь, почти вся Буковина и часть Галиции
            </p>
          </div>
        </div>

        <h2 style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(239, 68, 68, 0.3); padding-bottom: 16px;">
          ⚔️ Влияние на ход войны
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px;">
          <div style="background: rgba(220, 38, 38, 0.1); padding: 24px; border-radius: 12px; border: 1px solid rgba(220, 38, 38, 0.2);">
            <h3 style="color: #f87171; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              💀 Потери противника
            </h3>
            <div style="text-align: center; margin-bottom: 16px;">
              <div style="font-size: 32px; font-weight: 700; color: #ef4444;">~1.5 млн</div>
              <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">убитыми, ранеными и пленными</div>
            </div>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6; font-size: 14px;">
              Переброшено с других фронтов: 31 пехотная и 3 кавалерийские дивизии (более 400 тыс. штыков и сабель)
            </p>
          </div>

          <div style="background: rgba(34, 197, 94, 0.1); padding: 24px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2);">
            <h3 style="color: #4ade80; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              🌍 Стратегические результаты
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9); line-height: 1.6;">
              <li>Облегчено положение союзников под Верденом</li>
              <li>Спасена итальянская армия от разгрома</li>
              <li>Румыния выступила на стороне Антанты</li>
              <li><strong style="color: #4ade80;">Переход стратегической инициативы к Антанте</strong></li>
            </ul>
          </div>
        </div>

        <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 40px;">
          <h3 style="color: #f87171; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            💔 Русские потери
          </h3>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
            Русские войска Юго-Западного фронта также понесли огромные потери. По различным оценкам: от <strong style="color: #fbbf24;">500 тысяч</strong> до <strong style="color: #ef4444;">1.65 миллиона человек</strong> к середине октября 1916 года. Отмечается, что русская армия <em style="color: #f87171;">"захлебнулась собственной кровью"</em>, что истощило мобилизационные резервы и подорвало боевой дух.
          </p>
        </div>

        <h2 style="color: #8b5cf6; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(139, 92, 246, 0.3); padding-bottom: 16px;">
          👥 Ключевые участники
        </h2>

        <div style="display: grid; gap: 20px; margin-bottom: 40px;">
          <div style="background: rgba(251, 191, 36, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #fbbf24;">
            <h4 style="color: #fbbf24; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
              🎖️ Генерал Алексей Алексеевич Брусилов
            </h4>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">
              Командующий армиями Юго-Западного фронта, инициатор и главный разработчик новой стратегии наступления.
            </p>
          </div>

          <div style="background: rgba(59, 130, 246, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6;">
            <h4 style="color: #60a5fa; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
              ⚔️ Генерал А.М. Каледин
            </h4>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">
              Командующий 8-й армией, которая нанесла главный удар в направлении Луцка.
            </p>
          </div>

          <div style="background: rgba(107, 114, 128, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #6b7280;">
            <h4 style="color: #9ca3af; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
              🤝 Генералы А.Е. Эверт и А.Н. Куропаткин
            </h4>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">
              Командующие Западным и Северным фронтами соответственно. Изначально не верили в успех наступления Брусилова и не оказали должной поддержки.
            </p>
          </div>

          <div style="background: rgba(34, 197, 94, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #22c55e;">
            <h4 style="color: #4ade80; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
              📋 Генерал М.В. Алексеев
            </h4>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">
              Начальник штаба Верховного главнокомандующего, который в итоге согласился на начало операции Брусилова.
            </p>
          </div>

          <div style="background: rgba(168, 85, 247, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #a855f7;">
            <h4 style="color: #c084fc; margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
              👑 Император Николай II
            </h4>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">
              Верховный главнокомандующий, который согласился на начало операции, но позже не утвердил представления о награждении А. А. Брусилова орденом Святого Георгия 2-й степени.
            </p>
          </div>
        </div>

        <h2 style="color: #22c55e; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(34, 197, 94, 0.3); padding-bottom: 16px;">
          📊 Итоговые результаты
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <h3 style="color: #4ade80; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">✅ Достижения</h3>
            <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9); line-height: 1.8;">
              <li>Отброшен противник на <strong style="color: #4ade80;">80—120 км</strong></li>
              <li>Заняты почти вся Волынь, Буковина и часть Галиции</li>
              <li>Потери противника: <strong style="color: #f87171;">более 1.5 млн человек</strong></li>
              <li>Переброска крупных резервов с других фронтов</li>
              <li>Облегчение положения союзников</li>
              <li>Выступление Румынии на стороне Антанты</li>
              <li><strong style="color: #fbbf24;">Переход стратегической инициативы к Антанте</strong></li>
            </ul>
          </div>

          <div>
            <h3 style="color: #f59e0b; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">⚠️ Нерешенные задачи</h3>
            <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9); line-height: 1.8;">
              <li>Стратегический прорыв не был достигнут</li>
              <li>Конечная цель не достигнута: <strong style="color: #f59e0b;">Ковель и Львов не взяты</strong></li>
              <li>Огромные потери русских войск</li>
              <li>Истощение мобилизационных резервов</li>
              <li>Подрыв боевого духа армии</li>
            </ul>
          </div>
        </div>
      </div>`
    },
    'lutsk_breakthrough': {
      title: '«Луцкий» прорыв',
      subtitle: '4-15 июня 1916 года',
      content: `<div style="max-width: 1200px; margin: 0 auto;">
        <div style="background: rgba(59, 130, 246, 0.1); padding: 32px; border-radius: 16px; margin-bottom: 32px; border-left: 4px solid #3b82f6;">
          <p style="font-size: 20px; line-height: 1.6; margin: 0; color: rgba(255, 255, 255, 0.95); font-weight: 400;">
            Луцкий прорыв — это первая и наиболее успешная фаза <strong style="color: #60a5fa;">Брусиловского наступления</strong>. Австро-венгерским войскам командовал <strong style="color: #fbbf24;">эрцгерцог Фридрих</strong>.
          </p>
        </div>

        <h2 style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(239, 68, 68, 0.3); padding-bottom: 16px;">
          💥 Артиллерийская подготовка
        </h2>

        <div style="background: rgba(220, 38, 38, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7; font-size: 18px;">
            Артиллерийская подготовка продолжалась с <strong style="color: #fbbf24;">3 часов ночи 22 мая (4 июня)</strong> до <strong style="color: #fbbf24;">9 часов утра 24 мая (6 июня)</strong> и привела к:
          </p>
          <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85); line-height: 1.6;">
            <li><strong style="color: #f87171;">Сильному разрушению первой полосы обороны</strong></li>
            <li><strong style="color: #f87171;">Частичной нейтрализации артиллерии противника</strong></li>
          </ul>
        </div>

        <h2 style="color: #22c55e; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(34, 197, 94, 0.3); padding-bottom: 16px;">
          ⚔️ Соотношение сил
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px;">
          <div style="background: rgba(34, 197, 94, 0.1); padding: 24px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2);">
            <h3 style="color: #4ade80; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; text-align: center;">
              🇷🇺 Русские армии
            </h3>
            <div style="text-align: center; margin-bottom: 16px;">
              <div style="font-size: 28px; font-weight: 700; color: #4ade80;">594 тыс.</div>
              <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">человек</div>
              <div style="font-size: 24px; font-weight: 700; color: #4ade80; margin-top: 8px;">1938</div>
              <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">орудий</div>
            </div>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6; font-size: 14px; text-align: center;">
              8-я, 11-я, 7-я и 9-я армии
            </p>
          </div>

          <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2);">
            <h3 style="color: #f87171; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; text-align: center;">
              🇦🇹 Австро-венгерский фронт
            </h3>
            <div style="text-align: center; margin-bottom: 16px;">
              <div style="font-size: 28px; font-weight: 700; color: #ef4444;">486 тыс.</div>
              <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">человек</div>
              <div style="font-size: 24px; font-weight: 700; color: #ef4444; margin-top: 8px;">1846</div>
              <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">орудий</div>
            </div>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6; font-size: 14px; text-align: center;">
              Под командованием эрцгерцога Фридриха
            </p>
          </div>
        </div>

        <h2 style="color: #8b5cf6; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(139, 92, 246, 0.3); padding-bottom: 16px;">
          🚀 Прорыв фронта
        </h2>

        <div style="background: rgba(139, 92, 246, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #a855f7; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7; font-size: 18px;">
            Русские войска прорвали хорошо укреплённую позиционную оборону австро-венгерского фронта. Прорыв был осуществлён сразу на <strong style="color: #c084fc;">13 участках</strong> с последующим развитием в сторону флангов и в глубину.
          </p>
        </div>

        <h2 style="color: #fbbf24; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(251, 191, 36, 0.3); padding-bottom: 16px;">
          🏆 Первые успехи (к полудню 24 мая)
        </h2>

        <div style="background: rgba(251, 191, 36, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #fbbf24; margin-bottom: 32px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #fbbf24;">900</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">офицеров в плену</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #fbbf24;">40 тыс.</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">нижних чинов в плену</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #fbbf24;">77</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">орудий захвачено</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 20px; font-weight: 700; color: #fbbf24;">134</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">пулемёта</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 20px; font-weight: 700; color: #fbbf24;">49</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">бомбомётов</div>
            </div>
          </div>
        </div>

        <h2 style="color: #06b6d4; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(6, 182, 212, 0.3); padding-bottom: 16px;">
          📈 Развитие успеха (к 27 мая)
        </h2>

        <div style="background: rgba(6, 182, 212, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #06b6d4; margin-bottom: 32px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #06b6d4;">1240</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">офицеров в плену</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #06b6d4;">71 тыс.</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">нижних чинов в плену</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #06b6d4;">94</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">орудия захвачено</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 20px; font-weight: 700; color: #06b6d4;">179</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">пулемётов</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 20px; font-weight: 700; color: #06b6d4;">53</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">бомбомёта</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 20px; font-weight: 700; color: #06b6d4;">53</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">миномёта</div>
            </div>
          </div>
        </div>

        <h2 style="color: #22c55e; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(34, 197, 94, 0.3); padding-bottom: 16px;">
          🎖️ Успех 8-й армии генерала Каледина
        </h2>

        <div style="background: rgba(34, 197, 94, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #22c55e; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            Наибольшего успеха на первом этапе достигла <strong style="color: #4ade80;">8-я армия генерала от кавалерии А. М. Каледина</strong>:
          </p>
          
          <div style="display: grid; gap: 16px; margin-bottom: 20px;">
            <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #4ade80;">7 июня</strong> — заняла Луцк
            </div>
            <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #4ade80;">К 15 июня</strong> — наголову разгромила 4-ю австро-венгерскую армию эрцгерцога Иосифа Фердинанда
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #4ade80;">45 тыс.</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">пленных</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #4ade80;">66</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">орудий</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #4ade80;">много</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">других трофеев</div>
            </div>
          </div>

          <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">
              <strong style="color: #4ade80;">32-й корпус</strong>, действующий южнее Луцка, взял город <strong style="color: #4ade80;">Дубно</strong>
            </p>
          </div>

          <div style="text-align: center; padding: 20px; background: rgba(34, 197, 94, 0.05); border-radius: 8px;">
            <div style="font-size: 20px; font-weight: 700; color: #4ade80; margin-bottom: 8px;">Масштаб прорыва армии Каледина:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <div style="font-size: 28px; font-weight: 700; color: #4ade80;">80 км</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">по фронту</div>
              </div>
              <div>
                <div style="font-size: 28px; font-weight: 700; color: #4ade80;">65 км</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">в глубину</div>
              </div>
            </div>
          </div>
        </div>

        <h2 style="color: #8b5cf6; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(139, 92, 246, 0.3); padding-bottom: 16px;">
          🌟 Успех 9-й армии генерала Лечицкого
        </h2>

        <div style="background: rgba(139, 92, 246, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #a855f7;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            В то время как на правом крыле фронта русские войска отражали контрудар австро-венгров, левофланговая <strong style="color: #c084fc;">9-я армия под командованием генерала П. А. Лечицкого</strong> успешно развивала наступление:
          </p>
          
          <div style="display: grid; gap: 16px; margin-bottom: 20px;">
            <div style="background: rgba(139, 92, 246, 0.05); padding: 16px; border-radius: 8px;">
              Прорвала фронт 7-й австро-венгерской армии, <strong style="color: #c084fc;">перемолов её во встречном сражении</strong>
            </div>
            <div style="background: rgba(139, 92, 246, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #c084fc;">К 13 июня</strong> продвинулась на 50 км, взяв почти 50 тыс. пленных
            </div>
            <div style="background: rgba(139, 92, 246, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #c084fc;">18 июня</strong> штурмом взяла хорошо укреплённый город <strong style="color: #fbbf24;">Черновцы</strong>
            </div>
          </div>

          <div style="background: rgba(251, 191, 36, 0.1); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7; font-style: italic;">
              <strong style="color: #fbbf24;">Черновцы</strong> за свою неприступность были названы австрийцами <strong style="color: #fbbf24;">«вторым Верденом»</strong>
            </p>
          </div>

          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7;">
            Таким образом оказался взломанным <strong style="color: #c084fc;">весь южный фланг австрийского фронта</strong>. Преследуя противника и громя части, брошенные для организации новых рубежей обороны, 9-я армия вышла на оперативный простор, занимая Буковину:
          </p>

          <div style="display: grid; gap: 12px;">
            <div style="background: rgba(139, 92, 246, 0.05); padding: 12px; border-radius: 6px;">
              <strong style="color: #c084fc;">12-й корпус</strong> — взял город Куты (продвинувшись далеко на запад)
            </div>
            <div style="background: rgba(139, 92, 246, 0.05); padding: 12px; border-radius: 6px;">
              <strong style="color: #c084fc;">3-й кавалерийский корпус</strong> — занял город Кымпулунг (ныне в Румынии)
            </div>
            <div style="background: rgba(139, 92, 246, 0.05); padding: 12px; border-radius: 6px;">
              <strong style="color: #c084fc;">41-й корпус</strong> — 30 июня захватил Коломыю, выходя к Карпатам
            </div>
          </div>
        </div>

        <h2 style="color: #f59e0b; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(245, 158, 11, 0.3); padding-bottom: 16px;">
          🛡️ Другие армии
        </h2>

        <div style="background: rgba(245, 158, 11, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7; font-size: 16px;">
            <strong style="color: #fbbf24;">11-я и 7-я армии</strong> также прорвали фронт на своих участках (<em style="color: #a78bfa;">Язловецкая операция</em>), но контрударами противника их наступление было остановлено.
          </p>
        </div>

        <h2 style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(239, 68, 68, 0.3); padding-bottom: 16px;">
          🎯 Угроза Ковеля
        </h2>

        <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            Угроза взятия 8-й армией <strong style="color: #f87171;">Ковеля</strong> (важнейший центр коммуникаций) заставила Центральные державы перебросить на это направление:
          </p>
          
          <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85); line-height: 1.8;">
            <li><strong style="color: #f87171;">Две германские дивизии</strong> с западноевропейского театра</li>
            <li><strong style="color: #f87171;">Две австрийские дивизии</strong> с итальянского фронта</li>
            <li><strong style="color: #f87171;">Большое число частей</strong> с других участков Восточного фронта</li>
          </ul>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-top: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #f87171;">3 (16) июня</strong> — начался контрудар австро-германских войск под общим командованием <strong style="color: #fbbf24;">генерала Линзингена</strong> путем концентрического наступления в общем направлении на Луцк против 8-й армии.
            </p>
          </div>

          <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px; margin-top: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #4ade80;">Результат:</strong> Контрудар не достиг успеха. Наоборот, австро-германские войска были сами отброшены за реку Стырь, где и закрепились, отбивая русские атаки.
            </p>
          </div>
        </div>

        <h2 style="color: #6b7280; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(107, 114, 128, 0.3); padding-bottom: 16px;">
          ⏰ Проблемы координации
        </h2>

        <div style="background: rgba(107, 114, 128, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #6b7280; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7;">
            В это же время <strong style="color: #9ca3af;">Западный фронт откладывал</strong> нанесение предписанного ему Ставкой главного удара:
          </p>
          
          <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85); line-height: 1.8;">
            <li>С согласия генерала М. В. Алексеева генерал Эверт отложил наступление до <strong style="color: #9ca3af;">17 июня</strong></li>
            <li>Частная атака 1-го гренадерского корпуса <strong style="color: #9ca3af;">15 июня оказалась неудачной</strong></li>
            <li>Наступление Западного фронта было перенесено на <strong style="color: #9ca3af;">начало июля</strong></li>
          </ul>
        </div>

        <h2 style="color: #f59e0b; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(245, 158, 11, 0.3); padding-bottom: 16px;">
          🤔 Стратегические разногласия
        </h2>

        <div style="background: rgba(245, 158, 11, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 32px;">
          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #ef4444;">9 июня</strong> — М. В. Алексеев отдал директиву о дальнейшем наступлении 8-й армии от Луцка в сторону реки Сан с целью отрезать австро-венгерские армии от германского Восточного фронта.
            </p>
          </div>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #ef4444;">10 июня</strong> — Брусилов заявил, что <strong style="color: #f87171;">отказывается выполнять эту директиву</strong>, беспокоясь за растянутый правый фланг и опасаясь оторваться от армий Западного фронта.
            </p>
          </div>

          <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Долгие переговоры завершились согласием Алексеева на предварительное занятие линии <strong style="color: #4ade80;">Ковель — Владимир-Волынский</strong>. Такая директива армиям была отдана A. A. Брусиловым <strong style="color: #4ade80;">31 мая</strong>.
            </p>
          </div>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Но уже <strong style="color: #ef4444;">15 июня</strong> он приказал 8-й армии вновь прекратить атаки и лишь вечером велел продолжить наступление, но только на Ковель, а на Владимир-Волынском и Сокальском направлениях прекратить продвижение и ослабить войска.
            </p>
          </div>
        </div>

        <h2 style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(239, 68, 68, 0.3); padding-bottom: 16px;">
          ⚠️ Потеря инициативы
        </h2>

        <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7; font-size: 18px;">
            Отдавая 8-й армии всё новые директивы — то наступательного, то оборонительного характера, развивать удар то на Ковель, то на Львов, — <strong style="color: #f87171;">Брусилов потерял стратегическую инициативу на главном направлении своего фронта</strong>.
          </p>
        </div>
      </div>`
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

    'kovel_battles': {
      title: '1-3 Ковельские сражения',
      subtitle: 'июль - август 1916 года',
      content: `Серия сражений за Ковель - ключевой железнодорожный узел. Русские войска предприняли три попытки захватить город.

        Основные события:
        • 1-е Ковельское сражение - июль 1916
        • 2-е Ковельское сражение - август 1916  
        • 3-е Ковельское сражение - август 1916
        • Упорная оборона австро-германских войск
        
        Результаты:
        • Ковель так и не был захвачен русскими войсками
        • Значительные потери с обеих сторон
        • Стабилизация фронта в районе Ковеля`
    },

    'halych_offensive': {
      title: 'Наступление на Галич',
      subtitle: '18 (31) августа 1916 года',
      content: `Общее наступление Юго-Западного фронта под командованием генерала А. А. Брусилова.

        Дата атаки:
        • Планировалось на 16 (29) августа 1916 года
        • По просьбе штаба 7-й армии отложено на два дня
        • Фактически началось 18 (31) августа 1916 года
        
        Руководство:
        • Командующий Юго-Западным фронтом: генерал А. А. Брусилов
        • На Галич наступала 7-я армия под командованием генерала Щербачёва
        
        Участвующие армии и направления:
        • 8-я армия — на Владимир-Волынский
        • 11-я армия — на Бережаны
        • 7-я армия (усиленная 33-м и 41-м корпусами) — на Галич
        • 9-я армия — на Галич и Мармарош-Сигет`
    },

    'fourth_kovel_battle': {
      title: 'Четвертое Ковельское Сражение',
      subtitle: 'сентябрь - октябрь 1916 года',
      content: `Последняя попытка захвата Ковеля в рамках Брусиловского наступления.

        Ситуация на момент начала:
        • Русские войска удерживали все города, захваченные в предыдущих операциях
        • Фронт стабилизировался в районе Ковеля
        • Противник укрепил оборону
        
        Характер операции:
        • Завершающая фаза Брусиловского наступления
        • Попытка окончательного прорыва к Ковелю
        • Ограниченные наступательные действия
        
        Результаты:
        • Ковель так и не был взят
        • Сохранены все ранее захваченные территории
        • Переход к позиционной войне`
    },

    'fifth_kovel_battle': {
      title: 'Пятое Ковельское сражение',
      subtitle: '17 (30) сентября - октябрь 1916 года',
      content: `Заключительная фаза боев за Ковель в рамках Брусиловского наступления.

        Дата атаки:
        • Общее наступление всего фронта назначено на 17 (30) сентября 1916 года
        • Атака Особой и 8-й армий началась 19 сентября (2 октября) 1916 года
        
        Руководство:
        • Брусилов настаивал на продолжении операции
        • Наступательные действия Особой армии возглавлял генерал В. И. Гурко
        
        Участвующие армии:
        • Особая армия (с 39-м и 40-м корпусами 8-й армии и 4-м Сибирским корпусом)
        • 8-я армия
        • 11-я, 7-я и 9-я армии на других направлениях
        
        Направления атак:
        • Особая армия - активная оборона линии Стохода и наступление на Владимир-Волынский
        • Обход Ковеля с юга через Владимир-Волынский
        
        Результаты:
        • Окончательный переход к позиционной войне
        • Завершение активной фазы Брусиловского наступления`
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

  // Полноэкранное окно не закрывается по клику, только по ESC или кнопке закрытия

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



  const mapCenter = [50.5, 25.2];
  const mapZoom = 6;

  const mapBounds = [
    [46.0, 22.0], // юго-запад
    [54.5, 30.0]  // северо-восток
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
            <div style={{ display: 'inline-block' }}>
              <h1 style={{
                fontSize: '48px',
                fontWeight: '700',
                textAlign: 'left',
                margin: 0,
                fontFamily: 'Rubik, sans-serif',
                letterSpacing: '2px',
                color: '#ffffff',
                lineHeight: 1.2,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                textTransform: 'uppercase'
              }}>
                Брусиловский прорыв
              </h1>
              <div style={{
                width: '100%',
                height: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                margin: '8px 0 8px 0'
              }}></div>
            </div>
            <div style={{
              textAlign: 'left',
              margin: '0',
              fontFamily: 'Rubik, sans-serif',
              fontSize: '20px',
              color: '#ffffff',
              letterSpacing: '1px'
            }}>
              <span style={{ fontWeight: '700' }}>4</span>
              <span style={{ fontWeight: '400', margin: '0 4px' }}>июня</span>
              <span style={{ fontWeight: '700' }}>1916</span>
              <span style={{ fontWeight: '400', marginLeft: '4px' }}>г.</span>
            </div>
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
                  fontFamily: 'Rubik, sans-serif'
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
                        backgroundColor: '#f97316',
                        borderRadius: '2px'
                      }}></div>
                    </div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.2' }}>Фронт на 14 июля 1916</span>
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
                      fontFamily: 'Rubik, sans-serif',
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

      {/* Полноэкранное окно с информацией об операции */}
      {showOperationInfo && (
        <div
          className={`fullscreen-modal ${isOperationInfoClosing ? 'closing' : ''}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(26, 26, 46, 0.98)',
            backdropFilter: 'blur(20px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Заголовок с кнопкой закрытия */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '32px 48px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)'
          }}>
            <div>
              <h1 style={{
                margin: '0 0 8px 0',
                fontSize: '36px',
                color: '#ffffff',
                fontWeight: '700',
                letterSpacing: '-1px',
                fontFamily: 'Rubik, sans-serif'
              }}>
                {operationInfo[selectedPhase]?.title || 'Информация об операции'}
              </h1>
              <p style={{
                margin: 0,
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '500',
                fontFamily: 'Rubik, sans-serif'
              }}>
                {operationInfo[selectedPhase]?.subtitle}
              </p>
            </div>
            <button
              onClick={closeOperationInfoModal}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '28px',
                cursor: 'pointer',
                padding: '12px',
                width: '48px',
                height: '48px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.transform = 'scale(1)';
              }}
              title="Закрыть (ESC)"
            >
              ×
            </button>
          </div>

          {/* Содержимое */}
          <div style={{
            flex: 1,
            padding: '48px',
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{
              maxWidth: '1200px',
              width: '100%'
            }}>
              <div style={{
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: '1.8',
                fontFamily: 'Rubik, sans-serif',
                textAlign: 'justify'
              }}>
                <div 
                  style={{ 
                  letterSpacing: '0.3px'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: operationInfo[selectedPhase]?.content || 'Информация временно недоступна.'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Нижняя панель с дополнительными элементами управления */}
          <div style={{
            padding: '24px 48px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontFamily: 'Rubik, sans-serif'
            }}>
              Нажмите ESC или кнопку × для закрытия
            </p>
          </div>
        </div>
      )}


    </div>
  );
}