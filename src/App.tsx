import { Route, Routes } from "react-router";
import MapEditor from "./pages/MapEditor";
import LayoutEditor from "./pages/LayoutEditor";
import LayoutsList from "./pages/LayoutsList";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MapEditor />} />
      <Route path="/layouts" element={<LayoutsList />} />
      <Route path="/layout" element={<LayoutEditor />} />
      <Route path="/layout/:layoutId" element={<LayoutEditor />} />
    </Routes>
  )
}

export default App;
