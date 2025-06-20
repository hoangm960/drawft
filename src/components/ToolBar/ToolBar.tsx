import ToolButton from "./ToolButton.tsx"
import LineIcon from "@assets/line.svg"
import RectangleIcon from "@assets/rectangle.svg"
import EllipseIcon from "@assets/ellipse.svg"
import DiamondIcon from "@assets/diamond.svg"
import Triangle from "@assets/triangle.svg"
import ArrowIcon from "@assets/arrow.svg"

export default function ToolBar() {
    return (
        <div className="absolute bottom-0 w-full h-fit pb-4 flex items-center justify-center">
            <div className="bg-gray-600/30 h-15 w-fit flex flex-row gap-2 p-2 rounded-2xl">
                <ToolButton
                    icon={LineIcon}
                    onClick={() => {}}
                    tooltip="Line"
                ></ToolButton>
                <ToolButton
                    icon={RectangleIcon}
                    onClick={() => {}}
                    tooltip="Rectangle"
                ></ToolButton>
                <ToolButton
                    icon={EllipseIcon}
                    onClick={() => {}}
                    tooltip="Ellipse"
                ></ToolButton>
                <ToolButton
                    icon={DiamondIcon}
                    onClick={() => {}}
                    tooltip="Diamond"
                ></ToolButton>
                <ToolButton
                    icon={Triangle}
                    onClick={() => {}}
                    tooltip="Triangle"
                ></ToolButton>
                <ToolButton
                    icon={ArrowIcon}
                    onClick={() => {}}
                    tooltip="Arrow"
                ></ToolButton>
            </div>
        </div>
    )
}
