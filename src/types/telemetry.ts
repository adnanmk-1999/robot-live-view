export type Point2D = [number, number];

export interface TelemetryData {
  path: Point2D[];
  robot: Point2D[];
  cleaning_gadget: Point2D[];
}

export interface PlaybackState {
  isPlaying: boolean;
  speedMultiplier: number;
  currentTime: number;
  progressPercentage: number;
  currentPathIndex: number;
}

export interface TelemetryMetrics {
  euclideanPathLengthMeters: number;
  pathLengthMeters: number;
  cleanedAreaSqMeters: number;
  traversalTimeSeconds: number;
  sweptBoundaryRings: Point2D[][];
  velocityProfile: number[];   // per-segment velocity [m/s]
  curvatures: number[];        // per-point curvature  [1/m]
}
