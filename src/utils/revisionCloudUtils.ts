/**
 * Revision Cloud Utilities
 * Generates scalloped/wavy edge polygons from freehand paths
 * Similar to AutoCAD's Revision Cloud feature
 */

import type { Coordinate } from "ol/coordinate";
import { Polygon } from "ol/geom";

// Configuration constants
export const REVISION_CLOUD_CONFIG = {
  defaultScallopRadius: 50, // in map units (meters at equator for EPSG:3857)
  minScallopRadius: 20,
  maxScallopRadius: 200,
  arcSegments: 8, // segments per scallop arc
  minPathPoints: 3,
};

/**
 * Calculate distance between two coordinates
 */
const distance = (p1: Coordinate, p2: Coordinate): number => {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Determine if polygon winds clockwise using shoelace formula
 */
export const isClockwise = (coordinates: Coordinate[]): boolean => {
  let sum = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    sum +=
      (coordinates[i + 1][0] - coordinates[i][0]) *
      (coordinates[i + 1][1] + coordinates[i][1]);
  }
  return sum > 0;
};

/**
 * Close the path by connecting end to start if not already closed
 */
const closePathIfNeeded = (coordinates: Coordinate[]): Coordinate[] => {
  if (coordinates.length < 2) return coordinates;

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  // Check if already closed (within tolerance)
  if (distance(first, last) < 1) {
    return coordinates;
  }

  return [...coordinates, first];
};

/**
 * Resample path into uniform segment lengths
 */
export const resamplePath = (
  coordinates: Coordinate[],
  targetSegmentLength: number
): Coordinate[] => {
  if (coordinates.length < 2) return coordinates;

  const result: Coordinate[] = [coordinates[0]];
  let accumulatedLength = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prev = result[result.length - 1];
    const curr = coordinates[i];
    const segDist = distance(prev, curr);

    if (segDist === 0) continue;

    let remaining = segDist;
    let currentPoint = prev;

    while (accumulatedLength + remaining >= targetSegmentLength) {
      const needed = targetSegmentLength - accumulatedLength;
      const ratio = needed / remaining;

      const newPoint: Coordinate = [
        currentPoint[0] + ratio * (curr[0] - currentPoint[0]),
        currentPoint[1] + ratio * (curr[1] - currentPoint[1]),
      ];

      result.push(newPoint);
      remaining = remaining - needed;
      currentPoint = newPoint;
      accumulatedLength = 0;
    }

    accumulatedLength += remaining;
  }

  // Add the final point if not too close to the last result point
  const lastInput = coordinates[coordinates.length - 1];
  const lastResult = result[result.length - 1];
  if (distance(lastInput, lastResult) > targetSegmentLength * 0.1) {
    result.push(lastInput);
  }

  return result;
};

/**
 * Generate a single scallop arc between two points
 */
export const generateScallopArc = (
  p1: Coordinate,
  p2: Coordinate,
  direction: number,
  segments: number = REVISION_CLOUD_CONFIG.arcSegments
): Coordinate[] => {
  const points: Coordinate[] = [];

  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const chordLength = Math.sqrt(dx * dx + dy * dy);

  if (chordLength < 1) return [p1, p2];

  // Calculate arc parameters
  // Radius is half the chord length for a semicircle
  const radius = chordLength / 2;

  // Midpoint (arc center for semicircle)
  const centerX = (p1[0] + p2[0]) / 2;
  const centerY = (p1[1] + p2[1]) / 2;

  // Start and end angles
  const startAngle = Math.atan2(p1[1] - centerY, p1[0] - centerX);
  const endAngle = Math.atan2(p2[1] - centerY, p2[0] - centerX);

  // Determine sweep direction
  let angleDiff = endAngle - startAngle;

  // Normalize angle difference based on bulge direction
  if (direction > 0) {
    // Bulge outward (larger arc)
    if (angleDiff > 0) angleDiff -= 2 * Math.PI;
  } else {
    // Bulge inward (smaller arc)
    if (angleDiff < 0) angleDiff += 2 * Math.PI;
  }

  // Generate arc points
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + t * angleDiff;
    points.push([
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle),
    ]);
  }

  return points;
};

/**
 * Generate revision cloud coordinates from a freehand path
 */
export const generateRevisionCloudCoordinates = (
  inputCoordinates: Coordinate[],
  scallopRadius: number = REVISION_CLOUD_CONFIG.defaultScallopRadius
): Coordinate[] => {
  if (inputCoordinates.length < REVISION_CLOUD_CONFIG.minPathPoints) {
    return inputCoordinates;
  }

  // Step 1: Close the path
  const closedPath = closePathIfNeeded(inputCoordinates);

  // Step 2: Resample to uniform segments
  const targetSegmentLength = scallopRadius * 2;
  const resampledPath = resamplePath(closedPath, targetSegmentLength);

  if (resampledPath.length < 3) {
    return closedPath;
  }

  // Step 3: Determine winding direction for consistent scallop bulge
  // Scallops should bulge outward from the polygon center
  const clockwise = isClockwise(resampledPath);
  const bulgeDirection = 1;

  // Step 4: Generate scallops
  const cloudCoordinates: Coordinate[] = [];

  for (let i = 0; i < resampledPath.length - 1; i++) {
    const p1 = resampledPath[i];
    const p2 = resampledPath[i + 1];

    const arcPoints = generateScallopArc(p1, p2, bulgeDirection);

    // Add all arc points except the last (to avoid duplicates)
    if (i < resampledPath.length - 2) {
      cloudCoordinates.push(...arcPoints.slice(0, -1));
    } else {
      cloudCoordinates.push(...arcPoints);
    }
  }

  // Ensure proper closure
  if (
    cloudCoordinates.length > 0 &&
    distance(cloudCoordinates[0], cloudCoordinates[cloudCoordinates.length - 1]) > 1
  ) {
    cloudCoordinates.push(cloudCoordinates[0]);
  }

  return cloudCoordinates;
};

/**
 * Create a Polygon geometry from revision cloud coordinates
 */
export const createRevisionCloudPolygon = (
  inputCoordinates: Coordinate[],
  scallopRadius?: number
): Polygon => {
  const cloudCoords = generateRevisionCloudCoordinates(
    inputCoordinates,
    scallopRadius
  );
  return new Polygon([cloudCoords]);
};

/**
 * Generate preview during drawing (simplified for performance)
 */
export const generateRevisionCloudPreview = (
  coordinates: Coordinate[],
  scallopRadius?: number
): Coordinate[] => {
  if (coordinates.length < 3) {
    return coordinates;
  }

  // Use same algorithm for preview - it's fast enough
  return generateRevisionCloudCoordinates(coordinates, scallopRadius);
};
