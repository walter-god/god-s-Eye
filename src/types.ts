export interface BiometricSignature {
  faceMatchScore: number;
  irisVerification: 'VERIFIED' | 'PARTIAL' | 'UNMATCHED';
  facialVectorHash: string;
  gaitCadenceBpm: number;
  thermalReadingCelsius: number;
  voiceHarmonicsMatch: number;
}

export interface TargetProfile {
  id: string;
  name: string;
  codename: string;
  category: 'FUGITIVE_PURSUIT' | 'SEARCH_AND_RESCUE' | 'PROTECTED_WITNESS' | 'COUNTER_SURVEILLANCE';
  priorityLevel: 'CRITICAL' | 'ELEVATED' | 'HIGH' | 'ROUTINE';
  status: 'TRACKING_ACTIVE' | 'ACQUIRING' | 'LOST_IN_COVER' | 'CONFIRMED_LOCATION';
  avatarUrl: string;
  facialMeshVectors: number;
  currentCity: string;
  currentCoordinates: [number, number]; // [lat, lng]
  lastConfirmedNode: string;
  movementSpeedKmh: number;
  headingDegrees: number;
  transitMode: 'FOOT' | 'HIGHWAY_SEDAN' | 'RAPID_TRANSIT' | 'METRO' | 'WATERCRAFT';
  biometrics: BiometricSignature;
  warrantNumber: string;
  authorizingAgency: string;
  notes: string;
}

export interface SensorNode {
  id: string;
  name: string;
  type: 'CCTV_HIGH_DEF' | 'TRAFFIC_ALPR' | 'DRONE_UAV_THERMAL' | 'ORBITAL_SAR_SAT' | 'TRANSIT_BIOMETRIC' | 'ATM_KIOSK';
  city: string;
  coordinates: [number, number];
  status: 'ACTIVE' | 'CALIBRATING' | 'STREAMING' | 'OVERRIDE';
  resolution: string;
  focalLength: string;
  fovAngle: number;
  detectionsCount: number;
  lastPingTimestamp: string;
}

export interface DetectionBox {
  id: string;
  label: string;
  confidence: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number;
  height: number;
  isTarget: boolean;
  biometricId?: string;
}

export interface CameraFeed {
  id: string;
  name: string;
  sensorType: SensorNode['type'];
  location: string;
  feedUrl?: string;
  streamFps: number;
  aspectRatio: string;
  resolution: string;
  detections: DetectionBox[];
  hasTargetLock: boolean;
  filterMode?: 'STANDARD' | 'THERMAL' | 'NIGHT_VISION' | 'EDGE_NEURAL';
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: 'TARGET_LOCK' | 'SENSOR_HANDOFF' | 'BIOMETRIC_MATCH' | 'WARRANT_VERIFICATION' | 'TRAJECTORY_UPDATE' | 'PRIVACY_SHIELD';
  message: string;
  sensorId: string;
  confidence?: number;
  coordinates?: [number, number];
}

export interface SystemTelemetry {
  activeStreams: number;
  throughputGbps: string;
  latencyMs: string;
  activeWarrants: number;
  nodesOnline: number;
  retrievalIntegrity: string;
  orbitalSatsOnline: number;
}

export interface TrajectoryPoint {
  etaMinutes: number;
  probableLocation: string;
  transitMethod: string;
  probability: string;
}

export interface ForensicReport {
  summary: string;
  threatLevel: 'LOW' | 'ELEVATED' | 'CRITICAL' | 'HIGH';
  biometricSignature: {
    facialVectorConfidence: string;
    gaitAnalysisMatch: string;
    irisScanStatus: string;
    thermalVariance: string;
  };
  predictedTrajectory: TrajectoryPoint[];
  tacticalRecommendations: string[];
  lawfulComplianceNote: string;
}
