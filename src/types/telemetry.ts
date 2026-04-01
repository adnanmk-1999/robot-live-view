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
 * A pre-computed snapshot of the robot's state at a single waypoint.
 * Computed once at load time to avoid repeating expensive derivations on each frame.
 */
export interface WaypointProfile {
  /** World coordinates [x, y] of this waypoint. */
  position: Point2D;
  /** Pre-calculated heading angle in radians (−PI to PI). */
  headingRad: number;
  /** Target velocity at this waypoint [m/s], respecting curvature and hardware limits. */
  velocityMs: number;
  /** Path curvature κ at this waypoint [1/m]. */
  curvature: number;
  /** Cumulative elapsed time from path start to this waypoint [s]. */
  timestampSec: number;
}

/**
 * A dense per-waypoint profile of the entire planned trajectory.
 * Each entry corresponds 1:1 with a smoothed path waypoint.
 */
export type RobotProfile = WaypointProfile[];

/**
 * Derived analytical metrics computed from the raw telemetry.
 */
export interface SweptPolygon {
  /** The outer boundary of the polygon in world coordinates. */
  outer: Point2D[];
  /** Internal 'holes' or islands within the polygon. */
  holes: Point2D[][];
}

export interface TelemetryMetrics {
  /** Sequential array of waypoints representing the robot's target path. */
  smoothedPath: Point2D[];
  /** Straight-line distance of the original telemetry path [m]. */
  rawPathLengthMeters: number;
  /** Straight-line distance of the smoothed (BSpline) path [m]. */
  smoothedPathLengthMeters: number;
  /** Total area covered by the robot footprint, accounting for overlaps. */
  cleanedAreaSqMeters: number;
  /** Estimated time to complete the path based on curvature-aware velocity. */
  traversalTimeSeconds: number;
  /** Hierarchical coordinates of unified swept area polygons (with holes). */
  sweptPolygons: SweptPolygon[];
  /** Pre-computed per-waypoint robot state profile. */
  robotProfile: RobotProfile;
}
