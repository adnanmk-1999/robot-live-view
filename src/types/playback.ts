/**
 * @file playback.ts
 * @description Core type definitions for playback state management.
 */

/**
 * Represents the current playback state of the robot.
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