import { useState } from "react"
import Canvas from "@components/Canvas/Canvas.tsx"
import ToolBar from "@components/ToolBar/ToolBar.tsx"

function App() {
    return (
        <div className="w-full h-full">
            <Canvas></Canvas>
            <ToolBar></ToolBar>
        </div>
    )
}

export default App
