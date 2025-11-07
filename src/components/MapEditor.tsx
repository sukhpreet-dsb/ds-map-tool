import React, { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import type { Extent } from "ol/extent";
import { OSM, Vector as VectorSource, XYZ } from "ol/source";
import { fromLonLat } from "ol/proj";
import { MapViewToggle, type MapViewType } from "./MapViewToggle";
import { LoadingOverlay } from "./LoadingOverlay";
import { Overlay, type Feature } from "ol";
import type { Geometry } from "ol/geom";
import type { FeatureLike } from "ol/Feature";
import { Style, Circle as CircleStyle, Text } from "ol/style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import { defaults as defaultControls } from "ol/control";
import Toolbar from "./ToolBar";
import GeoJSON from "ol/format/GeoJSON";
import KML from "ol/format/KML";
import JSZip from "jszip";
import { DrawingToolsManager, type ToolType } from "../utils/drawingTools";
import "ol/ol.css";
import "ol-ext/dist/ol-ext.css";

const MapEditor: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const vectorSourceRef = useRef(new VectorSource());
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawingToolsManagerRef = useRef<DrawingToolsManager | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const osmLayerRef = useRef<TileLayer<OSM> | null>(null);
  const satelliteLayerRef = useRef<TileLayer<XYZ> | null>(null);

  const [currentMapView, setCurrentMapView] = useState<MapViewType>("osm");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTool, setCurrentTool] = useState<ToolType>("hand");
  const [popupContent, setPopupContent] = useState<string | null>(null);

  // ✅ Custom feature styles (used for GeoJSON, KML, and KMZ)
  const getFeatureStyle = (feature: FeatureLike) => {
    const type = feature.getGeometry()?.getType();
    const name = feature.get("name") || "";

    const baseStyle = new Style({
      text: name
        ? new Text({
            text: String(name),
            font: "12px Calibri,sans-serif",
            fill: new Fill({ color: "#000" }),
            backgroundFill: new Fill({ color: "white" }),
            stroke: new Stroke({ color: "#fff", width: 4 }),
            offsetY: -12, // move label slightly above the point or line
          })
        : undefined,
    });

    if (type === "LineString" || type === "MultiLineString") {
      baseStyle.setStroke(
        new Stroke({
          color: "#00ff00",
          width: 4,
        })
      );
    } else if (type === "Point" || type === "MultiPoint") {
      baseStyle.setImage(
        new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "#ff0000" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        })
      );
    } else {
      baseStyle.setFill(new Fill({ color: "rgba(255, 255, 0, 0.2)" }));
      baseStyle.setStroke(new Stroke({ color: "#ff8800", width: 3 }));
    }
    return baseStyle;
  };

  // ✅ Initialize map
  useEffect(() => {
    // Create OSM layer
    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: true,
    });

    // Create Satellite layer using Esri World Imagery
    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attributions: "Tiles © Esri",
        maxZoom: 19,
        minZoom: 0,
      }),
      visible: false,
    });

    // Store references for layer switching
    osmLayerRef.current = osmLayer;
    satelliteLayerRef.current = satelliteLayer;

    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: getFeatureStyle,
    });

    vectorLayerRef.current = vectorLayer;

    const map = new Map({
      target: "map",
      layers: [osmLayer, satelliteLayer, vectorLayer],
      view: new View({
        center: fromLonLat([78.9629, 20.5937]),
        zoom: 5,
        maxZoom: 19,
        minZoom: 0,
        smoothExtentConstraint: true,
      }),
      controls: defaultControls({
        zoom: false,
        attribution: false,
        rotate: false,
      }),
    });

    mapRef.current = map;

    // Tooltip Overlay
    const popupOverlay = new Overlay({
      element: popupRef.current!,
      autoPan: {
        animation: { duration: 250 },
      },
    });
    map.addOverlay(popupOverlay);

    // ✅ Tooltip on hover (use singleclick if you prefer click)
    map.on("click", (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feat) => feat);
      if (feature) {
        const properties = feature.getProperties();
        delete properties.geometry;

        const info =
          Object.keys(properties).length > 0
            ? Object.entries(properties)
                .map(([key, value]) => `<b>${key}</b>: ${value}`)
                .join("<br/>")
            : "No additional info";

        setPopupContent(info);
        popupOverlay.setPosition(event.coordinate);
      } else {
        setPopupContent(null);
        popupOverlay.setPosition(undefined);
      }
    });

    // Initialize DrawingToolsManager after map is created
    drawingToolsManagerRef.current = new DrawingToolsManager({
      map,
      vectorLayer,
    });

    // Set default tool to hand
    drawingToolsManagerRef.current.setActiveTool("hand");

    return () => map.setTarget(undefined);
  }, []);

  // Handle tool selection
  const handleToolSelect = (tool: ToolType) => {
    setCurrentTool(tool);
    if (drawingToolsManagerRef.current) {
      drawingToolsManagerRef.current.setActiveTool(tool);
    }
  };

  // ✅ Handle map view change with smooth transitions
  const handleMapViewChange = (newView: MapViewType) => {
    if (!osmLayerRef.current || !satelliteLayerRef.current || !mapRef.current)
      return;

    if (newView === currentMapView) return; // No change needed

    setIsTransitioning(true);
    setCurrentMapView(newView);

    // Set opacity for fade transition
    if (newView === "osm") {
      // Fade out satellite, fade in OSM
      satelliteLayerRef.current!.setOpacity(1);
      osmLayerRef.current!.setOpacity(0);
      osmLayerRef.current!.setVisible(true);

      // Simple opacity change with CSS transition (since OpenLayers layer.animate is not available)
      setTimeout(() => {
        satelliteLayerRef.current!.setOpacity(0);
        osmLayerRef.current!.setOpacity(1);
      }, 50);

      setTimeout(() => {
        satelliteLayerRef.current!.setVisible(false);
        setIsTransitioning(false);
      }, 250);
    } else {
      // Fade out OSM, fade in satellite
      osmLayerRef.current!.setOpacity(1);
      satelliteLayerRef.current!.setOpacity(0);
      satelliteLayerRef.current!.setVisible(true);

      // Simple opacity change with CSS transition
      setTimeout(() => {
        osmLayerRef.current!.setOpacity(0);
        satelliteLayerRef.current!.setOpacity(1);
      }, 50);

      setTimeout(() => {
        osmLayerRef.current!.setVisible(false);
        setIsTransitioning(false);
      }, 250);
    }
  };

  // ✅ Handle file import (GeoJSON, KML, KMZ)
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target?.result;
      if (!data) return;

      let features: Feature<Geometry>[] = [];

      try {
        if (name.endsWith(".geojson") || name.endsWith(".json")) {
          const json = JSON.parse(data as string);
          features = new GeoJSON().readFeatures(json, {
            featureProjection: "EPSG:3857",
          });
        } else if (name.endsWith(".kml")) {
          features = new KML({ extractStyles: false }).readFeatures(data, {
            featureProjection: "EPSG:3857",
          });
        } else if (name.endsWith(".kmz")) {
          const zip = await JSZip.loadAsync(file);
          const kmlFile = Object.keys(zip.files).find((f) =>
            f.toLowerCase().endsWith(".kml")
          );
          if (kmlFile) {
            const kmlText = await zip.file(kmlFile)?.async("text");
            if (kmlText) {
              features = new KML({ extractStyles: false }).readFeatures(
                kmlText,
                {
                  featureProjection: "EPSG:3857",
                }
              );
            }
          }
        }

        if (features.length === 0) {
          alert("No valid features found in the file.");
          return;
        }

        vectorSourceRef.current.clear();
        console.log(features, "features");
        vectorSourceRef.current.addFeatures(features);

        const extent: Extent = vectorSourceRef.current.getExtent();
        mapRef.current?.getView().fit(extent, {
          duration: 1000,
          padding: [50, 50, 50, 50],
        });
      } catch (err) {
        console.error("File parsing error:", err);
        alert("Invalid or unsupported file format.");
      }
    };

    if (name.endsWith(".kmz")) {
      // JSZip reads blob directly, no need to use FileReader
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  // ✅ Delete selected feature
  const handleDelete = () => {
    if (drawingToolsManagerRef.current) {
      const deleted = drawingToolsManagerRef.current.deleteSelectedFeature();
      if (!deleted) {
        alert("Please select a feature to delete.");
      }
    }
  };

  return (
    <div>
      <div id="map" className="relative w-full h-screen">
        <Toolbar
          onFileImport={handleImportClick}
          onDeleteFeature={handleDelete}
          onToolSelect={handleToolSelect}
          selectedTool={currentTool}
        />

        <input
          type="file"
          accept=".geojson,.json,.kml,.kmz"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <LoadingOverlay
          isVisible={isTransitioning}
          message="Switching map view..."
        />
        <MapViewToggle
          currentView={currentMapView}
          onViewChange={handleMapViewChange}
        />

        {/* ✅ Tooltip Popup */}
        <div
          ref={popupRef}
          className="absolute bg-white text-xs text-black rounded shadow-md p-2 border border-gray-300 z-[1000] pointer-events-none"
          style={{
            minWidth: "120px",
            maxWidth: "400px",
            whiteSpace: "normal",
            overflow: "auto",
            display: popupContent ? "block" : "none",
          }}
          dangerouslySetInnerHTML={{ __html: popupContent || "" }}
        />
      </div>
    </div>
  );
};

export default MapEditor;
