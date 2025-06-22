import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import brusilovData from './brusilovData.json';

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
    iconAnchor: [size[0]/2, size[1]],
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

// Компонент для отображения городов
const CityMarkers = ({ cities }) => {
  const getCityIcon = (importance) => {
    const size = importance === 'major' ? [12, 12] : importance === 'strategic' ? [8, 8] : [6, 6];
    const color = importance === 'major' ? '#000000' : importance === 'strategic' ? '#333333' : '#666666';
    
    return L.divIcon({
      html: `<div style="background: ${color}; width: ${size[0]}px; height: ${size[1]}px; border-radius: 50%; border: 2px solid white;"></div>`,
      className: 'city-marker',
      iconSize: size,
      iconAnchor: [size[0]/2, size[1]/2]
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

// Компонент для отображения рек
const Rivers = ({ rivers }) => {
  return rivers.map((river) => (
    <Polyline
      key={river.id}
      positions={river.coordinates}
      color="#4A90E2"
      weight={2}
      opacity={0.8}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-bold">{river.name}</h3>
          <p className="text-sm">Река</p>
        </div>
      </Popup>
    </Polyline>
  ));
};

// Основной компонент приложения
export default function BrusilovOffensiveMap() {
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [showInitialFront, setShowInitialFront] = useState(true);
  const [showFinalFront, setShowFinalFront] = useState(true);
  const [mapLayer, setMapLayer] = useState('modern');

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
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f3f4f6', margin: 0, padding: 0 }}>
      <header style={{ backgroundColor: '#111827', color: 'white', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>Брусиловский прорыв 1916 года</h1>
        <p style={{ textAlign: 'center', marginTop: '8px', color: '#d1d5db', margin: '8px 0 0 0' }}>Интерактивная карта крупнейшей операции Первой мировой войны</p>
      </header>

      <div style={{ backgroundColor: 'white', padding: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: '600' }}>Слой карты:</label>
          <select 
            value={mapLayer} 
            onChange={(e) => setMapLayer(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 12px' }}
          >
            <option value="modern">Современная карта</option>
            <option value="historical">Историческая карта (требует настройки)</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showInitialFront}
              onChange={(e) => setShowInitialFront(e.target.checked)}
            />
            <span style={{ color: '#dc2626', fontWeight: '600' }}>Линия фронта 4 июня</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showFinalFront}
              onChange={(e) => setShowFinalFront(e.target.checked)}
            />
            <span style={{ color: '#16a34a', fontWeight: '600' }}>Линия фронта 20 сентября</span>
          </label>
        </div>
      </div>

      <div style={{ flex: 1, width: '100%', height: '100%' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
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
            <Rivers rivers={brusilovData.rivers} />
          </MapContainer>
          
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 1000,
            maxWidth: '250px'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '8px', margin: '0 0 8px 0', color: 'black' }}>Легенда</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'black' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#b91c1c' }}></div>
                <span style={{ color: 'black' }}>Крупные сражения</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '4px', backgroundColor: '#3b82f6' }}></div>
                <span style={{ color: 'black' }}>Направления наступления</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '4px', backgroundColor: '#dc2626', borderTop: '3px dashed #dc2626' }}></div>
                <span style={{ color: 'black' }}>Начальная линия фронта</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '4px', backgroundColor: '#16a34a' }}></div>
                <span style={{ color: 'black' }}>Конечная линия фронта</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'black', border: '1px solid white' }}></div>
                <span style={{ color: 'black' }}>Крупные города</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6b7280', border: '1px solid white' }}></div>
                <span style={{ color: 'black' }}>Города</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '4px', backgroundColor: '#60a5fa' }}></div>
                <span style={{ color: 'black' }}>Реки</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedBattle && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>{selectedBattle.name}</h2>
              <button 
                onClick={() => setSelectedBattle(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Дата:</strong> {selectedBattle.date}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Описание:</strong><br />
              {selectedBattle.description}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Результат:</strong><br />
              {selectedBattle.result}
            </div>
            
            <button 
              onClick={() => setSelectedBattle(null)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}