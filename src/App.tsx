import Canvas from "@components/Canvas/Canvas.tsx";
import ToolBar from "@components/ToolBar/ToolBar.tsx";
import SideBar from "@components/SideBar/Sidebar";
import BoardStatus from "@components/BoardStatus/BoardStatus";

function App() {
    return (
        <div className="w-full h-full">
            <Canvas />
            <SideBar />
            <ToolBar />
            <BoardStatus />
        </div>
    );
}

export default App;
