import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import brusilovData from './brusilovData.json';
import citiesData from './citiesData.json';
import NewVideo from './assets/NewVideo.mp4';
import ArtemPhoto from './assets/photo_2024-10-17_16-45-07.jpg';
import IvanPhoto from './assets/photo_2025-04-21_00-29-51.jpg';
import IlyaPhoto from './assets/photo_2025-05-20_23-52-26.jpg';


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
            html: `<div style="transform: rotate(${180 + // Глобальный поворот на 180 градусов для всех стрелок
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
    const kovelBattlesCities = ['selec', 'tristen', 'koshevo', 'torchin', 'monastyryska', 'stanislau', 'halych'];
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
    const kovelBattles7thArmy = ['monastyryska', 'halych'];
    if (kovelBattles7thArmy.includes(city.id)) {
      if (selectedPhase === 'kovel_battles' || selectedPhase === 'fourth_kovel_battle' || selectedPhase === 'fifth_kovel_battle' || selectedPhase === '') {
        isCaptured = true;
        captureDate = city.id === 'halych' ? 'июль 1916' : '15 (28) июля 1916';
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
  const [blurVideo, setBlurVideo] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Показать видео с задержкой
    const videoTimer = setTimeout(() => {
      setShowVideo(true);
    }, 500);

    // Показать текст и размыть видео через 1.5 секунды
    const textTimer = setTimeout(() => {
      setShowText(true);
      setBlurVideo(true);
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
        className={`intro-video ${showVideo ? 'show' : ''} ${blurVideo ? 'blur' : ''}`}
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
  const [showGallery, setShowGallery] = useState(false);
  const [isGalleryClosing, setIsGalleryClosing] = useState(false);
  const [currentGalleryImage, setCurrentGalleryImage] = useState(0);
  
  // Состояние для исторической карты
  const [showHistoricalMap, setShowHistoricalMap] = useState(false);
  const [isHistoricalMapClosing, setIsHistoricalMapClosing] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [isContactsClosing, setIsContactsClosing] = useState(false);
  
  // Состояние для туров подсказок
  const [showTour, setShowTour] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [isTourClosing, setIsTourClosing] = useState(false);

  // Проверка первого посещения
  useEffect(() => {
    const hasVisited = localStorage.getItem('brusilov-tour-completed');
    if (!hasVisited && showMainContent && !showIntro) {
      setTimeout(() => {
        setShowTour(true);
      }, 1000); // Показать тур через секунду после загрузки
    }
  }, [showMainContent, showIntro]);

  // Данные для тура
  const tourSteps = [
    {
      target: '.intro-start-button, .operation-info-button',
      title: '👋 Добро пожаловать!',
      content: 'Это интерактивная карта Брусиловского прорыва 1916 года. Давайте познакомимся с основными возможностями!',
      position: 'center'
    },
    {
      target: '[data-tour="phase-selector"]',
      title: '📅 Выбор фазы операции',
      content: 'Здесь вы можете выбрать конкретную фазу операции для изучения. Попробуйте переключить между разными этапами!',
      position: 'top'
    },
    {
      target: '[data-tour="legend-button"]',
      title: '📖 Легенда и заголовок',
      content: 'Эта кнопка скрывает/показывает легенду карты и заголовок. Полезно для полноэкранного просмотра.',
      position: 'right'
    },
    {
      target: '[data-tour="info-button"]',
      title: '📚 Подробная информация',
      content: 'Кнопка открывает детальную информацию о выбранной фазе операции с историческими фактами.',
      position: 'left'
    },
    {
      target: '[data-tour="gallery-button"]',
      title: '🖼️ Историческая галерея',
      content: 'В галерее собраны уникальные исторические фотографии и документы времен Брусиловского наступления 1916 года.',
      position: 'left'
    },
    {
      target: '.leaflet-container',
      title: '🗺️ Интерактивная карта',
      content: 'Кликайте по городам, стрелкам и линиям фронта для получения подробной информации. Используйте колесо мыши для масштабирования.',
      position: 'center'
    },
    {
      target: '.legend',
      title: '🎯 Легенда',
      content: 'Здесь показаны все условные обозначения карты. Легенда поможет вам понять, что означают разные элементы.',
      position: 'right'
    }
  ];

  // Функции управления туром
  const nextTourStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(currentTourStep + 1);
    } else {
      closeTour();
    }
  };

  const prevTourStep = () => {
    if (currentTourStep > 0) {
      setCurrentTourStep(currentTourStep - 1);
    }
  };

  const closeTour = () => {
    setIsTourClosing(true);
    setTimeout(() => {
      setShowTour(false);
      setIsTourClosing(false);
      setCurrentTourStep(0);
      localStorage.setItem('brusilov-tour-completed', 'true');
    }, 300);
  };

  const skipTour = () => {
    closeTour();
  };

  // Функция для разработки - сброс тура (можно убрать в продакшене)
  const resetTour = () => {
    localStorage.removeItem('brusilov-tour-completed');
    setCurrentTourStep(0);
    setShowTour(true);
  };

  // Данные галереи
  const galleryImages = [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Aleksei_Brusilov_at_Rivne_Railway_Station_%28October_1915%29.jpg',
      title: 'Генерал А. А. Брусилов на станции Ровно (1915)',
      description: 'Первая мировая война. Генерал А. А. Брусилов на станции Ровно (1915)'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/7/70/RussianHighCommand.jpeg',
      title: 'Военный совет 1 апреля 1916 года',
      description: 'Военный совет 1 апреля 1916 года'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/19/01916_12cm_Minenwerfer_-_Sperrfort_Dubno.jpg',
      title: 'Австро-венгерский миномётный расчёт',
      description: 'Австро-венгерский миномётный расчёт на позиции'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/01916_Maschinengewehr_M._7.12_eingebaut_in_der_Schwarmlinie_flankierend..jpg',
      title: 'Австро-венгерские пулемётчики',
      description: 'Австро-венгерские пулемётчики на позиции'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Batterie_6_F.A.97%2C_Punkt_239_südwestlich_Szelwow.jpg',
      title: 'Немецкое полевое орудие',
      description: 'Немецкое полевое орудие в укрытии юго-западнее Шельвова'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Batterie_4_F.A.97_des_deutschen_Regiments_westlich_Szelwow.jpg',
      title: 'Немецкая пушка в бункере',
      description: 'Немецкая пушка в орудийном бункере западнее Шельвова'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Трофеи._Юго-Западный_фронт.png',
      title: 'Захваченные австрийские орудия',
      description: 'Австрийские орудия, захваченные русскими войсками'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Niva_magazine%2C_1916%2C_No_30._img_011.jpg/2880px-Niva_magazine%2C_1916%2C_No_30._img_011.jpg',
      title: 'Взятый австрийский окоп',
      description: 'Захваченные русскими войсками австрийские укрепления'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/9/92/01916_Maschinen_Gewehr_Abteilung_3.4_in_der_Waldstellung_beim_Infanterieregiment_4.jpg',
      title: 'Австрийские пулеметчики на позиции',
      description: 'Пулеметное отделение 3.4 австро-венгерского пехотного полка №4 в лесных позициях'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/01916_Zarzece_am_Stochod.jpg',
      title: 'Австрийские позиции вдоль Стохода',
      description: 'Австро-венгерские оборонительные позиции у местечка Зажече на реке Стоход'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Ignacy_Paweł_Fudakowski_-_Rosyjski_12_Dywizjon_Artylerii_Moździerzy_na_Wołyniu_%2894-95-7%29.jpg/2880px-Ignacy_Paweł_Fudakowski_-_Rosyjski_12_Dywizjon_Artylerii_Moździerzy_na_Wołyniu_%2894-95-7%29.jpg',
      title: 'Российская артиллерия в действии',
      description: 'Русский 12-й дивизион минометной артиллерии на Волыни'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Turkish_troops_in_Galicia_repel_a_Russian_attack_at_Zolota_Lipa_on_August_17%2C_1916.png',
      title: 'Турки отражают атаку русских в боях на Золотой Липе',
      description: 'Турецкие войска в Галиции отражают русскую атаку на реке Золотая Липа 17 августа 1916 года'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Batterie_3_L.F.A.B.11_westlich_Szelwow2.jpg/960px-Batterie_3_L.F.A.B.11_westlich_Szelwow2.jpg',
      title: 'Немецкая тяжелая полевая гаубица «15-cm-sFH 93» в укрытии к западу от Шельвова',
      description: 'Батарея №3 немецкого тяжелого полевого артиллерийского батальона №11 западнее Шельвова'
    }
  ];

  // Функции управления галереей
  const openGallery = () => {
    setShowGallery(true);
    setCurrentGalleryImage(0);
  };

  const closeGallery = () => {
    setIsGalleryClosing(true);
    setTimeout(() => {
      setShowGallery(false);
      setIsGalleryClosing(false);
    }, 300);
  };

  const nextGalleryImage = () => {
    setCurrentGalleryImage((prev) => (prev + 1) % galleryImages.length);
  };

  const prevGalleryImage = () => {
    setCurrentGalleryImage((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const selectGalleryImage = (index) => {
    setCurrentGalleryImage(index);
  };

  // Функции управления исторической картой
  const openHistoricalMap = () => {
    setShowHistoricalMap(true);
  };

  const openHistoricalMapInNewTab = () => {
    window.open(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Zayonchkovsky_map47_%28part_A%29.png/1920px-Zayonchkovsky_map47_%28part_A%29.png',
      '_blank'
    );
  };

  const closeHistoricalMap = () => {
    setIsHistoricalMapClosing(true);
    setTimeout(() => {
      setShowHistoricalMap(false);
      setIsHistoricalMapClosing(false);
    }, 300);
  };

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
        [51.11510126681912, 24.61571015637205],
        [51.10818567507992, 24.926073925903303]
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
              Русским войскам удалось прорвать позиционную оборону австро-венгерской армии сразу на <strong style="color: #4ade80;">13 участках</strong>. Юго-Западный фронт нанёс поражение австро-венгерской армии, отбросив противника на <strong style="color: #4ade80;">80—120 км</strong>.
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0;">
              <div style="background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 6px;">
                <strong style="color: #4ade80;">8-я армия (ген. Каледин)</strong><br>
                <span style="color: rgba(255, 255, 255, 0.8);">7 июня заняла Луцк</span>
              </div>
              <div style="background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 6px;">
                <strong style="color: #4ade80;">9-я армия (ген. Лечицкий)</strong><br>
                <span style="color: rgba(255, 255, 255, 0.8);">18 июня взяла Черновцы</span>
              </div>
            </div>
            <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <h4 style="color: #4ade80; margin: 0 0 8px 0; font-size: 16px;">Захваченные территории:</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 14px;">
                <div><strong style="color: #4ade80;">Почти вся Волынь</strong></div>
                <div><strong style="color: #4ade80;">Почти вся Буковина</strong></div>
                <div><strong style="color: #4ade80;">Часть Галиции</strong></div>
              </div>
            </div>
            <div style="background: rgba(251, 191, 36, 0.1); padding: 12px; border-radius: 6px;">
              <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 13px; font-style: italic;">
                <strong style="color: #fbbf24;">Трофеи:</strong> 581 орудие, 1795 пулемётов, 448 бомбомётов и миномётов
              </p>
            </div>
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
              <div style="font-size: 32px; font-weight: 700; color: #ef4444;">1.5+ млн</div>
              <div style="color: rgba(255, 255, 255, 0.7); font-size: 14px;">общие потери Австро-Венгрии и Германии</div>
            </div>
            <div style="background: rgba(220, 38, 38, 0.05); padding: 12px; border-radius: 6px; margin-bottom: 12px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
                <div><strong style="color: #f87171;">Австро-Венгрия:</strong> 750+ тыс.</div>
                <div><strong style="color: #f87171;">Германия:</strong> 148 тыс.</div>
                <div><strong style="color: #fbbf24;">Пленными:</strong> 500+ тыс.</div>
                <div><strong style="color: #ef4444;">Убитыми:</strong> 300 тыс.</div>
              </div>
            </div>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6; font-size: 14px;">
              Переброшено с других фронтов: <strong style="color: #fbbf24;">31 пехотная и 3 кавалерийские дивизии</strong> (более 400 тыс. штыков и сабель)
            </p>
          </div>

          <div style="background: rgba(34, 197, 94, 0.1); padding: 24px; border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.2);">
            <h3 style="color: #4ade80; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
              🌍 Стратегические результаты
            </h3>
            <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9); line-height: 1.6;">
              <li>Облегчено положение союзников в <strong style="color: #4ade80;">сражении на Сомме</strong></li>
              <li>Спасена <strong style="color: #4ade80;">итальянская армия от разгрома</strong></li>
              <li><strong style="color: #4ade80;">Румыния выступила на стороне Антанты</strong></li>
              <li><strong style="color: #fbbf24;">Переход стратегической инициативы к Антанте</strong></li>
              <li>Сломана <strong style="color: #f87171;">австрийская военная машина</strong></li>
            </ul>
            <div style="background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 6px; margin-top: 12px;">
              <p style="margin: 0; font-size: 13px; font-style: italic; color: rgba(255, 255, 255, 0.8);">
                Отныне австрийцы не смогут наступать даже в Италии без поддержки немцев
              </p>
            </div>
          </div>
        </div>

        <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 40px;">
          <h3 style="color: #f87171; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            💔 Русские потери
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px;">
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #ef4444;">500 тыс. - 1 млн</div>
                <div style="color: rgba(255, 255, 255, 0.7); font-size: 13px;">по различным оценкам</div>
              </div>
            </div>
            <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px;">
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: 700; color: #ef4444;">1.65 млн</div>
                <div style="color: rgba(255, 255, 255, 0.7); font-size: 13px;">к октябрю 1916 г.</div>
              </div>
            </div>
          </div>
          
          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h4 style="color: #f87171; margin: 0 0 12px 0; font-size: 16px;">Современные исследования (Нелипович):</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <strong style="color: #ef4444;">Русские:</strong> 1,446,334 чел.
              </div>
              <div>
                <strong style="color: #f87171;">Австро-германские:</strong> 845,956 чел.
              </div>
            </div>
          </div>

          <div style="background: rgba(251, 191, 36, 0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h4 style="color: #fbbf24; margin: 0 0 8px 0; font-size: 16px;">Французские данные (генерал Кастельно, 1917):</h4>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 14px;">
              <strong style="color: #fbbf24;">980,000 человек</strong> — официальная цифра потерь армий А. А. Брусилова
            </p>
          </div>

          <div style="background: rgba(220, 38, 38, 0.05); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6; font-style: italic;">
              <strong style="color: #f87171;">"Ковельская бойня"</strong> (А. А. Керсновский) — потери превзошли первоначальный состав Юго-западного фронта, что истощило мобилизационные резервы и подорвало боевой дух армии.
            </p>
          </div>
        </div>

        <h2 style="color: #f59e0b; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(245, 158, 11, 0.3); padding-bottom: 16px;">
          ⚠️ Завершение операции
        </h2>

        <div style="background: rgba(245, 158, 11, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 40px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7; font-size: 18px;">
            Наступательный порыв русских армий <strong style="color: #f59e0b;">выдохся</strong> ввиду следующих причин:
          </p>
          
          <ul style="margin: 0 0 20px 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85); line-height: 1.8;">
            <li><strong style="color: #f59e0b;">Усилившееся сопротивление</strong> австро-германских войск</li>
            <li><strong style="color: #ef4444;">Возросшие потери</strong> и утомление личного состава</li>
            <li><strong style="color: #f87171;">Истощение резервов</strong> и боеприпасов</li>
          </ul>

          <div style="background: rgba(245, 158, 11, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h4 style="color: #f59e0b; margin: 0 0 8px 0; font-size: 16px;">Стратегические разногласия:</h4>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6; font-size: 14px;">
              Брусилов бросал войска в новые атаки, <strong style="color: #ef4444;">игнорируя предложения Ставки</strong> перенести направление южнее, в район 7-й и 9-й армий. Ставка пыталась указать на необходимость смены направления удара с ковельского <strong style="color: #4ade80;">в Лесистые Карпаты</strong>, но Брусилов «не считаясь ни с потерями, ни со складывающейся обстановкой, всякий раз принимал решение наступать на Ковель».
            </p>
          </div>

          <div style="background: rgba(220, 38, 38, 0.1); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6; font-style: italic; text-align: center;">
              Германское командование иронически называло Брусиловский прорыв <strong style="color: #f87171;">"широкой разведкой без сосредоточения необходимого кулака"</strong>, тем не менее удар произвёл на противника ошеломляющее впечатление.
            </p>
          </div>
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
          📊 Итоговые результаты операции
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
          <div>
            <h3 style="color: #4ade80; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">✅ Достижения</h3>
            <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9); line-height: 1.8;">
              <li>Отброшен противник на <strong style="color: #4ade80;">80—120 км</strong></li>
              <li>Заняты <strong style="color: #4ade80;">почти вся Волынь, почти вся Буковина и часть Галиции</strong></li>
              <li>Потери противника: <strong style="color: #f87171;">более 1.5 млн человек</strong></li>
              <li>Переброска <strong style="color: #fbbf24;">31 пехотной и 3 кавалерийских дивизий</strong> с других фронтов</li>
              <li>Облегчение положения союзников в <strong style="color: #4ade80;">битве на Сомме</strong></li>
              <li><strong style="color: #4ade80;">Выступление Румынии</strong> на стороне Антанты</li>
              <li><strong style="color: #fbbf24;">Переход стратегической инициативы к Антанте</strong></li>
              <li>Сломана <strong style="color: #f87171;">австрийская военная машина</strong></li>
            </ul>
          </div>

          <div>
            <h3 style="color: #f59e0b; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">⚠️ Нерешенные задачи и проблемы</h3>
            <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.9); line-height: 1.8;">
              <li><strong style="color: #ef4444;">Стратегический прорыв не достигнут</strong></li>
              <li>Ключевые цели не взяты: <strong style="color: #f59e0b;">Ковель и Львов</strong></li>
              <li><strong style="color: #ef4444;">Огромные русские потери</strong> (до 1.65 млн чел.)</li>
              <li>Истощение мобилизационных резервов</li>
              <li>Подрыв боевого духа армии</li>
              <li><strong style="color: #f87171;">"Ковельская бойня"</strong> — упорство в безнадёжных атаках</li>
            </ul>
          </div>
        </div>

        <div style="background: rgba(59, 130, 246, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #3b82f6;">
          <h3 style="color: #60a5fa; margin: 0 0 16px 0; font-size: 20px; font-weight: 600; text-align: center;">
            📈 Общий баланс операции
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center;">
            <div style="background: rgba(34, 197, 94, 0.1); padding: 16px; border-radius: 8px;">
              <div style="font-size: 18px; font-weight: 700; color: #4ade80; margin-bottom: 8px;">ТАКТИЧЕСКИЙ УСПЕХ</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">Прорыв позиционной обороны на широком фронте</div>
            </div>
            <div style="background: rgba(245, 158, 11, 0.1); padding: 16px; border-radius: 8px;">
              <div style="font-size: 18px; font-weight: 700; color: #f59e0b; margin-bottom: 8px;">ОПЕРАТИВНАЯ НЕУДАЧА</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">Стратегические цели не достигнуты</div>
            </div>
            <div style="background: rgba(139, 92, 246, 0.1); padding: 16px; border-radius: 8px;">
              <div style="font-size: 18px; font-weight: 700; color: #c084fc; margin-bottom: 8px;">СТРАТЕГИЧЕСКОЕ ЗНАЧЕНИЕ</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">Переход инициативы к Антанте</div>
            </div>
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
      content: `<div style="max-width: 1200px; margin: 0 auto;">
        <div style="background: rgba(34, 197, 94, 0.1); padding: 32px; border-radius: 16px; margin-bottom: 32px; border-left: 4px solid #22c55e;">
          <p style="font-size: 20px; line-height: 1.6; margin: 0; color: rgba(255, 255, 255, 0.95); font-weight: 400;">
            Наступление Юго-Западного фронта возобновилось в назначенный срок <strong style="color: #4ade80;">22 июня (5 июля)</strong>. Оно велось всеми армиями, кроме 11-й. Главный удар наносился силами <strong style="color: #4ade80;">8-й и 3-й армий на Ковель</strong>.
          </p>
        </div>

        <h2 style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(239, 68, 68, 0.3); padding-bottom: 16px;">
          💥 Прорыв германского фронта
        </h2>

        <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            В результате <strong style="color: #f87171;">трехдневных боев германский фронт был прорван</strong>. Австро-германские войска в беспорядке стали отступать.
          </p>
          
          <div style="background: rgba(34, 197, 94, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #22c55e;">
            <h3 style="color: #4ade80; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
              🏆 Захваченные города
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
              <div style="background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 8px; text-align: center;">
                <strong style="color: #4ade80;">Галузия</strong>
              </div>
              <div style="background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 8px; text-align: center;">
                <strong style="color: #4ade80;">Маневичи</strong>
              </div>
              <div style="background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 8px; text-align: center;">
                <strong style="color: #4ade80;">Городок</strong>
              </div>
            </div>
          </div>
        </div>

        <h2 style="color: #06b6d4; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(6, 182, 212, 0.3); padding-bottom: 16px;">
          🌊 Выход к реке Стоход
        </h2>

        <div style="background: rgba(6, 182, 212, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #06b6d4; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            Войска фронта вышли в нижнем течении на <strong style="color: #06b6d4;">реку Стоход</strong>, захватив кое-где плацдармы на левом берегу.
          </p>
          
          <div style="background: rgba(6, 182, 212, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #06b6d4;">К 1 (14) июля</strong> обе армии заняли линию реки от Любашева до железной дороги Ковель—Луцк, зацепившись в некоторых местах и на левом берегу Стохода.
            </p>
          </div>
        </div>

        <h2 style="color: #f59e0b; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(245, 158, 11, 0.3); padding-bottom: 16px;">
          🚧 Препятствия на Стоходе
        </h2>

        <div style="background: rgba(245, 158, 11, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            Однако попытка форсировать реку Стоход на плечах отступавшего противника <strong style="color: #f59e0b;">успеха не имела</strong>:
          </p>
          
          <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85); line-height: 1.8;">
            <li>Австро-германцы сумели <strong style="color: #f59e0b;">заблаговременно разрушить переправы</strong></li>
            <li>Своими контратаками мешали русским переправиться на западный берег реки</li>
            <li>Преодоление Стохода требовало подготовки атаки сильным артиллерийским огнем</li>
            <li>Необходимо было сосредоточение свежих резервов</li>
          </ul>

          <div style="background: rgba(245, 158, 11, 0.05); padding: 16px; border-radius: 8px; margin-top: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #f59e0b;">Дополнительные препятствия:</strong> Значительную роль в срыве наступления правого фланга 8-й армии сыграл и характер местности (<em style="color: #a78bfa;">леса и болота</em>) в зоне прорыва.
            </p>
          </div>
        </div>

        <h2 style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(239, 68, 68, 0.3); padding-bottom: 16px;">
          ⏸️ Остановка наступления
        </h2>

        <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7; font-size: 18px;">
            Подтянув свежие войска, противник создал в этом месте сильную оборону. <strong style="color: #f87171;">Брусилов вынужден был остановить наступление на Ковель</strong>, чтобы подтянуть резервы и перегруппировать силы.
          </p>
          
          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7; font-style: italic;">
              Этим закончилось развитие <strong style="color: #f87171;">Луцкого прорыва</strong>, так как данная германцам передышка позволила им сгруппироваться и укрепиться на реке Стоходе, и последующие действия развиваются уже в самостоятельные операции ряда сражений на Стоходе на правом фланге Юго-западного фронта.
            </p>
          </div>
        </div>

        <h2 style="color: #6b7280; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(107, 114, 128, 0.3); padding-bottom: 16px;">
          🤝 Действия других фронтов
        </h2>

        <div style="background: rgba(107, 114, 128, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #6b7280; margin-bottom: 32px;">
          <h3 style="color: #9ca3af; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            💔 Неудача Западного фронта
          </h3>
          
          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #ef4444;">3 июля</strong> Западный фронт попытался перейти ударной группировкой в наступление на Барановичи, но в результате боёв 3—8 июля оно было отбито с <strong style="color: #f87171;">большими потерями для русских</strong>.
            </p>
          </div>

          <div style="background: rgba(139, 92, 246, 0.1); padding: 20px; border-radius: 12px; border-left: 3px solid #a855f7; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7; font-style: italic;">
              <strong style="color: #c084fc;">"Атака на Барановичи состоялась, но, как это нетрудно было предвидеть, войска понесли громадные потери при полной неудаче, и на этом закончилась боевая деятельность Западного фронта по содействию моему наступлению."</strong>
            </p>
            <p style="color: rgba(255, 255, 255, 0.7); margin: 12px 0 0 0; font-size: 14px; text-align: right;">
              — Брусилов А. А. Мои воспоминания
            </p>
          </div>

          <h3 style="color: #9ca3af; margin: 20px 0 16px 0; font-size: 20px; font-weight: 600;">
            ⏳ Бездействие Северного фронта
          </h3>
          
          <div style="background: rgba(107, 114, 128, 0.05); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Северный фронт вплоть до <strong style="color: #9ca3af;">9 (22) июля</strong> наступательных действий не вёл, и германское командование начало переброску войск из районов севернее Полесья на юг, против Брусилова.
            </p>
          </div>
        </div>

        <h2 style="color: #8b5cf6; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(139, 92, 246, 0.3); padding-bottom: 16px;">
          📋 Запоздалые решения Ставки
        </h2>

        <div style="background: rgba(139, 92, 246, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #a855f7; margin-bottom: 32px;">
          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Только через <strong style="color: #f87171;">35 дней</strong> после начала прорыва — <strong style="color: #c084fc;">26 июня (9 июля)</strong> — русская Ставка своей директивой поручила ведение главного удара Юго-Западному фронту.
            </p>
          </div>

          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7;">
            При этом предписывалось:
          </p>
          
          <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85); line-height: 1.8;">
            <li><strong style="color: #c084fc;">Западному фронту</strong> — сдерживать противника</li>
            <li><strong style="color: #c084fc;">Северному фронту</strong> — наступать</li>
          </ul>
        </div>

        <h2 style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(239, 68, 68, 0.3); padding-bottom: 16px;">
          💀 Неудачное наступление на Бауск
        </h2>

        <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            В итоге Северный фронт под командованием <strong style="color: #f87171;">генерала А. Н. Куропаткина</strong> предпринял ограниченное наступление на Бауск <strong style="color: #f87171;">9 (22) июля</strong> силами 12-й армии под командованием генерала Р. Д. Радко-Дмитриева.
          </p>
          
          <div style="text-align: center; padding: 20px; background: rgba(239, 68, 68, 0.05); border-radius: 8px;">
            <div style="font-size: 20px; font-weight: 700; color: #ef4444; margin-bottom: 8px;">Результаты наступления:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #ef4444;">6 дней</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">боев без результатов</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #ef4444;">15 000</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">потери 12-й армии</div>
              </div>
            </div>
          </div>
        </div>
      </div>`
    },

    'kovel_battles': {
      title: '1-3 Ковельские сражения',
      subtitle: 'июль - август 1916 года',
      content: `<div style="max-width: 1200px; margin: 0 auto;">
        <div style="background: rgba(139, 92, 246, 0.1); padding: 32px; border-radius: 16px; margin-bottom: 32px; border-left: 4px solid #a855f7;">
          <p style="font-size: 20px; line-height: 1.6; margin: 0; color: rgba(255, 255, 255, 0.95); font-weight: 400;">
            Серия сражений за <strong style="color: #c084fc;">Ковель</strong> — ключевой железнодорожный узел. В июле русская Ставка перебросила на юг стратегический резерв (гвардию и забайкальских казаков), создав <strong style="color: #c084fc;">Особую армию генерала В. М. Безобразова</strong>.
          </p>
        </div>

        <h2 style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(239, 68, 68, 0.3); padding-bottom: 16px;">
          ⚔️ Первое Ковельское сражение
        </h2>

        <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 32px;">
          <h3 style="color: #f87171; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            🎯 Поставленные задачи
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85); line-height: 1.8;">
            <li><strong style="color: #f87171;">3-я, Особая и 8-я армии</strong> — разгромить оборонявшую Ковель группировку противника и взять город</li>
            <li><strong style="color: #f87171;">11-я армия</strong> — наступать на Броды и Львов</li>
            <li><strong style="color: #f87171;">7-я армия</strong> — на Монастыриску</li>
            <li><strong style="color: #f87171;">9-я армия</strong> — повернув на север, должна была атаковать Станислав (Ивано-Франковск)</li>
          </ul>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-top: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              В конце июля состоялось сражение у <strong style="color: #f87171;">Бурканувского леса</strong>.
            </p>
          </div>

          <h3 style="color: #f87171; margin: 20px 0 16px 0; font-size: 20px; font-weight: 600;">
            💥 Наступление 15 (28) июля
          </h3>
          
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7;">
            <strong style="color: #f87171;">15 (28) июля</strong> Юго-Западный фронт начал новое наступление. После массированной артподготовки на прорыв пошла ударная группа (3-я, Особая и 8-я армии). Противник упорно сопротивлялся. Атаки сменялись контратаками.
          </p>

          <div style="display: grid; gap: 16px; margin-bottom: 20px;">
            <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #4ade80;">Особая армия</strong> — одержала победу у местечек Селец и Трыстень
            </div>
            <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #4ade80;">8-я армия</strong> — одолела врага у Кошева и взяла Торчин
            </div>
          </div>

          <div style="text-align: center; padding: 20px; background: rgba(34, 197, 94, 0.05); border-radius: 8px; margin-bottom: 20px;">
            <div style="font-size: 20px; font-weight: 700; color: #4ade80; margin-bottom: 8px;">Результаты трёхдневных боёв:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #4ade80;">17 тыс.</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">пленных</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #4ade80;">86</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">орудий</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #4ade80;">10 км</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">продвижение</div>
              </div>
            </div>
          </div>

          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7;">
            Армии вышли к реке Стоход уже не только в нижнем, но и в верхнем её течении. Людендорф отмечал: <em style="color: #a78bfa;">"Восточный фронт переживал тяжёлые дни"</em>.
          </p>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #f87171;">Но</strong> атаки сильно укреплённых болотистых дефиле на Стоходе закончились неудачей, прорвать оборону немцев и взять Ковель не удалось.
            </p>
          </div>
        </div>

        <h2 style="color: #22c55e; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(34, 197, 94, 0.3); padding-bottom: 16px;">
          🌟 Успехи в центре фронта
        </h2>

        <div style="background: rgba(34, 197, 94, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #22c55e; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            В центре Юго-Западного фронта <strong style="color: #4ade80;">11-я и 7-я армии</strong> при поддержке 9-й армии (ударившей противнику во фланг и тыл) разгромили противостоящие им австро-германские войска и прорвали фронт.
          </p>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Чтобы сдержать наступление русских, австро-германское командование перебрасывало в Галицию всё, что можно: были переброшены даже <strong style="color: #f87171;">две турецкие дивизии с Салоникского фронта</strong>. Но, затыкая дыры, противник вводил в бой новые соединения разрозненно, и их били по очереди.
            </p>
          </div>

          <div style="display: grid; gap: 16px; margin-bottom: 20px;">
            <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #4ade80;">11-я армия</strong> — взяла Броды и, преследуя противника, вышла на подступы ко Львову
            </div>
            <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #4ade80;">7-я армия</strong> — овладела городами Галич и Монастыриска
            </div>
            <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #4ade80;">9-я армия генерала П. А. Лечицкого</strong> — заняла Буковину и 11 августа взяла Станислав
            </div>
          </div>
        </div>

        <h2 style="color: #f59e0b; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(245, 158, 11, 0.3); padding-bottom: 16px;">
          🔄 Второе Ковельское сражение
        </h2>

        <div style="background: rgba(245, 158, 11, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            Попытки продолжать наступление на ковельском направлении продолжались в августе. <strong style="color: #f59e0b;">26 июля (8 августа)</strong> началось Второе Ковельское сражение.
          </p>

          <div style="display: grid; gap: 16px; margin-bottom: 20px;">
            <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #ef4444;">1-й армейский корпус</strong> — наступавший на Большой Порск, был отброшен в исходное положение сильными контратаками
            </div>
            <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px;">
              <strong style="color: #ef4444;">Гвардия</strong> — атаковавшая от Велицка в направлении к юго-западу от Кухарского леса, также была вынуждена отойти
            </div>
          </div>

          <div style="background: rgba(245, 158, 11, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #f59e0b;">27 (9 августа)</strong> начала наступление 3-я армия. Успех имел один 3-й корпус. В Особой армии Гвардейская стрелковая дивизия заняла Витонеж, но была выбита оттуда огнем вражеской артиллерии.
            </p>
          </div>

          <div style="background: rgba(245, 158, 11, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              8-я армия оба дня, 26-го и 27-го, вела безрезультатные бои у Киселина.
            </p>
          </div>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Генерал Брусилов пытался оживить явно сорвавшуюся операцию, однако новое наступление 3-й армии на Любашев, а гвардии на Витонеж повлекло только новые потери. <strong style="color: #f87171;">29 июля (11 августа) атаки были прекращены</strong>.
            </p>
          </div>
        </div>

        <h2 style="color: #8b5cf6; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(139, 92, 246, 0.3); padding-bottom: 16px;">
          🔀 Третье Ковельское сражение
        </h2>

        <div style="background: rgba(139, 92, 246, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #a855f7;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            Несмотря на неудачи наступления на Ковель в июле-августе 1916 года Ставка не отказалась от продолжения операции. <strong style="color: #c084fc;">Операция была передана с Юго-Западного фронта на Западный</strong>.
          </p>

          <div style="background: rgba(139, 92, 246, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              С <strong style="color: #c084fc;">30 июля (12 августа)</strong> 3-я армия и армия Безобразова были переданы Западному фронту, которому предлагалось решительно атаковать войска противника, прикрывавшие Ковель. Юго-Западный фронт Брусилова 8-й армией должен был содействовать наступлению и атаковать в направлении на Владимир-Волынский.
            </p>
          </div>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Уже <strong style="color: #ef4444;">11 (24) августа</strong> командующий Западным фронтом Эверт потребовал перенести начало операции с 15 (28) августа на 23-24 (5-6 сентября), а затем дотянув с откладыванием атаки до 20 августа (2 сентября), не оказав никакого содействия Юго-Западному фронту в его начавшемся наступлении, в этот день пришел к заключению о невозможности атаковать.
            </p>
          </div>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #f87171;">Вместо трёх армий на Ковель наступала одна 8-я армия</strong> Юго-Западного фронта.
            </p>
          </div>

          <div style="background: rgba(139, 92, 246, 0.05); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #c084fc;">18 (31) августа</strong> ударные корпуса 8-й армии начали наступление, которым удалось на некоторых участках занять 1-2 линии неприятельских окопов, а также деревни Шельвов, Бубнов и Корытницу, но большую часть захваченного пришлось под влиянием немецких контратак уступить обратно. <strong style="color: #c084fc;">21 августа (3 сентября)</strong> генерал Каледин повторил удар, но с тем же результатом.
            </p>
          </div>
        </div>
      </div>`
    },

    'halych_offensive': {
      title: 'Наступление на Галич',
      subtitle: '18 (31) августа 1916 года',
      content: `<div style="max-width: 1200px; margin: 0 auto;">
        <div style="background: rgba(34, 197, 94, 0.1); padding: 32px; border-radius: 16px; margin-bottom: 32px; border-left: 4px solid #22c55e;">
          <p style="font-size: 20px; line-height: 1.6; margin: 0; color: rgba(255, 255, 255, 0.95); font-weight: 400;">
            В директиве от <strong style="color: #4ade80;">29 июля (11 августа)</strong> Алексеевым указывалось Юго-Западному фронту развить успех левофланговых армий и, по возможности, разъединить австро-германские войска, действующие на фронте Броды-Кимполунг, от главной массы, сосредоточенной на Ковельском и Владимиро-Волынском направлениях.
          </p>
        </div>

        <h2 style="color: #8b5cf6; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(139, 92, 246, 0.3); padding-bottom: 16px;">
          📋 Планирование операции
        </h2>

        <div style="background: rgba(139, 92, 246, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #a855f7; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            Во исполнение этой директивы <strong style="color: #c084fc;">4 (17) августа</strong> командующий Юго-Западным фронтом генерал А. А. Брусилов приказал своим армиям наступать <strong style="color: #c084fc;">16-го (29-го) числа</strong>.
          </p>

          <h3 style="color: #c084fc; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            🎯 Первоначальные задачи армий
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85); line-height: 1.8;">
            <li><strong style="color: #c084fc;">8-й армии</strong> — атаковать на Владимир-Волынский</li>
            <li><strong style="color: #c084fc;">11-й армии</strong> — на Бережаны</li>
            <li><strong style="color: #c084fc;">7-й армии</strong> — способствовать соседям</li>
            <li><strong style="color: #c084fc;">9-й армии</strong> — наступать по двум расходящимся направлениям — на Галич и на Мармарош—Сигет</li>
          </ul>

          <div style="background: rgba(139, 92, 246, 0.05); padding: 16px; border-radius: 8px; margin-top: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #c084fc;">Изменение плана:</strong> Ввиду протеста генерала Лечицкого галичское направление было передано вместе с нацеленными на него 33-им и 41-ым корпусами в 7-ю армию.
            </p>
          </div>

          <div style="background: rgba(245, 158, 11, 0.1); padding: 16px; border-radius: 8px; margin-top: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Все наступление было отложено на два дня по просьбе штаба 7-й армии, производившей перегруппировку ввиду нового своего задания — наступать на Галич. <strong style="color: #f59e0b;">18 (31) августа</strong> армии Юго-Западного фронта перешли в общее наступление.
            </p>
          </div>
        </div>

        <h2 style="color: #22c55e; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(34, 197, 94, 0.3); padding-bottom: 16px;">
          ⚔️ Наступление 7-й армии генерала Щербачёва
        </h2>

        <div style="background: rgba(34, 197, 94, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #22c55e; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            7-й армии генерала Щербачёва после <strong style="color: #4ade80;">пятидневных боёв</strong> удалось <strong style="color: #4ade80;">23 августа (5 сентября)</strong> силами центральных трёх корпусов прорвать оборону германской Южной армии генерала Ботмера и выйти к рекам Гнилая Липа и Нараевка.
          </p>

          <div style="text-align: center; padding: 20px; background: rgba(34, 197, 94, 0.05); border-radius: 8px; margin-bottom: 20px;">
            <div style="font-size: 20px; font-weight: 700; color: #4ade80; margin-bottom: 8px;">Ширина прорыва:</div>
            <div style="font-size: 28px; font-weight: 700; color: #4ade80;">10 км</div>
          </div>

          <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Днем <strong style="color: #4ade80;">25 августа (7 сентября)</strong> после мощной артподготовки:
            </p>
            <ul style="margin: 12px 0 0 20px; padding: 0; color: rgba(255, 255, 255, 0.85); line-height: 1.6;">
              <li><strong style="color: #4ade80;">33-й корпус</strong> переправился через Гнилую Липу севернее Галича и Нараевку у Большовцев</li>
              <li><strong style="color: #4ade80;">22-й корпус</strong> — у Скоморох</li>
            </ul>
          </div>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #ef4444;">26 августа (8 сентября)</strong> подошедшие немецкие резервы (две дивизии) контратаками заставили русские войска оставить захваченные плацдармы и отступить за реки.
            </p>
          </div>

          <h3 style="color: #4ade80; margin: 20px 0 16px 0; font-size: 20px; font-weight: 600;">
            📊 Итоги операции 7-й армии
          </h3>
          
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7;">
            Несмотря на то что наступление 7-й армии на Галич завершилось захватом незначительной территории, в ходе операции <strong style="color: #4ade80;">10 пехотных дивизий генерала Щербачёва разгромили 14,5 неприятельских</strong> (7 германских, 5,5 австро-венгерских, 2 турецких).
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px;">
            <div style="text-align: center; background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 8px;">
              <div style="font-size: 20px; font-weight: 700; color: #4ade80;">29 000</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 12px;">пленных</div>
              <div style="color: rgba(255, 255, 255, 0.7); font-size: 11px;">(8500 германцев)</div>
            </div>
            <div style="text-align: center; background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 8px;">
              <div style="font-size: 20px; font-weight: 700; color: #4ade80;">25</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 12px;">орудий</div>
            </div>
            <div style="text-align: center; background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 8px;">
              <div style="font-size: 20px; font-weight: 700; color: #4ade80;">30</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 12px;">миномётов</div>
            </div>
            <div style="text-align: center; background: rgba(34, 197, 94, 0.05); padding: 12px; border-radius: 8px;">
              <div style="font-size: 20px; font-weight: 700; color: #4ade80;">200</div>
              <div style="color: rgba(255, 255, 255, 0.8); font-size: 12px;">пулемётов</div>
            </div>
          </div>

          <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px; margin-top: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7; text-align: center; font-style: italic;">
              И <strong style="color: #4ade80;">огромная добыча</strong>
            </p>
          </div>
        </div>

        <h2 style="color: #f59e0b; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(245, 158, 11, 0.3); padding-bottom: 16px;">
          🛡️ Действия 11-й армии
        </h2>

        <div style="background: rgba(245, 158, 11, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7; font-size: 18px;">
            11-я армия (45-й, 5-й Сибирский, 32-й, 17-й, 7-й и вновь переданный 6-й армейский корпуса) генерала Сахарова атаковала тремя левофланговыми корпусами.
          </p>

          <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #4ade80;">7-й армейский корпус</strong> имел тактический успех у Зборова.
            </p>
          </div>

          <div style="background: rgba(245, 158, 11, 0.05); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              К <strong style="color: #f59e0b;">22 августа (4 сентября)</strong> наступление здесь замерло.
            </p>
          </div>
        </div>
      </div>`
    },

    'fourth_kovel_battle': {
      title: 'Четвертое Ковельское Сражение',
      subtitle: 'сентябрь - октябрь 1916 года',
      content: `<div style="max-width: 1200px; margin: 0 auto;">
        <div style="background: rgba(239, 68, 68, 0.1); padding: 32px; border-radius: 16px; margin-bottom: 32px; border-left: 4px solid #ef4444;">
          <p style="font-size: 20px; line-height: 1.6; margin: 0; color: rgba(255, 255, 255, 0.95); font-weight: 400;">
            После трехнедельного перерыва в боях под Ковелем Алексеев решил ещё раз атаковать город. На этот раз <strong style="color: #f87171;">общее руководство операцией вновь перешло к Брусилову</strong>, который решил попробовать атаковать в обход с юга, через Владимир-Волынский.
          </p>
        </div>

        <h2 style="color: #8b5cf6; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(139, 92, 246, 0.3); padding-bottom: 16px;">
          🎯 Новая стратегия
        </h2>

        <div style="background: rgba(139, 92, 246, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #a855f7; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            Для обхода Ковеля с юга <strong style="color: #c084fc;">гвардейские пехотные корпуса были переданы в 8-ю армию</strong>. Западный фронт должен был обеспечивать своим левым флангом наступление Юго-Западного фронта.
          </p>

          <h3 style="color: #c084fc; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            📋 Задачи армий
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85); line-height: 1.8;">
            <li><strong style="color: #c084fc;">11-я и 7-я армии</strong> — наступать на Львов и Галич</li>
            <li><strong style="color: #c084fc;">9-я армия</strong> — продолжать выполнение прежней задачи в Буковине и Лесистых Карпатах</li>
          </ul>
        </div>

        <h2 style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(239, 68, 68, 0.3); padding-bottom: 16px;">
          ⚔️ Начало наступления
        </h2>

        <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            <strong style="color: #f87171;">3 (16) сентября</strong> началось это широко задуманное наступление. Генерал Каледин ударил центром — 40-ым армейским, 2-ым гвардейским, 1-ым гвардейским и 8-ым армейскими корпусами.
          </p>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Наступление было отражено по всему фронту у <strong style="color: #f87171;">Шельвова, Бубнова и Корытницы</strong>.
            </p>
          </div>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #f87171;">7 (20) сентября</strong> Каледин повторил атаку:
            </p>
            <ul style="margin: 12px 0 0 20px; padding: 0; color: rgba(255, 255, 255, 0.85); line-height: 1.6;">
              <li><strong style="color: #f87171;">8-й армейский корпус</strong> овладел Корытницей</li>
              <li><strong style="color: #f87171;">1-й гвардейский корпус</strong> — Свинюхами</li>
            </ul>
          </div>

          <div style="text-align: center; padding: 20px; background: rgba(239, 68, 68, 0.05); border-radius: 8px;">
            <div style="font-size: 20px; font-weight: 700; color: #ef4444; margin-bottom: 8px;">Цена скромного успеха:</div>
            <div style="font-size: 28px; font-weight: 700; color: #ef4444;">до 30 000</div>
            <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">человек потерь</div>
          </div>
        </div>

        <h2 style="color: #6b7280; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(107, 114, 128, 0.3); padding-bottom: 16px;">
          💀 Итог операции
        </h2>

        <div style="background: rgba(107, 114, 128, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #6b7280;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7; font-size: 18px; text-align: center; font-style: italic;">
            <strong style="color: #9ca3af;">Кровопролитнейшее Четвёртое Ковельское сражение окончилось безрезультатно</strong>
          </p>
        </div>
      </div>`
    },

    'fifth_kovel_battle': {
      title: 'Пятое Ковельское сражение',
      subtitle: '17 (30) сентября - октябрь 1916 года',
      content: `<div style="max-width: 1200px; margin: 0 auto;">
        <div style="background: rgba(6, 182, 212, 0.1); padding: 32px; border-radius: 16px; margin-bottom: 32px; border-left: 4px solid #06b6d4;">
          <p style="font-size: 20px; line-height: 1.6; margin: 0; color: rgba(255, 255, 255, 0.95); font-weight: 400;">
            Неудача под Ковелем повлияла на Ставку, и генерал Алексеев под впечатлением августовской победы 7-й армии Щербачёва на «двух Липах» советовал Брусилову перенести центр тяжести на юг — в 7-ю и 9-ю армии. Но <strong style="color: #06b6d4;">Брусилов пренебрег «советами» Ставки и в пятый раз решил повторить наступление</strong>, не удавшееся четыре раза.
          </p>
        </div>

        <h2 style="color: #8b5cf6; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(139, 92, 246, 0.3); padding-bottom: 16px;">
          🔄 Новая организация сил
        </h2>

        <div style="background: rgba(139, 92, 246, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #a855f7; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            <strong style="color: #c084fc;">Особой армии</strong> (командующий генерал В. И. Гурко) были переданы правофланговые 39-й и 40-й армейские корпуса 8-й армии и 4-й Сибирский корпус резерва фронта.
          </p>

          <h3 style="color: #c084fc; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            🎯 Задачи армий
          </h3>
          <ul style="margin: 0; padding-left: 20px; color: rgba(255, 255, 255, 0.85); line-height: 1.8;">
            <li><strong style="color: #c084fc;">Особая армия</strong> — активная оборона линии Стохода («короткими ударами») и решительное наступление на Владимир-Волынский левым флангом в обход Ковеля с юга</li>
            <li><strong style="color: #c084fc;">8-я армия</strong> — содействовать генералу Гурко наступлением на Грубешов</li>
            <li><strong style="color: #c084fc;">11-я армия</strong> — по-прежнему бить на Львов</li>
            <li><strong style="color: #c084fc;">7-я армия</strong> — на Галич (усилена за счет 11-й 3-м Кавказским корпусом)</li>
            <li><strong style="color: #c084fc;">9-я армия</strong> — на Дорна-Ватру</li>
          </ul>

          <div style="background: rgba(139, 92, 246, 0.05); padding: 16px; border-radius: 8px; margin-top: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Общее наступление всего фронта было назначено на <strong style="color: #c084fc;">17 (30) сентября</strong>.
            </p>
          </div>
        </div>

        <h2 style="color: #ef4444; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(239, 68, 68, 0.3); padding-bottom: 16px;">
          💥 Начало атаки
        </h2>

        <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            <strong style="color: #f87171;">19 сентября (2 октября)</strong> после внушительной артиллерийской подготовки, на которую энергично отвечал и противник, Особая и 8-я армии начали атаку.
          </p>

          <div style="text-align: center; padding: 20px; background: rgba(239, 68, 68, 0.05); border-radius: 8px; margin-bottom: 20px;">
            <div style="font-size: 20px; font-weight: 700; color: #ef4444; margin-bottom: 8px;">Соотношение сил:</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #ef4444;">14</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">русских дивизий</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: 700; color: #ef4444;">12</div>
                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px;">неприятельских дивизий</div>
              </div>
            </div>
          </div>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Противник: германская группа Бекмана, 6-й германский корпус Марвица и IV австро-венгерская армия, занимавших оборудованные по-крепостному позиции и располагавших <strong style="color: #f87171;">вдвое сильнейшей артиллерией</strong>.
            </p>
          </div>
        </div>

        <h2 style="color: #22c55e; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(34, 197, 94, 0.3); padding-bottom: 16px;">
          ⚔️ Ход сражения
        </h2>

        <div style="background: rgba(34, 197, 94, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #22c55e; margin-bottom: 32px;">
          <h3 style="color: #4ade80; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
            🌟 Особая армия
          </h3>
          
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7;">
            Особая армия атаковала левым крылом, развернув <strong style="color: #4ade80;">39-й, 25-й, 34-й и 40-й армейские корпуса</strong>.
          </p>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              На второй день наступления в Особой армии почувствовался <strong style="color: #f87171;">недостаток тяжелых снарядов</strong>, и при их неподвозе Гурко грозил 22 сентября (5 октября) операцию даже при успехе приостановить.
            </p>
          </div>

          <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Слабость технических средств не могла возместиться доблестью войск. Решительный Гурко продолжал непрерывно наносить удары, пока <strong style="color: #4ade80;">22 сентября (5 октября) не истощил своих войск</strong>.
            </p>
          </div>

          <h3 style="color: #4ade80; margin: 20px 0 16px 0; font-size: 20px; font-weight: 600;">
            🛡️ 8-я армия
          </h3>

          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 16px 0; line-height: 1.7;">
            8-я армия нанесла удар тремя правофланговыми корпусами — <strong style="color: #4ade80;">1-м гвардейским, 2-м гвардейским и 8-м армейским</strong>.
          </p>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Большинство атак были отражены противником ружейным, пулемётным и заградительным артиллерийским огнем, а также контратаками. Атака Квадратного леса закончилась неудачей.
            </p>
          </div>

          <div style="background: rgba(34, 197, 94, 0.05); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Только <strong style="color: #4ade80;">преображенцы</strong> удержали за собой высоту в двух верстах севернее Корытницы и закрепились на ней.
            </p>
          </div>
        </div>

        <h2 style="color: #f59e0b; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(245, 158, 11, 0.3); padding-bottom: 16px;">
          ⏸️ Завершение операции
        </h2>

        <div style="background: rgba(245, 158, 11, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 32px;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            К <strong style="color: #f59e0b;">22 сентября (5 октября)</strong> войска на фронтах обеих армий выдохлись и атаки постепенно заглохли.
          </p>

          <div style="background: rgba(139, 92, 246, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              Несмотря на видимую неудачу, <strong style="color: #c084fc;">Брусилов настаивал на продолжении операции</strong>, ожидая от неё успеха.
            </p>
          </div>

          <div style="background: rgba(239, 68, 68, 0.05); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #f87171;">Алексеев этому уже не верил</strong>, а усложнявшаяся обстановка в Румынии влекла все его внимание на юг, и потому для него было весьма важно поскорее прекратить Ковельскую операцию, невольно отвлекающую силы в другую сторону.
            </p>
          </div>

          <div style="background: rgba(107, 114, 128, 0.1); padding: 16px; border-radius: 8px;">
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7;">
              <strong style="color: #9ca3af;">Верховный Главнокомандующий (Николай II)</strong> решительно воспротивился дальнейшему развитию операции Особой и 8-й армий, находя, что она пообещает наименьший успех при громадных потерях.
            </p>
          </div>
        </div>

        <h2 style="color: #6b7280; font-size: 28px; font-weight: 700; margin: 40px 0 24px 0; text-align: center; border-bottom: 2px solid rgba(107, 114, 128, 0.3); padding-bottom: 16px;">
          🏁 Конец Брусиловского наступления
        </h2>

        <div style="background: rgba(107, 114, 128, 0.1); padding: 24px; border-radius: 12px; border-left: 4px solid #6b7280;">
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.7; font-size: 18px; text-align: center; font-style: italic;">
            Таким образом завершилась <strong style="color: #9ca3af;">активная фаза Брусиловского наступления</strong> — одной из самых значительных операций Первой мировой войны.
          </p>
        </div>
      </div>`
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

  // Функции для управления модальным окном контактов
  const openContactsModal = () => {
    setShowContacts(true);
  };

  const closeContactsModal = () => {
    setIsContactsClosing(true);
    setTimeout(() => {
      setShowContacts(false);
      setIsContactsClosing(false);
    }, 300); // Время анимации
  };

  // Обработчик для контактов overlay
  const handleContactsOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeContactsModal();
    }
  };

  // Обработчики для закрытия модальных окон кликом по overlay
  const handleRiverOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeRiverModal();
    }
  };

  // Полноэкранное окно не закрывается по клику, только по ESC или кнопке закрытия

  // Обработчик для закрытия модальных окон клавишей Escape и навигация в галерее
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showTour && !isTourClosing) {
          closeTour();
        } else if (showGallery && !isGalleryClosing) {
          closeGallery();
        } else if (showHistoricalMap && !isHistoricalMapClosing) {
          closeHistoricalMap();
        } else if (showContacts && !isContactsClosing) {
          closeContactsModal();
        } else if (showOperationInfo && !isOperationInfoClosing) {
          closeOperationInfoModal();
        } else if (selectedRiver && !isRiverModalClosing) {
          closeRiverModal();
        }
      } else if (showGallery && !isGalleryClosing) {
        // Навигация в галерее стрелками
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          prevGalleryImage();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          nextGalleryImage();
        }
      }
    };

    if (selectedRiver || showOperationInfo || showContacts || showTour || showGallery || showHistoricalMap) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedRiver, isRiverModalClosing, showOperationInfo, isOperationInfoClosing, showContacts, isContactsClosing, showTour, isTourClosing, showGallery, isGalleryClosing, showHistoricalMap, isHistoricalMapClosing]);



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
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 50%, rgba(15, 15, 35, 0.9) 100%)',
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
            <div style={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 60px rgba(236, 72, 153, 0.3), 0 0 100px rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(236, 72, 153, 0.2)' 
            }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%', borderRadius: '16px' }}
                scrollWheelZoom={true}
                maxBounds={mapBounds}
                maxBoundsViscosity={1.0}
                minZoom={6}
                maxZoom={12}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/nolabels/{z}/{x}/{y}{r}.png"
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
                data-tour="legend-button"
                onClick={() => {
                  setShowLegend(!showLegend);
                  setShowHeader(!showHeader);
                }}
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '24px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 50%, rgba(168, 85, 247, 0.8) 100%)',
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
                  boxShadow: '0 15px 35px rgba(99, 102, 241, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
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

              {/* Кнопка исторической карты */}
              <button
                onClick={openHistoricalMap}
                style={{
                  position: 'absolute',
                  bottom: '84px',
                  left: '24px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.8) 0%, rgba(251, 146, 60, 0.8) 50%, rgba(249, 115, 22, 0.8) 100%)',
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
                  boxShadow: '0 15px 35px rgba(245, 158, 11, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                title="Историческая карта Брусиловского прорыва"
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px) scale(1.05)';
                  e.target.style.boxShadow = '0 20px 40px rgba(245, 158, 11, 0.5), 0 8px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 15px 35px rgba(245, 158, 11, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
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
                  <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
                  <path d="M8 2v16"/>
                  <path d="M16 6v16"/>
                </svg>
              </button>

              {/* Кнопка информации об операции */}
              <button
                className="operation-info-button"
                data-tour="info-button"
                onClick={() => setShowOperationInfo(true)}
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(251, 146, 60, 0.8) 50%, rgba(245, 158, 11, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  zIndex: 1001,
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 15px 35px rgba(239, 68, 68, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  fontFamily: 'Rubik, sans-serif',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
                title="Информация об операции"
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(251, 146, 60, 0.95) 50%, rgba(245, 158, 11, 0.95) 100%)';
                  e.target.style.transform = 'translateY(-4px) scale(1.02)';
                  e.target.style.boxShadow = '0 25px 50px rgba(239, 68, 68, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  e.target.style.letterSpacing = '1px';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(251, 146, 60, 0.8) 50%, rgba(245, 158, 11, 0.8) 100%)';
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 15px 35px rgba(239, 68, 68, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  e.target.style.letterSpacing = '0.8px';
                }}
                onMouseDown={(e) => {
                  e.target.style.transform = 'translateY(-1px) scale(0.98)';
                  e.target.style.boxShadow = '0 15px 30px rgba(239, 68, 68, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3)';
                }}
                onMouseUp={(e) => {
                  e.target.style.transform = 'translateY(-4px) scale(1.02)';
                  e.target.style.boxShadow = '0 25px 50px rgba(239, 68, 68, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
              >
                ИНФОРМАЦИЯ
              </button>

              {/* Кнопка галереи */}
              <button
                onClick={openGallery}
                data-tour="gallery-button"
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '190px',
                  background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.8) 0%, rgba(147, 51, 234, 0.8) 50%, rgba(168, 85, 247, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  zIndex: 1001,
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 15px 35px rgba(147, 51, 234, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  fontFamily: 'Rubik, sans-serif',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  gap: '8px'
                }}
                title="Историческая галерея"
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(109, 40, 217, 0.95) 0%, rgba(147, 51, 234, 0.95) 50%, rgba(168, 85, 247, 0.95) 100%)';
                  e.target.style.transform = 'translateY(-4px) scale(1.02)';
                  e.target.style.boxShadow = '0 25px 50px rgba(147, 51, 234, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  e.target.style.letterSpacing = '1px';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(109, 40, 217, 0.8) 0%, rgba(147, 51, 234, 0.8) 50%, rgba(168, 85, 247, 0.8) 100%)';
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 15px 35px rgba(147, 51, 234, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  e.target.style.letterSpacing = '0.8px';
                }}
                onMouseDown={(e) => {
                  e.target.style.transform = 'translateY(-1px) scale(0.98)';
                  e.target.style.boxShadow = '0 15px 30px rgba(147, 51, 234, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3)';
                }}
                onMouseUp={(e) => {
                  e.target.style.transform = 'translateY(-4px) scale(1.02)';
                  e.target.style.boxShadow = '0 25px 50px rgba(147, 51, 234, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                  }}
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <path d="M21 15l-5-5L5 21l5-5"></path>
                </svg>
                ГАЛЕРЕЯ
              </button>

              {/* Кнопка контактов */}
              <button
                onClick={openContactsModal}
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '337px',
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.8) 50%, rgba(185, 28, 28, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  zIndex: 1001,
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 15px 35px rgba(220, 38, 38, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  fontFamily: 'Rubik, sans-serif',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  gap: '8px'
                }}
                title="Контакты разработчиков"
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(239, 68, 68, 0.95) 50%, rgba(185, 28, 28, 0.95) 100%)';
                  e.target.style.transform = 'translateY(-4px) scale(1.02)';
                  e.target.style.boxShadow = '0 25px 50px rgba(220, 38, 38, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  e.target.style.letterSpacing = '1px';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.8) 50%, rgba(185, 28, 28, 0.8) 100%)';
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 15px 35px rgba(220, 38, 38, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  e.target.style.letterSpacing = '0.8px';
                }}
                onMouseDown={(e) => {
                  e.target.style.transform = 'translateY(-1px) scale(0.98)';
                  e.target.style.boxShadow = '0 15px 30px rgba(220, 38, 38, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3)';
                }}
                onMouseUp={(e) => {
                  e.target.style.transform = 'translateY(-4px) scale(1.02)';
                  e.target.style.boxShadow = '0 25px 50px rgba(220, 38, 38, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                  }}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                КОНТАКТЫ
              </button>

              {/* Кнопка повторного тура */}
              {localStorage.getItem('brusilov-tour-completed') && (
                <button
                  onClick={() => {
                    setCurrentTourStep(0);
                    setShowTour(true);
                  }}
                  style={{
                    position: 'absolute',
                    top: '24px',
                    right: '499px',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.8) 50%, rgba(5, 150, 105, 0.8) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    zIndex: 1001,
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 15px 35px rgba(34, 197, 94, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    fontFamily: 'Rubik, sans-serif',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px) scale(1.02)';
                    e.target.style.boxShadow = '0 25px 50px rgba(34, 197, 94, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                    e.target.style.letterSpacing = '1px';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = '0 15px 35px rgba(34, 197, 94, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    e.target.style.letterSpacing = '0.5px';
                  }}
                  onMouseDown={(e) => {
                    e.target.style.transform = 'translateY(-1px) scale(0.98)';
                    e.target.style.boxShadow = '0 15px 30px rgba(34, 197, 94, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseUp={(e) => {
                    e.target.style.transform = 'translateY(-4px) scale(1.02)';
                    e.target.style.boxShadow = '0 25px 50px rgba(34, 197, 94, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  }}
                  title="Повторить вводный тур"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '6px' }}
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M15 3l3 3-3 3"/>
                  </svg>
                  ТУР
                </button>
              )}

              {/* Легенда */}
              <div
                className={`legend ${showLegend ? 'show' : 'hide'}`}
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '80px',
                  background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 50%, rgba(15, 15, 35, 0.9) 100%)',
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
                  ЛЕГЕНДА
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
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, rgba(30, 30, 60, 0.95) 0%, rgba(20, 20, 40, 0.95) 100%)',
                padding: '20px 28px',
                borderRadius: '28px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 8px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                zIndex: 1000,
                backdropFilter: 'blur(25px)',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}>
                {/* Выбор хода операции */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'Rubik, sans-serif',
                    letterSpacing: '0.3px',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                        color: '#a855f7'
                      }}
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Фаза операции:
                  </label>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <select
                      value={selectedPhase}
                      onChange={(e) => setSelectedPhase(e.target.value)}
                      className="control-element"
                      data-tour="phase-selector"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 50%, rgba(168, 85, 247, 0.8) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '16px',
                        padding: '14px 50px 14px 20px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600',
                        outline: 'none',
                        letterSpacing: '0.5px',
                        fontFamily: 'Rubik, sans-serif',
                        cursor: 'pointer',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 15px 35px rgba(99, 102, 241, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        minWidth: '320px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 50%, rgba(168, 85, 247, 0.95) 100%)';
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 25px 50px rgba(99, 102, 241, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                        e.currentTarget.style.letterSpacing = '1px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 50%, rgba(168, 85, 247, 0.8) 100%)';
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 15px 35px rgba(99, 102, 241, 0.4), 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.letterSpacing = '0.8px';
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px) scale(0.98)';
                        e.currentTarget.style.boxShadow = '0 15px 30px rgba(99, 102, 241, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 25px 50px rgba(99, 102, 241, 0.6), 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
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
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
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
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 50%, rgba(15, 15, 35, 0.95) 100%)',
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
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.8) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '14px',
                width: '56px',
                height: '56px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                flexShrink: 0,
                outline: 'none',
                boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(15px)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(239, 68, 68, 0.9) 100%)';
                e.target.style.transform = 'scale(1.05) translateY(-2px)';
                e.target.style.boxShadow = '0 12px 35px rgba(220, 38, 38, 0.4), 0 6px 16px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.8) 100%)';
                e.target.style.transform = 'scale(1) translateY(0px)';
                e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
              onMouseDown={(e) => {
                e.target.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.target.style.transform = 'scale(1.05) translateY(-2px)';
              }}
              title="Закрыть (ESC)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                }}
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
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
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 50%, rgba(15, 15, 35, 0.95) 100%)',
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

      {/* Тур для новых пользователей */}
      {showTour && (
        <div
          className={`tour-overlay ${isTourClosing ? 'closing' : ''}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isTourClosing ? 'overlayFadeOut 0.3s ease-out forwards' : 'overlayFadeIn 0.3s ease-out forwards'
          }}
        >
          <div
            className={`tour-card ${isTourClosing ? 'closing' : ''}`}
            style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 50%, rgba(15, 15, 35, 0.95) 100%)',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 80px rgba(99, 102, 241, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              animation: isTourClosing ? 'modalFadeOut 0.3s ease-out forwards' : 'modalFadeIn 0.3s ease-out forwards',
              position: 'relative'
            }}
          >
            {/* Заголовок */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                color: '#ffffff',
                fontWeight: '700',
                fontFamily: 'Rubik, sans-serif',
                lineHeight: '1.3'
              }}>
                {tourSteps[currentTourStep]?.title}
              </h2>
              <button
                onClick={skipTour}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'rgba(255, 255, 255, 0.6)';
                }}
                title="Пропустить тур"
              >
                ×
              </button>
            </div>

            {/* Контент */}
            <p style={{
              margin: '0 0 32px 0',
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: '1.6',
              fontFamily: 'Rubik, sans-serif'
            }}>
              {tourSteps[currentTourStep]?.content}
            </p>

            {/* Прогресс */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px'
            }}>
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: index === currentTourStep 
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : 'rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>

            {/* Кнопки навигации */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              {/* Кнопка "Назад" */}
              <button
                onClick={prevTourStep}
                disabled={currentTourStep === 0}
                style={{
                  background: currentTourStep === 0 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'linear-gradient(135deg, rgba(75, 85, 99, 0.8) 0%, rgba(55, 65, 81, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: currentTourStep === 0 ? 'rgba(255, 255, 255, 0.5)' : '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: currentTourStep === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Rubik, sans-serif',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  if (currentTourStep > 0) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                ← Назад
              </button>

              {/* Шаг */}
              <span style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                fontFamily: 'Rubik, sans-serif'
              }}>
                {currentTourStep + 1} из {tourSteps.length}
              </span>

              {/* Кнопка "Далее/Завершить" */}
              <button
                onClick={nextTourStep}
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(139, 92, 246, 0.8) 50%, rgba(168, 85, 247, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontFamily: 'Rubik, sans-serif',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
                }}
              >
                {currentTourStep === tourSteps.length - 1 ? 'Завершить' : 'Далее →'}
              </button>
            </div>

            {/* Кнопка "Пропустить" внизу */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '16px'
            }}>
              <button
                onClick={skipTour}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: '8px',
                  transition: 'color 0.3s ease',
                  fontFamily: 'Rubik, sans-serif',
                  textDecoration: 'underline'
                }}
                onMouseEnter={(e) => {
                  e.target.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = 'rgba(255, 255, 255, 0.6)';
                }}
              >
                Пропустить тур
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно контактов */}
      {showContacts && (
        <div
          className={`modal-overlay ${isContactsClosing ? 'closing' : ''}`}
          onClick={handleContactsOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            className={`modal-content ${isContactsClosing ? 'closing' : ''}`}
            style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 50%, rgba(15, 15, 35, 0.95) 100%)',
              padding: '32px',
              borderRadius: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 80px rgba(99, 102, 241, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* Заголовок */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '32px' 
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '28px', 
                color: '#ffffff',
                fontWeight: '700',
                fontFamily: 'Rubik, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    color: '#22c55e',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                  }}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Команда разработчиков
              </h2>
              <button
                onClick={closeContactsModal}
                style={{
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '14px',
                  width: '56px',
                  height: '56px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  flexShrink: 0,
                  outline: 'none',
                  boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(15px)',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(239, 68, 68, 0.9) 100%)';
                  e.target.style.transform = 'scale(1.05) translateY(-2px)';
                  e.target.style.boxShadow = '0 12px 35px rgba(220, 38, 38, 0.4), 0 6px 16px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.8) 100%)';
                  e.target.style.transform = 'scale(1) translateY(0px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)';
                }}
                onMouseDown={(e) => {
                  e.target.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.target.style.transform = 'scale(1.05) translateY(-2px)';
                }}
                title="Закрыть (ESC)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                  }}
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Разработчики */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Артем Джапаридзе */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}>
                <img
                  src={ArtemPhoto}
                  alt="Артем Джапаридзе"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #6366f1',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                  }}
                  onError={(e) => {
                    // Фолбэк на инициалы если изображение не загрузится
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ffffff',
                  flexShrink: 0,
                  fontFamily: 'Rubik, sans-serif'
                }}>
                  АД
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '20px',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontFamily: 'Rubik, sans-serif'
                  }}>
                    Артем Джапаридзе
                  </h3>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: 'Rubik, sans-serif'
                  }}>
                    Разработчик
                  </p>
                  <a
                    href="https://t.me/airsss993"
                    target="_blank"
                    style={{
                      color: '#6366f1',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: 'Rubik, sans-serif',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#8b5cf6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#6366f1';
                    }}
                  >
                    Связаться →
                  </a>
                </div>
              </div>

              {/* Иван Коломацкий */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}>
                <img
                  src={IvanPhoto}
                  alt="Иван Коломацкий"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #22c55e',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                  }}
                  onError={(e) => {
                    // Фолбэк на инициалы если изображение не загрузится
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ffffff',
                  flexShrink: 0,
                  fontFamily: 'Rubik, sans-serif'
                }}>
                  ИК
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '20px',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontFamily: 'Rubik, sans-serif'
                  }}>
                    Иван Коломацкий
                  </h3>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: 'Rubik, sans-serif'
                  }}>
                    Разработчик
                  </p>
                  <a
                    href="https://t.me/IKolomatskii"
                    target="_blank"
                    style={{
                      color: '#22c55e',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: 'Rubik, sans-serif',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#16a34a';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#22c55e';
                    }}
                  >
                    Связаться →
                  </a>
                </div>
              </div>

              {/* Илья Некрасов */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}>
                <img
                  src={IlyaPhoto}
                  alt="Илья Некрасов"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #f59e0b',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                  }}
                  onError={(e) => {
                    // Фолбэк на инициалы если изображение не загрузится
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ffffff',
                  flexShrink: 0,
                  fontFamily: 'Rubik, sans-serif'
                }}>
                  ИН
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '20px',
                    color: '#ffffff',
                    fontWeight: '600',
                    fontFamily: 'Rubik, sans-serif'
                  }}>
                    Илья Некрасов
                  </h3>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontFamily: 'Rubik, sans-serif'
                  }}>
                    Разработчик
                  </p>
                  <a
                    href="https://t.me/NKSV_ILYA"
                    target="_blank"
                    style={{
                      color: '#f59e0b',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily: 'Rubik, sans-serif',
                      transition: 'color 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#d97706';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#f59e0b';
                    }}
                  >
                    Связаться →
                  </a>
                </div>
              </div>

            </div>

            {/* Нижняя панель */}
            <div style={{
              marginTop: '32px',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: 'Rubik, sans-serif'
              }}>
                Интерактивная карта Брусиловского прорыва 1916 года<br />
                Нажмите ESC или кнопку × для закрытия
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно галереи */}
      {showGallery && (
        <div
          className={`modal-overlay ${isGalleryClosing ? 'closing' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeGallery();
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(10px)'
          }}
        >
          <div
            className={`modal-content ${isGalleryClosing ? 'closing' : ''}`}
            style={{
              background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 50%, rgba(15, 15, 35, 0.95) 100%)',
              padding: '24px',
              borderRadius: '24px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '800px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 80px rgba(147, 51, 234, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Заголовок */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px' 
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '28px', 
                color: '#ffffff',
                fontWeight: '700',
                fontFamily: 'Rubik, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    color: '#a855f7',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                  }}
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <path d="M21 15l-5-5L5 21l5-5"></path>
                </svg>
                Историческая галерея
              </h2>
                             <button
                 onClick={closeGallery}
                 style={{
                   background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.8) 100%)',
                   border: '1px solid rgba(255, 255, 255, 0.2)',
                   borderRadius: '16px',
                   fontSize: '20px',
                   cursor: 'pointer',
                   padding: '14px',
                   width: '56px',
                   height: '56px',
                   color: '#ffffff',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                   flexShrink: 0,
                   outline: 'none',
                   boxShadow: '0 8px 25px rgba(220, 38, 38, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)',
                   backdropFilter: 'blur(15px)',
                   textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                 }}
                 onMouseEnter={(e) => {
                   e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(239, 68, 68, 0.9) 100%)';
                   e.target.style.transform = 'scale(1.05) translateY(-2px)';
                   e.target.style.boxShadow = '0 12px 35px rgba(220, 38, 38, 0.4), 0 6px 16px rgba(0, 0, 0, 0.3)';
                 }}
                 onMouseLeave={(e) => {
                   e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.8) 100%)';
                   e.target.style.transform = 'scale(1) translateY(0px)';
                   e.target.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)';
                 }}
                 title="Закрыть (ESC)"
               >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Основное изображение */}
            <div style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '16px',
              overflow: 'hidden',
              minHeight: '400px'
            }}>
              <img
                src={galleryImages[currentGalleryImage]?.url}
                alt={galleryImages[currentGalleryImage]?.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '12px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '18px',
                fontFamily: 'Rubik, sans-serif'
              }}>
                Изображение недоступно
              </div>

              {/* Кнопки навигации */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevGalleryImage}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0, 0, 0, 0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '48px',
                      height: '48px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(147, 51, 234, 0.8)';
                      e.target.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0, 0, 0, 0.7)';
                      e.target.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                  </button>

                  <button
                    onClick={nextGalleryImage}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0, 0, 0, 0.7)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '48px',
                      height: '48px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(147, 51, 234, 0.8)';
                      e.target.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(0, 0, 0, 0.7)';
                      e.target.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6"></polyline>
                    </svg>
                  </button>
                </>
              )}

              {/* Счетчик изображений */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Rubik, sans-serif',
                backdropFilter: 'blur(10px)'
              }}>
                {currentGalleryImage + 1} из {galleryImages.length}
              </div>
            </div>

            {/* Информация об изображении */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '20px'
            }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                color: '#ffffff',
                fontWeight: '600',
                fontFamily: 'Rubik, sans-serif'
              }}>
                {galleryImages[currentGalleryImage]?.title}
              </h3>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontFamily: 'Rubik, sans-serif',
                lineHeight: '1.5'
              }}>
                {galleryImages[currentGalleryImage]?.description}
              </p>
            </div>

            {/* Миниатюры */}
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              padding: '8px 0'
            }}>
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => selectGalleryImage(index)}
                  style={{
                    background: 'none',
                    border: '2px solid transparent',
                    borderRadius: '8px',
                    padding: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                    opacity: currentGalleryImage === index ? 1 : 0.6
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    style={{
                      width: '60px',
                      height: '40px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      display: 'block'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.parentElement.innerHTML = '<div style="width: 60px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: rgba(255,255,255,0.5);">Фото</div>';
                    }}
                  />
                </button>
              ))}
            </div>

                         {/* Нижняя панель */}
             <div style={{
               marginTop: '16px',
               padding: '16px',
               background: 'rgba(255, 255, 255, 0.03)',
               borderRadius: '12px',
               border: '1px solid rgba(255, 255, 255, 0.1)',
               textAlign: 'center'
             }}>
               <p style={{
                 margin: '0 0 8px 0',
                 fontSize: '12px',
                 color: 'rgba(255, 255, 255, 0.6)',
                 fontFamily: 'Rubik, sans-serif'
               }}>
                 Используйте стрелки ← → или ESC для навигации
               </p>
               <p style={{
                 margin: 0,
                 fontSize: '10px',
                 color: 'rgba(255, 255, 255, 0.4)',
                 fontFamily: 'Rubik, sans-serif'
               }}>
                 Источник: Wikimedia Commons
               </p>
             </div>
          </div>
        </div>
      )}

      {/* Модальное окно исторической карты */}
      {showHistoricalMap && (
        <div
          className={`modal-overlay ${isHistoricalMapClosing ? 'closing' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeHistoricalMap();
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(10px)'
          }}
        >
                     <div
             className={`modal-content ${isHistoricalMapClosing ? 'closing' : ''}`}
             style={{
               background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 50%, rgba(15, 15, 35, 0.95) 100%)',
               padding: '0',
               borderRadius: '24px',
               maxWidth: '90vw',
               maxHeight: '95vh',
               width: '700px',
               height: '90vh',
               boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 80px rgba(245, 158, 11, 0.3)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               backdropFilter: 'blur(20px)',
               display: 'flex',
               flexDirection: 'column'
             }}
           >
            {/* Заголовок */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              flexShrink: 0
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '24px', 
                color: '#ffffff',
                fontWeight: '700',
                fontFamily: 'Rubik, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    color: '#f59e0b',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                  }}
                >
                  <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
                  <path d="M8 2v16"/>
                  <path d="M16 6v16"/>
                </svg>
                Историческая карта
              </h2>
              <button
                onClick={closeHistoricalMap}
                style={{
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8) 0%, rgba(239, 68, 68, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '10px',
                  width: '40px',
                  height: '40px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                  outline: 'none'
                }}
                title="Закрыть (ESC)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Историческая карта */}
            <div style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Zayonchkovsky_map47_%28part_A%29.png/1920px-Zayonchkovsky_map47_%28part_A%29.png"
                alt="Историческая карта Брусиловского прорыва"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  cursor: 'pointer'
                }}
                onClick={openHistoricalMapInNewTab}
                title="Нажмите для открытия в новой вкладке"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '18px',
                fontFamily: 'Rubik, sans-serif',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
                  <path d="M8 2v16"/>
                  <path d="M16 6v16"/>
                </svg>
                Карта недоступна
              </div>
            </div>

            {/* Информация о карте */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              flexShrink: 0,
              maxHeight: '150px',
              overflowY: 'auto'
            }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                color: '#ffffff',
                fontWeight: '600',
                fontFamily: 'Rubik, sans-serif'
              }}>
                Брусиловский прорыв (1916)
              </h3>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontFamily: 'Rubik, sans-serif',
                lineHeight: '1.4'
              }}>
                Оригинальная историческая карта наступательной операции Юго-Западного фронта под командованием генерала А. А. Брусилова, проводившейся с 4 июня по сентябрь 1916 года во время Первой мировой войны.
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: 'Rubik, sans-serif',
                marginBottom: '8px'
              }}>
                <span>📅 4 июня — сентябрь 1916</span>
                <span>📍 Юго-Западный фронт</span>
                <span>🔗 Источник: Wikimedia Commons</span>
              </div>
              <p style={{
                margin: '0',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'Rubik, sans-serif',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                💡 Нажмите на карту для открытия в новой вкладке
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}