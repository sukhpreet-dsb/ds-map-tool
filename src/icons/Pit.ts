import { Style, Stroke } from "ol/style";
import { Feature } from "ol";
import { LineString, MultiLineString } from "ol/geom";
import { Vector as VectorSource } from "ol/source";
import { applyOpacityToColor } from "@/utils/colorUtils";

/**
 * Creates a pit/plus shape using two perpendicular LineStrings
 * @param center - Center coordinate [x, y]
 * @param size - Half-length of each line from center
 * @returns MultiLineString with horizontal and vertical lines
 */
export const createPitGeometry = (center: number[], size: number = 20): MultiLineString => {
  const [cx, cy] = center;

  // Horizontal line
  const horizontalLine = new LineString([
    [cx - size, cy],
    [cx + size, cy],
  ]);

  // Vertical line
  const verticalLine = new LineString([
    [cx, cy - size],
    [cx, cy + size],
  ]);

  // Combine into MultiLineString
  return new MultiLineString([
    horizontalLine.getCoordinates(),
    verticalLine.getCoordinates(),
  ]);
};

/**
 * Gets stroke style for pit/plus shape
 * @param opacity - Opacity value (0-1), defaults to 1
 * @returns Style object with red stroke
 */
export const getPitStyle = (opacity: number = 1): Style => {
  return new Style({
    stroke: new Stroke({
      color: applyOpacityToColor("#ff0000", opacity), // Red with opacity
      width: 10,
    }),
  });
};

/**
 * Handles pit tool click events
 * Creates a pit feature at the clicked coordinate
 */
export const handlePitClick = (
  vectorSource: VectorSource,
  coordinate: number[],
  size: number = 6
): Feature | null => {
  try {
    // Create pit geometry
    const pitGeometry = createPitGeometry(coordinate, size);

    // Create feature with pit geometry
    const pitFeature = new Feature({
      geometry: pitGeometry,
    });

    // Mark as pit feature
    pitFeature.set("isPit", true);
    pitFeature.set("nonEditable", true);

    // Add label/name properties for text display
    pitFeature.set("label", "name");
    pitFeature.set("name", `Pit`);

    // Add to vector source
    vectorSource.addFeature(pitFeature);

    return pitFeature;
  } catch (error) {
    console.error("Error creating pit:", error);
    return null;
  }
};

/**
 * Checks if a feature is a pit feature
 */
export const isPitFeature = (feature: Feature): boolean => {
  return feature.get("isPit") === true;
};

/**
 * pit/Pit tool utilities
 */
export const pitUtils = {
  createGeometry: createPitGeometry,
  getStyle: getPitStyle,
  handleClick: handlePitClick,
  isPit: isPitFeature,
};
