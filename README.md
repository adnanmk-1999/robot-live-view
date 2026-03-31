# Robot Live View

## Overview
This project is an interactive web-based "live-view" dashboard for an autonomous cleaning robot. [cite_start]Built as a coding challenge response, this application parses raw JSON telemetry data to visualize a moving robot along a predefined trajectory. 

[cite_start]Instead of a traditional backend C++ computation tool, this solution leverages modern frontend technologies to provide an immediate, visual representation of the robot's behavior—a critical component for user-facing robotics software.

## Core Features
* [cite_start]**Dynamic Visualization:** Renders the robot's base polygon, the path, and the attached cleaning gadget on a 2D canvas[cite: 3, 4].
* [cite_start]**Live-View Simulation:** Animates the robot traversing the path to simulate real-time movement and orientation.
* [cite_start]**Kinematic Computations:** Calculates the total traversal time based on a curvature-dependent velocity profile where the robot slows down for sharp turns and accelerates on straights[cite: 5, 6, 7].
* [cite_start]**Spatial Analysis:** Computes the exact length of the traversed path [cite: 44] [cite_start]and the total geometric area covered by the cleaning gadget, ensuring overlapping swept areas are only counted once[cite: 45].

## Tech Stack
* [cite_start]**Framework:** Vue 3 (Composition API) 
* [cite_start]**Language:** TypeScript 
* **Build Tool:** Vite
* **Testing:** Vitest
* **Geospatial Math:** Turf.js (for calculating the union of the cleaned area polygons)