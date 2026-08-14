import StrokeSettings from "./StrokeSettings.tsx";

export default function Sidebar() {
    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-48 bg-gray-600/30 rounded-2xl p-3 flex flex-col gap-3 pointer-events-auto">
            <StrokeSettings />
        </div>
    );
}
