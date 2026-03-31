/**
 * @file telemetry.ts
 * @description Core type definitions for robot telemetry data and state management.
 */

/**
 * A 2D point represented as [x, y] in meters.
 */
export type Point2D = [number, number];

/**
 * Raw telemetry data structure as expected from the JSON input.
 */
export interface TelemetryData {
  /** Sequential array of waypoints representing the robot's target path. */
  path: Point2D[];
  /** Vertices of the robot's footprint polygon in local coordinates. */
  robot: Point2D[];
  /** Vertices of the cleaning attachment/gadget in local coordinates. */
  cleaning_gadget: Point2D[];
}

/**
 * Reactive state governing the dashboard's playback behavior.
 */
export interface PlaybackState {
  /** Whether the robot is currently "moving" along the path in the UI. */
  isPlaying: boolean;
  /** Factor for time-scaling (e.g., 2.0 is double speed). */
  speedMultiplier: number;
  /** Current virtual time since start of path in seconds. */
  currentTime: number;
  /** Normalised progress (0.0 to 100.0). */
  progressPercentage: number;
  /** Current index in the path array corresponding to the robot's position. */
  currentPathIndex: number;
}

/**
 * Derived analytical metrics computed from the raw telemetry.
 */
export interface TelemetryMetrics {
  /** Total path length calculated by summing straight-line segments. */
  euclideanPathLengthMeters: number;
  /** Path length (reserved for smoothed/spline-based calculations). */
  pathLengthMeters: number;
  /** Total area covered by the robot footprint, accounting for overlaps. */
  cleanedAreaSqMeters: number;
  /** Estimated time to complete the path based on curvature-aware velocity. */
  traversalTimeSeconds: number;
  /** Outer boundary coordinates of the unified swept area polygon(s). */
  sweptBoundaryRings: Point2D[][];
  /** Array of velocities mapped to each segment of the path [m/s]. */
  velocityProfile: number[];
  /** Array of curvature values mapped to each path waypoint [1/m]. */
  curvatures: number[];
}
