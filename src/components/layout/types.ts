import type * as fabric from "fabric"

export type ToolType = 'select' | 'rect' | 'circle' | 'triangle' | 'line' | 'text' | 'pencil'

export interface LayoutToolbarProps {
  activeTool: ToolType
  onToolChange: (tool: ToolType) => void
  onDeleteSelected: () => void
  onClear: () => void
  onImportImage: () => void
  onSaveLayout: () => void
}

export interface LayoutCanvasProps {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>
  activeTool: ToolType
  onToolChange: (tool: ToolType) => void
  onSelect: (object: fabric.FabricObject | null) => void
  initialData?: object // Fabric.js JSON data to load on init
}

export interface LayoutPropertiesPanelProps {
  selectedObject: fabric.FabricObject | null
  onChange: (key: string, value: unknown) => void
}
