import Map from "ol/Map";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import type { Feature } from "ol";
import type { Geometry } from "ol/geom";
import { Style, Stroke, Fill, Circle as CircleStyle, Text as TextStyle } from "ol/style";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select";
import { click } from "ol/events/condition";
import TransformInteraction from "ol-ext/interaction/Transform";

export type ToolType = "select" | "hand" | "line" | "polyline" | "freehand" | "text" | "transform";

export interface DrawingToolOptions {
  map: Map;
  vectorLayer: VectorLayer<VectorSource>;
  onFeatureSelect?: (feature: Feature<Geometry> | null) => void;
}

export class DrawingToolsManager {
  private map: Map;
  private vectorLayer: VectorLayer<VectorSource>;
  private vectorSource: VectorSource;
  private onFeatureSelect?: (feature: Feature<Geometry> | null) => void;

  private currentTool: ToolType = "hand";
  private currentInteraction: Draw | Modify | Select | TransformInteraction | null = null;
  private selectInteraction: Select | null = null;
  private modifyInteraction: Modify | null = null;
  private transformInteraction: TransformInteraction | null = null;

  // Drawing features storage
  private drawingFeatures: Feature<Geometry>[] = [];

  constructor(options: DrawingToolOptions) {
    this.map = options.map;
    this.vectorLayer = options.vectorLayer;
    this.vectorSource = options.vectorLayer.getSource()!;
    this.onFeatureSelect = options.onFeatureSelect;

    this.initializeDefaultInteractions();
  }

  private initializeDefaultInteractions() {
    // Create select and modify interactions that are always present
    this.selectInteraction = new Select({
      condition: click,
      layers: [this.vectorLayer],
    });

    this.modifyInteraction = new Modify({
      features: this.selectInteraction.getFeatures(),
    });

    this.selectInteraction.on("select", (e) => {
      if (this.onFeatureSelect) {
        this.onFeatureSelect(e.selected[0] || null);
      }
    });

    this.map.addInteraction(this.selectInteraction);
    this.map.addInteraction(this.modifyInteraction);
  }

  // Default feature styles
  private getDefaultStyle() {
    return new Style({
      stroke: new Stroke({
        color: "#0066cc",
        width: 3,
      }),
      fill: new Fill({
        color: "rgba(0, 102, 204, 0.2)",
      }),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: "#0066cc" }),
        stroke: new Stroke({ color: "#fff", width: 2 }),
      }),
    });
  }

  // Text style for text features
  private getTextStyle(text: string) {
    return new Style({
      text: new TextStyle({
        text: text,
        font: "16px Arial",
        fill: new Fill({ color: "#000000" }),
        stroke: new Stroke({ color: "#ffffff", width: 3 }),
      }),
    });
  }

  // Set active tool
  setActiveTool(tool: ToolType) {
    // Remove current interaction if it exists
    if (this.currentInteraction && this.currentInteraction !== this.selectInteraction && this.currentInteraction !== this.modifyInteraction) {
      this.map.removeInteraction(this.currentInteraction as any);
      this.currentInteraction = null;
    }

    // Remove transform interaction if switching away from transform tool
    if (this.transformInteraction && tool !== "transform") {
      this.map.removeInteraction(this.transformInteraction as any);
      this.transformInteraction = null;
    }

    this.currentTool = tool;

    switch (tool) {
      case "select":
        this.enableSelectMode();
        break;
      case "hand":
        this.enableHandMode();
        break;
      case "line":
        this.enableLineDrawing();
        break;
      case "polyline":
        this.enablePolylineDrawing();
        break;
      case "freehand":
        this.enableFreehandDrawing();
        break;
      case "text":
        this.enableTextTool();
        break;
      case "transform":
        this.enableTransformMode();
        break;
    }
  }

  private enableSelectMode() {
    // Just use default select/modify interactions
    this.map.getTargetElement().style.cursor = "default";
  }

  private enableHandMode() {
    // Enable map panning
    this.map.getTargetElement().style.cursor = "grab";
    // Remove any active drawing interactions
    if (this.selectInteraction) {
      this.selectInteraction.getFeatures().clear();
    }
  }

  private enableLineDrawing() {
    this.map.getTargetElement().style.cursor = "crosshair";

    const drawInteraction = new Draw({
      source: this.vectorSource,
      type: "LineString",
      style: this.getDefaultStyle(),
      maxPoints: 2, // Line has exactly 2 points
    });

    drawInteraction.on("drawend", (event) => {
      const feature = event.feature;
      feature.setStyle(this.getDefaultStyle());
      this.drawingFeatures.push(feature);
      console.log("Line drawn:", feature);
    });

    this.map.addInteraction(drawInteraction);
    this.currentInteraction = drawInteraction;
  }

  private enablePolylineDrawing() {
    this.map.getTargetElement().style.cursor = "crosshair";

    const drawInteraction = new Draw({
      source: this.vectorSource,
      type: "LineString",
      style: this.getDefaultStyle(),
      // No maxPoints - allows multiple points
    });

    drawInteraction.on("drawend", (event) => {
      const feature = event.feature;
      feature.setStyle(this.getDefaultStyle());
      this.drawingFeatures.push(feature);
      console.log("Polyline drawn:", feature);
    });

    this.map.addInteraction(drawInteraction);
    this.currentInteraction = drawInteraction;
  }

  private enableFreehandDrawing() {
    this.map.getTargetElement().style.cursor = "crosshair";

    const drawInteraction = new Draw({
      source: this.vectorSource,
      type: "LineString",
      style: this.getDefaultStyle(),
      freehand: true,
    });

    drawInteraction.on("drawend", (event) => {
      const feature = event.feature;
      feature.setStyle(this.getDefaultStyle());
      this.drawingFeatures.push(feature);
      console.log("Freehand line drawn:", feature);
    });

    this.map.addInteraction(drawInteraction);
    this.currentInteraction = drawInteraction;
  }

  private enableTextTool() {
    this.map.getTargetElement().style.cursor = "text";

    const drawInteraction = new Draw({
      source: this.vectorSource,
      type: "Point",
      style: this.getDefaultStyle(),
    });

    drawInteraction.on("drawend", (event) => {
      const feature = event.feature;
      const text = prompt("Enter text:") || "Text";

      // Create text style
      feature.setStyle(this.getTextStyle(text));
      this.drawingFeatures.push(feature);
      console.log("Text added:", feature);
    });

    this.map.addInteraction(drawInteraction);
    this.currentInteraction = drawInteraction;
  }

  private enableTransformMode() {
    this.map.getTargetElement().style.cursor = "move";
    this.createTransformInteraction({
      enableRotatedTransform: true,
      translateFeature: true,
      scale: true,
      rotate: true,
      keepAspectRatio: (event: any) => event.shiftKey, // Hold shift to maintain aspect ratio
    });
  }

  private createTransformInteraction(options: any) {
    if (this.transformInteraction) {
      this.map.removeInteraction(this.transformInteraction as any);
    }

    this.transformInteraction = new TransformInteraction({
      ...options,
      layers: [this.vectorLayer],
    }) as any;

    if (this.transformInteraction) {
      this.transformInteraction.on("select", (event: any) => {
        console.log("Feature selected for transform:", event.selected);
      });

      this.transformInteraction.on("transformstart", (event: any) => {
        console.log("Transform started:", event);
      });

      this.transformInteraction.on("transforming", (event: any) => {
        console.log("Transforming:", event);
      });

      this.transformInteraction.on("transformend", (event: any) => {
        console.log("Transform completed:", event);
      });
    }

    this.map.addInteraction(this.transformInteraction as any);
    this.currentInteraction = this.transformInteraction;
  }

  // Get current tool
  getCurrentTool(): ToolType {
    return this.currentTool;
  }

  // Delete selected feature
  deleteSelectedFeature() {
    if (this.selectInteraction) {
      const selectedFeatures = this.selectInteraction.getFeatures();
      if (selectedFeatures.getLength() > 0) {
        const feature = selectedFeatures.item(0);
        this.vectorSource.removeFeature(feature);
        selectedFeatures.clear();

        // Remove from drawing features array
        const index = this.drawingFeatures.indexOf(feature);
        if (index > -1) {
          this.drawingFeatures.splice(index, 1);
        }

        if (this.onFeatureSelect) {
          this.onFeatureSelect(null);
        }
        return true;
      }
    }
    return false;
  }

  // Clear all drawing features
  clearAllFeatures() {
    this.vectorSource.clear();
    this.drawingFeatures = [];
    if (this.onFeatureSelect) {
      this.onFeatureSelect(null);
    }
  }

  // Get all drawing features
  getDrawingFeatures(): Feature<Geometry>[] {
    return [...this.drawingFeatures];
  }

  // Cleanup
  destroy() {
    if (this.currentInteraction) {
      this.map.removeInteraction(this.currentInteraction as any);
    }
    if (this.selectInteraction) {
      this.map.removeInteraction(this.selectInteraction);
    }
    if (this.modifyInteraction) {
      this.map.removeInteraction(this.modifyInteraction);
    }
    if (this.transformInteraction) {
      this.map.removeInteraction(this.transformInteraction as any);
    }
  }
}