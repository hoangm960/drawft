import Canvas from "@components/Canvas/Canvas.tsx";
import ToolBar from "@components/ToolBar/ToolBar.tsx";
import SideBar from "@components/SideBar/Sidebar";

function App() {
    return (
        <div className="w-full h-full">
            <Canvas />
            <SideBar />
            <ToolBar />
        </div>
    );
}

export default App;
