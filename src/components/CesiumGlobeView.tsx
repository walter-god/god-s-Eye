import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import { TargetProfile, SensorNode } from '../types';
import { GLOBAL_HUBS } from '../data/mockData';
import { 
  Globe, 
  Crosshair, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Satellite, 
  Compass, 
  Maximize2, 
  Minimize2, 
  Eye, 
  Sliders, 
  Key, 
  Radio, 
  Activity,
  MapPin,
  Camera,
  Play,
  Pause
} from 'lucide-react';
import { playKeyClick, playRadarPing, playTargetLock } from '../utils/soundEffects';

interface CesiumGlobeViewProps {
  activeTarget: TargetProfile;
  sensorNodes: SensorNode[];
  onSelectCityHub: (cityName: string, coords: [number, number]) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

type BasemapType = 'TACTICAL_DARK' | 'SATELLITE' | 'STREETS' | 'NATURAL_EARTH';

// Tactical orbital satellites configuration
interface OrbitalSat {
  id: string;
  name: string;
  designation: string;
  altitudeKm: number;
  inclinationDeg: number;
  periodMinutes: number;
  color: string;
  fovRadiusKm: number;
}

const ORBITAL_SATELLITES: OrbitalSat[] = [
  {
    id: 'sat-sar-01',
    name: 'AEGIS-SAR-01',
    designation: 'Synthetic Aperture Radar (0.25m)',
    altitudeKm: 680,
    inclinationDeg: 68,
    periodMinutes: 98,
    color: '#06b6d4', // Cyan
    fovRadiusKm: 550,
  },
  {
    id: 'sat-opt-04',
    name: 'AEGIS-OPT-04',
    designation: 'Hyperspectral Optical Overwatch',
    altitudeKm: 540,
    inclinationDeg: -42,
    periodMinutes: 94,
    color: '#10b981', // Emerald
    fovRadiusKm: 420,
  },
  {
    id: 'sat-polar-09',
    name: 'AEGIS-POLAR-09',
    designation: 'Sub-orbital Polar SigInt Array',
    altitudeKm: 820,
    inclinationDeg: 82,
    periodMinutes: 104,
    color: '#f59e0b', // Amber
    fovRadiusKm: 700,
  },
  {
    id: 'sat-geo-02',
    name: 'AEGIS-STRAT-02',
    designation: 'High-Altitude Continuous Recon',
    altitudeKm: 950,
    inclinationDeg: 18,
    periodMinutes: 110,
    color: '#ec4899', // Pink
    fovRadiusKm: 900,
  }
];

export const CesiumGlobeView: React.FC<CesiumGlobeViewProps> = ({
  activeTarget,
  sensorNodes,
  onSelectCityHub,
  isExpanded = false,
  onToggleExpand,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const entitiesRef = useRef<{
    targetEntity?: Cesium.Entity;
    targetPulseEntity?: Cesium.Entity;
    geofenceEntity?: Cesium.Entity;
    trailEntity?: Cesium.Entity;
    hubEntities: Cesium.Entity[];
    sensorEntities: Cesium.Entity[];
    satEntities: { sat: OrbitalSat; entity: Cesium.Entity; orbitLine: Cesium.Entity; coneEntity?: Cesium.Entity }[];
  }>({
    hubEntities: [],
    sensorEntities: [],
    satEntities: [],
  });

  // UI state
  const [basemap, setBasemap] = useState<BasemapType>('TACTICAL_DARK');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ORBITAL' | 'TERRESTRIAL'>('ALL');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showAtmosphere, setShowAtmosphere] = useState<boolean>(true);
  const [showLighting, setShowLighting] = useState<boolean>(true);
  const [showSatFootprints, setShowSatFootprints] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [ionToken, setIonToken] = useState<string>(() => localStorage.getItem('aegis_cesium_ion_token') || '');
  const [selectedEntityInfo, setSelectedEntityInfo] = useState<{
    title: string;
    type: string;
    details: string;
    coordinates?: string;
  } | null>(null);

  // Live HUD telemetry
  const [cameraTelemetry, setCameraTelemetry] = useState<{
    altitudeKm: number;
    headingDeg: number;
    pitchDeg: number;
    mouseLat: number | null;
    mouseLng: number | null;
  }>({
    altitudeKm: 8500,
    headingDeg: 0,
    pitchDeg: -90,
    mouseLat: null,
    mouseLng: null,
  });

  const [historicalTrail, setHistoricalTrail] = useState<[number, number][]>(() => [
    [activeTarget.currentCoordinates[0] - 0.05, activeTarget.currentCoordinates[1] - 0.04],
    [activeTarget.currentCoordinates[0] - 0.02, activeTarget.currentCoordinates[1] - 0.01],
    [activeTarget.currentCoordinates[0], activeTarget.currentCoordinates[1]],
  ]);

  // Keep trail updated when target coordinates shift
  useEffect(() => {
    setHistoricalTrail((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last[0] !== activeTarget.currentCoordinates[0] || last[1] !== activeTarget.currentCoordinates[1]) {
        return [...prev.slice(-15), [activeTarget.currentCoordinates[0], activeTarget.currentCoordinates[1]]];
      }
      return prev;
    });
  }, [activeTarget.currentCoordinates]);

  // Setup Imagery Provider based on selection
  const createImageryProvider = useCallback(async (type: BasemapType): Promise<Cesium.ImageryProvider> => {
    try {
      switch (type) {
        case 'TACTICAL_DARK':
          return new Cesium.UrlTemplateImageryProvider({
            url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            subdomains: ['a', 'b', 'c', 'd'],
            maximumLevel: 19,
          });
        case 'SATELLITE':
          return new Cesium.UrlTemplateImageryProvider({
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maximumLevel: 19,
          });
        case 'STREETS':
          return new Cesium.UrlTemplateImageryProvider({
            url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            maximumLevel: 19,
          });
        case 'NATURAL_EARTH':
        default:
          return await Cesium.TileMapServiceImageryProvider.fromUrl(
            Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
          );
      }
    } catch (e) {
      console.warn('Imagery provider fallback to CartoDB dark:', e);
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        maximumLevel: 19,
      });
    }
  }, []);

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    if (ionToken) {
      Cesium.Ion.defaultAccessToken = ionToken.trim();
    }

    const defaultProvider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      maximumLevel: 19,
    });

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      creditContainer: document.createElement('div'), // Suppress default overlay credits
      baseLayer: new Cesium.ImageryLayer(defaultProvider),
      scene3DOnly: false,
      skyAtmosphere: new Cesium.SkyAtmosphere(),
      contextOptions: {
        webgl: {
          alpha: false,
          preserveDrawingBuffer: true,
        },
      },
    });

    viewerRef.current = viewer;

    // Tactical aesthetic enhancements
    const scene = viewer.scene;
    scene.backgroundColor = Cesium.Color.fromCssColorString('#030712');
    scene.globe.enableLighting = showLighting;
    scene.globe.atmosphereLightIntensity = 12.0;
    scene.globe.atmosphereRayleighCoefficient = new Cesium.Cartesian3(0.000005, 0.000015, 0.00003);
    scene.globe.baseColor = Cesium.Color.fromCssColorString('#020617');

    // Fly to active target on initial mount
    const [lat, lng] = activeTarget.currentCoordinates;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, 2800000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0.0,
      },
      duration: 1.8,
    });

    // Track mouse position on globe
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
      if (!viewer.isDestroyed()) {
        const ray = viewer.camera.getPickRay(movement.endPosition);
        if (ray) {
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const latDeg = Cesium.Math.toDegrees(cartographic.latitude);
            const lngDeg = Cesium.Math.toDegrees(cartographic.longitude);
            setCameraTelemetry((prev) => ({
              ...prev,
              mouseLat: parseFloat(latDeg.toFixed(4)),
              mouseLng: parseFloat(lngDeg.toFixed(4)),
            }));
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Entity click handler
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      if (viewer.isDestroyed()) return;
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id as Cesium.Entity;
        playRadarPing();

        // Check if entity is a city hub
        if (entity.name && entity.name.startsWith('HUB: ')) {
          const hubName = entity.name.replace('HUB: ', '');
          const hub = GLOBAL_HUBS.find((h) => h.name.startsWith(hubName) || hubName.startsWith(h.name.split(' ')[0]));
          if (hub) {
            onSelectCityHub(hub.name, hub.coordinates);
            setSelectedEntityInfo({
              title: hub.name,
              type: 'REGIONAL SENSOR HUB',
              details: `${hub.cameras} • Sector ${hub.country}`,
              coordinates: `${hub.coordinates[0].toFixed(4)}°N, ${hub.coordinates[1].toFixed(4)}°E`,
            });
            return;
          }
        }

        // Check if satellite
        const satMatch = ORBITAL_SATELLITES.find((s) => entity.name?.includes(s.name));
        if (satMatch) {
          setSelectedEntityInfo({
            title: satMatch.name,
            type: 'ORBITAL SURVEILLANCE PLATFORM',
            details: `${satMatch.designation} • Altitude ${satMatch.altitudeKm} km • Orbit Period ${satMatch.periodMinutes} min`,
          });
          return;
        }

        // Active Target
        if (entity.name?.includes('TARGET:')) {
          setSelectedEntityInfo({
            title: activeTarget.name,
            type: 'PRIMARY TARGET LOCK',
            details: `Codename: ${activeTarget.codename} • Velocity: ${activeTarget.movementSpeedKmh} km/h • Match: ${activeTarget.biometrics.faceMatchScore}%`,
            coordinates: `${activeTarget.currentCoordinates[0].toFixed(4)}°N, ${activeTarget.currentCoordinates[1].toFixed(4)}°E`,
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Camera change listener for telemetry
    const removeCameraListener = viewer.camera.changed.addEventListener(() => {
      if (viewer.isDestroyed()) return;
      const camera = viewer.camera;
      const height = camera.positionCartographic.height / 1000;
      const heading = Cesium.Math.toDegrees(camera.heading);
      const pitch = Cesium.Math.toDegrees(camera.pitch);

      setCameraTelemetry((prev) => ({
        ...prev,
        altitudeKm: Math.round(height),
        headingDeg: Math.round(heading),
        pitchDeg: Math.round(pitch),
      }));
    });

    return () => {
      removeCameraListener();
      handler.destroy();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [createImageryProvider, ionToken]);

  // Update Imagery Basemap
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    createImageryProvider(basemap)
      .then((newProvider) => {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          const layers = viewerRef.current.imageryLayers;
          layers.removeAll();
          layers.addImageryProvider(newProvider);
        }
      })
      .catch((e) => {
        console.error('Error changing imagery layer:', e);
      });
  }, [basemap, createImageryProvider]);

  // Update Atmosphere and Lighting
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    viewer.scene.globe.enableLighting = showLighting;
    viewer.scene.globe.showGroundAtmosphere = showAtmosphere;
  }, [showLighting, showAtmosphere]);

  // Auto-Rotation Loop
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    let animId: number;
    const rotate = () => {
      if (autoRotate && viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.001);
      }
      animId = requestAnimationFrame(rotate);
    };

    if (autoRotate) {
      animId = requestAnimationFrame(rotate);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [autoRotate]);

  // Draw and Update Geospatial Entities (Target, Hubs, Satellites, Sensors)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const entities = viewer.entities;

    // 1. CLEAR PREVIOUS ENTITIES
    if (entitiesRef.current.targetEntity) entities.remove(entitiesRef.current.targetEntity);
    if (entitiesRef.current.targetPulseEntity) entities.remove(entitiesRef.current.targetPulseEntity);
    if (entitiesRef.current.geofenceEntity) entities.remove(entitiesRef.current.geofenceEntity);
    if (entitiesRef.current.trailEntity) entities.remove(entitiesRef.current.trailEntity);

    entitiesRef.current.hubEntities.forEach((e) => entities.remove(e));
    entitiesRef.current.hubEntities = [];

    entitiesRef.current.sensorEntities.forEach((e) => entities.remove(e));
    entitiesRef.current.sensorEntities = [];

    entitiesRef.current.satEntities.forEach((s) => {
      entities.remove(s.entity);
      entities.remove(s.orbitLine);
      if (s.coneEntity) entities.remove(s.coneEntity);
    });
    entitiesRef.current.satEntities = [];

    const [targetLat, targetLng] = activeTarget.currentCoordinates;
    const targetPos = Cesium.Cartesian3.fromDegrees(targetLng, targetLat, 0);

    // 2. ACTIVE TARGET BEACON & 3D CYLINDER
    const targetEntity = entities.add({
      name: `TARGET: ${activeTarget.name} (${activeTarget.codename})`,
      position: targetPos,
      point: {
        pixelSize: 14,
        color: Cesium.Color.fromCssColorString('#06b6d4'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      label: {
        text: `TARGET: ${activeTarget.name.toUpperCase()}\n[${activeTarget.codename}] • ${activeTarget.biometrics.faceMatchScore}%\nSPD: ${activeTarget.movementSpeedKmh} KM/H`,
        font: '11px "JetBrains Mono", monospace',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -22),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000000),
      },
    });

    // 3D Vertical Tactical Beacon
    const targetPulseEntity = entities.add({
      position: Cesium.Cartesian3.fromDegrees(targetLng, targetLat, 40000),
      cylinder: {
        length: 80000,
        topRadius: 18000,
        bottomRadius: 200,
        material: new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString('#06b6d4').withAlpha(0.25)),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.7),
      },
    });

    // Sector Geofence Perimeter
    const geofenceEntity = entities.add({
      position: targetPos,
      ellipse: {
        semiMinorAxis: 45000.0,
        semiMajorAxis: 45000.0,
        height: 100.0,
        material: new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString('#06b6d4').withAlpha(0.12)),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.8),
        outlineWidth: 2,
      },
    });

    // Historical Breadcrumb Trail Polyline
    if (historicalTrail.length > 1) {
      const trailPositions = historicalTrail.map(([lat, lng]) => Cesium.Cartesian3.fromDegrees(lng, lat, 200));
      const trailEntity = entities.add({
        polyline: {
          positions: trailPositions,
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.25,
            color: Cesium.Color.fromCssColorString('#06b6d4'),
          }),
        },
      });
      entitiesRef.current.trailEntity = trailEntity;
    }

    entitiesRef.current.targetEntity = targetEntity;
    entitiesRef.current.targetPulseEntity = targetPulseEntity;
    entitiesRef.current.geofenceEntity = geofenceEntity;

    // 3. GLOBAL CITY SENSOR HUBS (TERRESTRIAL)
    if (activeFilter === 'ALL' || activeFilter === 'TERRESTRIAL') {
      GLOBAL_HUBS.forEach((hub) => {
        const [hubLat, hubLng] = hub.coordinates;
        const isCurrentCity = activeTarget.currentCity.toLowerCase().includes(hub.name.split(' ')[0].toLowerCase());

        const hubEntity = entities.add({
          name: `HUB: ${hub.name}`,
          position: Cesium.Cartesian3.fromDegrees(hubLng, hubLat, 0),
          point: {
            pixelSize: isCurrentCity ? 12 : 8,
            color: isCurrentCity ? Cesium.Color.fromCssColorString('#38bdf8') : Cesium.Color.fromCssColorString('#0ea5e9'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1.5,
          },
          label: {
            text: `${hub.name.split(' ')[0]}\n${hub.cameras}`,
            font: '10px "JetBrains Mono", monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: isCurrentCity ? Cesium.Color.fromCssColorString('#67e8f9') : Cesium.Color.fromCssColorString('#94a3b8'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, 10),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 15000000),
          },
        });
        entitiesRef.current.hubEntities.push(hubEntity);
      });

      // Ground sensors
      sensorNodes.forEach((node) => {
        const [sLat, sLng] = node.coordinates;
        const sensorEntity = entities.add({
          name: `SENSOR: ${node.name}`,
          position: Cesium.Cartesian3.fromDegrees(sLng, sLat, 0),
          point: {
            pixelSize: 6,
            color: Cesium.Color.fromCssColorString('#10b981'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
          },
          label: {
            text: node.name,
            font: '9px "JetBrains Mono", monospace',
            fillColor: Cesium.Color.fromCssColorString('#6ee7b7'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            pixelOffset: new Cesium.Cartesian2(0, -12),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2500000),
          },
        });
        entitiesRef.current.sensorEntities.push(sensorEntity);
      });
    }

    // 4. 3D ORBITAL SATELLITES & ORBIT TRACKS
    if (activeFilter === 'ALL' || activeFilter === 'ORBITAL') {
      const now = Date.now();

      ORBITAL_SATELLITES.forEach((sat, idx) => {
        // Generate orbit ring coordinates around Earth
        const orbitPoints: Cesium.Cartesian3[] = [];
        const numSamples = 72;
        const altMeters = sat.altitudeKm * 1000;

        for (let i = 0; i <= numSamples; i++) {
          const angle = (i / numSamples) * Math.PI * 2;
          const lat = Math.sin(angle) * sat.inclinationDeg;
          const lng = ((angle * (180 / Math.PI) + idx * 90) % 360) - 180;
          orbitPoints.push(Cesium.Cartesian3.fromDegrees(lng, lat, altMeters));
        }

        const orbitLine = entities.add({
          polyline: {
            positions: orbitPoints,
            width: 1.5,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString(sat.color).withAlpha(0.6),
              dashLength: 16.0,
            }),
          },
        });

        // Current satellite position based on real-time clock
        const currentAngle = (now / (sat.periodMinutes * 60 * 1000)) * Math.PI * 2 + idx * 1.5;
        const curLat = Math.sin(currentAngle) * sat.inclinationDeg;
        const curLng = (((currentAngle * (180 / Math.PI)) % 360) + 360) % 360 - 180;
        const satPosition = Cesium.Cartesian3.fromDegrees(curLng, curLat, altMeters);

        // Satellite Marker
        const satEntity = entities.add({
          name: `SATELLITE: ${sat.name}`,
          position: satPosition,
          point: {
            pixelSize: 10,
            color: Cesium.Color.fromCssColorString(sat.color),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
          },
          label: {
            text: `${sat.name}\nALT: ${sat.altitudeKm} KM`,
            font: '10px "JetBrains Mono", monospace',
            fillColor: Cesium.Color.fromCssColorString(sat.color),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            pixelOffset: new Cesium.Cartesian2(0, -18),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 30000000),
          },
        });

        // Ground coverage footprint cone
        let coneEntity: Cesium.Entity | undefined;
        if (showSatFootprints) {
          coneEntity = entities.add({
            position: Cesium.Cartesian3.fromDegrees(curLng, curLat, altMeters / 2),
            cylinder: {
              length: altMeters,
              topRadius: 5000,
              bottomRadius: sat.fovRadiusKm * 1000,
              material: new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString(sat.color).withAlpha(0.08)),
              outline: true,
              outlineColor: Cesium.Color.fromCssColorString(sat.color).withAlpha(0.25),
            },
          });
        }

        entitiesRef.current.satEntities.push({
          sat,
          entity: satEntity,
          orbitLine,
          coneEntity,
        });
      });
    }
  }, [activeTarget, sensorNodes, activeFilter, historicalTrail, showSatFootprints]);

  // Cinematic Camera Fly Presets
  const flyToTarget = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    playTargetLock();
    const [lat, lng] = activeTarget.currentCoordinates;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, 450000),
      orientation: {
        heading: Cesium.Math.toRadians(activeTarget.headingDegrees),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0.0,
      },
      duration: 2.0,
    });
  }, [activeTarget]);

  const flyToNadir = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    playKeyClick();
    const [lat, lng] = activeTarget.currentCoordinates;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, 600000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0,
      },
      duration: 1.8,
    });
  }, [activeTarget]);

  const flyToGlobalOrbital = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    playKeyClick();
    const [lat, lng] = activeTarget.currentCoordinates;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, 18000000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0,
      },
      duration: 2.2,
    });
  }, [activeTarget]);

  const setSceneMode = (mode: '3D' | '2.5D' | '2D') => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    playKeyClick();
    if (mode === '3D') viewer.scene.morphTo3D(1.0);
    else if (mode === '2.5D') viewer.scene.morphToColumbusView(1.0);
    else viewer.scene.morphTo2D(1.0);
  };

  const handleZoom = (inOut: 'IN' | 'OUT') => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    playKeyClick();
    const camera = viewer.camera;
    const currentHeight = camera.positionCartographic.height;
    const factor = inOut === 'IN' ? 0.5 : 2.0;
    camera.zoomIn(currentHeight * (1 - factor));
  };

  const handleSaveIonToken = (token: string) => {
    setIonToken(token);
    localStorage.setItem('aegis_cesium_ion_token', token.trim());
    Cesium.Ion.defaultAccessToken = token.trim();
    setShowSettingsModal(false);
  };

  return (
    <div className={`relative w-full h-full min-h-[420px] bg-[#020617] border border-cyan-900/50 rounded-lg overflow-hidden flex flex-col select-none ${isExpanded ? 'fixed inset-3 z-50 rounded-xl shadow-2xl' : ''}`}>
      {/* Top Tactical Command HUD Header */}
      <div className="px-3 py-2 border-b border-cyan-900/50 bg-slate-950/85 backdrop-blur-md flex items-center justify-between text-xs font-mono-tech z-10">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Globe className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75"></span>
          </div>
          <span className="font-display-tech font-bold text-slate-100 tracking-wider">
            CESIUM 3D GEOSPATIAL COMMAND
          </span>
          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
            CESIUMJS WGS84
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold">
            ORBITAL LINK: ACTIVE
          </span>
        </div>

        {/* Tactical Actions & Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Layer Filter */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px]">
            {(['ALL', 'ORBITAL', 'TERRESTRIAL'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  playKeyClick();
                  setActiveFilter(filter);
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeFilter === filter
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Fly-to-target shortcut */}
          <button
            onClick={flyToTarget}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/90 text-cyan-300 hover:bg-cyan-900 border border-cyan-700/80 transition-all font-semibold"
            title="Cinematic FlyTo Active Target"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden sm:inline">LOCK TARGET</span>
          </button>

          {/* Quick Settings */}
          <button
            onClick={() => {
              playKeyClick();
              setShowSettingsModal(true);
            }}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            title="Geospatial & Cesium Ion Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Expand / Minimize Toggle */}
          {onToggleExpand && (
            <button
              onClick={() => {
                playKeyClick();
                onToggleExpand();
              }}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 transition-colors"
              title={isExpanded ? 'Restore split layout' : 'Maximize Cesium 3D Globe'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Cesium WebGL Container */}
      <div className="relative flex-1 w-full h-full min-h-[360px] overflow-hidden">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />

        {/* Tactical Crosshair Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-20 h-20 border border-cyan-500/10 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-cyan-400/20 rounded-full"></div>
          </div>
          {/* Subtle grid lines */}
          <div className="absolute inset-x-0 h-px bg-cyan-500/5"></div>
          <div className="absolute inset-y-0 w-px bg-cyan-500/5"></div>
        </div>

        {/* Floating Top-Left Controls: Basemap & Scene Mode */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 text-[11px] font-mono-tech">
          {/* Basemap Selection Bar */}
          <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-md border border-cyan-900/60 shadow-lg">
            <Layers className="w-3.5 h-3.5 text-cyan-400 ml-1" />
            <button
              onClick={() => {
                playKeyClick();
                setBasemap('TACTICAL_DARK');
              }}
              className={`px-2 py-0.5 rounded transition-all ${
                basemap === 'TACTICAL_DARK'
                  ? 'bg-cyan-900/80 text-cyan-200 font-bold border border-cyan-600/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DARK
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setBasemap('SATELLITE');
              }}
              className={`px-2 py-0.5 rounded transition-all ${
                basemap === 'SATELLITE'
                  ? 'bg-cyan-900/80 text-cyan-200 font-bold border border-cyan-600/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SATELLITE
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setBasemap('STREETS');
              }}
              className={`px-2 py-0.5 rounded transition-all ${
                basemap === 'STREETS'
                  ? 'bg-cyan-900/80 text-cyan-200 font-bold border border-cyan-600/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              STREETS
            </button>
            <button
              onClick={() => {
                playKeyClick();
                setBasemap('NATURAL_EARTH');
              }}
              className={`px-2 py-0.5 rounded transition-all ${
                basemap === 'NATURAL_EARTH'
                  ? 'bg-cyan-900/80 text-cyan-200 font-bold border border-cyan-600/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OFFLINE
            </button>
          </div>

          {/* Quick Perspective Views */}
          <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-md border border-slate-800 shadow-lg text-[10px]">
            <button
              onClick={flyToTarget}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 transition-colors"
            >
              45° OBLIQUE
            </button>
            <button
              onClick={flyToNadir}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            >
              NADIR 90°
            </button>
            <button
              onClick={flyToGlobalOrbital}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            >
              GLOBAL ORBIT
            </button>
          </div>
        </div>

        {/* Floating Top-Right Tool Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <div className="flex flex-col bg-slate-950/90 backdrop-blur-md rounded-md border border-cyan-900/60 overflow-hidden shadow-lg p-0.5">
            <button
              onClick={() => handleZoom('IN')}
              className="p-1.5 hover:bg-cyan-950 text-cyan-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-px bg-slate-800"></div>
            <button
              onClick={() => handleZoom('OUT')}
              className="p-1.5 hover:bg-cyan-950 text-cyan-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="h-px bg-slate-800"></div>
            <button
              onClick={() => {
                playKeyClick();
                setAutoRotate((prev) => !prev);
              }}
              className={`p-1.5 transition-colors ${autoRotate ? 'bg-cyan-950 text-cyan-300' : 'text-slate-400 hover:bg-slate-800'}`}
              title={autoRotate ? 'Stop Globe Auto-Rotation' : 'Start Globe Auto-Rotation'}
            >
              <RefreshCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-px bg-slate-800"></div>
            <button
              onClick={() => setSceneMode('3D')}
              className="p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 text-[10px] font-mono-tech font-bold"
              title="3D Globe"
            >
              3D
            </button>
            <button
              onClick={() => setSceneMode('2.5D')}
              className="p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 text-[10px] font-mono-tech font-bold"
              title="2.5D Columbus View"
            >
              2.5D
            </button>
          </div>
        </div>

        {/* Selected Entity Info Card */}
        {selectedEntityInfo && (
          <div className="absolute top-16 left-3 max-w-xs bg-slate-950/95 backdrop-blur-md border border-cyan-500/60 p-3 rounded-lg z-20 shadow-2xl font-mono-tech text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-1.5 mb-2">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                {selectedEntityInfo.type}
              </span>
              <button
                onClick={() => setSelectedEntityInfo(null)}
                className="text-slate-400 hover:text-white text-sm leading-none px-1"
              >
                ×
              </button>
            </div>
            <div className="text-sm font-bold text-slate-100 mb-1">{selectedEntityInfo.title}</div>
            <div className="text-[11px] text-slate-300 mb-2 leading-relaxed">{selectedEntityInfo.details}</div>
            {selectedEntityInfo.coordinates && (
              <div className="text-[10px] text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded border border-cyan-800/40">
                GEO: {selectedEntityInfo.coordinates}
              </div>
            )}
          </div>
        )}

        {/* Bottom Floating Telemetry Bar */}
        <div className="absolute bottom-2 inset-x-2 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-950/90 backdrop-blur-md rounded border border-cyan-900/40 text-[10px] font-mono-tech text-slate-400 z-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              TARGET: <strong className="text-cyan-300">{activeTarget.name}</strong> ({activeTarget.currentCoordinates[0].toFixed(2)}°N, {activeTarget.currentCoordinates[1].toFixed(2)}°E)
            </span>
            <span className="hidden sm:inline">
              SECTOR: <strong className="text-slate-200">{activeTarget.currentCity.toUpperCase()}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {cameraTelemetry.mouseLat !== null && (
              <span className="hidden md:inline text-cyan-400">
                CURSOR: {cameraTelemetry.mouseLat}°N, {cameraTelemetry.mouseLng}°E
              </span>
            )}
            <span>
              ALT: <strong className="text-amber-300">{cameraTelemetry.altitudeKm.toLocaleString()} KM</strong>
            </span>
            <span>
              HDG: <strong className="text-slate-200">{cameraTelemetry.headingDeg}°</strong>
            </span>
            <span>
              PITCH: <strong className="text-slate-200">{cameraTelemetry.pitchDeg}°</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Geospatial Settings / Cesium Ion Token Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-cyan-700/80 rounded-xl p-5 max-w-md w-full shadow-2xl font-mono-tech text-xs">
            <div className="flex items-center justify-between border-b border-cyan-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display-tech text-sm font-bold text-slate-100 tracking-wider">
                  CESIUM 3D GEOSPATIAL CONFIGURATION
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-base leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Display Controls */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Atmospheric & Visual Shading
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowAtmosphere((prev) => !prev)}
                    className={`px-3 py-1.5 rounded border text-left flex items-center justify-between ${
                      showAtmosphere ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span>Atmospheric Rayleigh Glow</span>
                    <span className="text-[10px]">{showAtmosphere ? 'ON' : 'OFF'}</span>
                  </button>
                  <button
                    onClick={() => setShowLighting((prev) => !prev)}
                    className={`px-3 py-1.5 rounded border text-left flex items-center justify-between ${
                      showLighting ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span>Dynamic Sun Lighting</span>
                    <span className="text-[10px]">{showLighting ? 'ON' : 'OFF'}</span>
                  </button>
                  <button
                    onClick={() => setShowSatFootprints((prev) => !prev)}
                    className={`px-3 py-1.5 rounded border text-left flex items-center justify-between col-span-2 ${
                      showSatFootprints ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span>Orbital Satellite Footprint Cones (3D Radar Footprint)</span>
                    <span className="text-[10px]">{showSatFootprints ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Cesium Ion Access Token */}
              <div className="border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    Cesium ion Access Token (Optional)
                  </label>
                  <span className="text-[10px] text-cyan-400/80">cesium.com/ion</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                  Open basemaps (CartoDB Dark Matter, ESRI Satellite Reconnaissance, OpenStreetMap, and local Natural Earth II) run 100% out of the box without any token. If you have a Cesium ion account, entering your token unlocks high-resolution Cesium World Terrain and 3D Photogrammetry Tiles.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={ionToken}
                    onChange={(e) => setIonToken(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    onClick={() => handleSaveIonToken(ionToken)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded transition-colors text-xs"
                  >
                    SAVE
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
