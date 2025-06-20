import ToolButton from "./ToolButton.tsx";
import LineIcon from "@assets/line.svg";
import RectangleIcon from "@assets/rectangle.svg";
import EllipseIcon from "@assets/ellipse.svg";
import DiamondIcon from "@assets/diamond.svg";
import Triangle from "@assets/triangle.svg";
import ArrowIcon from "@assets/arrow.svg";
import PanIcon from "@assets/pan.svg";
import { useState, useEffect } from "react";
import { Tools, useTool } from "@/store.ts";

export default function ToolBar() {
    const { tool, setTool } = useTool();

    return (
        <div className="absolute bottom-0 w-full h-fit pb-4 flex items-center justify-center">
            <div className="bg-gray-600/30 h-20 w-fit flex flex-row gap-2 px-8 py-4 rounded-2xl">
                <ToolButton
                    icon={PanIcon}
                    onClick={() => {
                        setTool(Tools.pan);
                    }}
                    tooltip="Pan"
                ></ToolButton>
                <ToolButton
                    icon={RectangleIcon}
                    onClick={() => {
                        setTool(Tools.rect);
                    }}
                    tooltip="Rectangle"
                ></ToolButton>
                <ToolButton
                    icon={DiamondIcon}
                    onClick={() => {
                        setTool(Tools.dia);
                    }}
                    tooltip="Diamond"
                ></ToolButton>
                <ToolButton
                    icon={EllipseIcon}
                    onClick={() => {
                        setTool(Tools.ellipse);
                    }}
                    tooltip="Ellipse"
                ></ToolButton>
                <ToolButton
                    icon={ArrowIcon}
                    onClick={() => {
                        setTool(Tools.arrow);
                    }}
                    tooltip="Arrow"
                ></ToolButton>
                <ToolButton
                    icon={LineIcon}
                    onClick={() => {
                        setTool(Tools.line);
                    }}
                    tooltip="Line"
                ></ToolButton>
            </div>
        </div>
    );
}
