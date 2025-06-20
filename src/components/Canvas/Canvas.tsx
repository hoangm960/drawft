import { useState, useRef, useEffect } from "react"

export default function Canvas() {
    const canvasRef = useRef(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
    const [scale, setScale] = useState(1)

    useEffect(() => {
        const canvas = canvasRef.current
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        draw(canvas)
    }, [offset, scale])

    const draw = canvas => {
        const ctx = canvas.getContext("2d")

        ctx.setTransform(scale, 0, 0, scale, offset.x, offset.y)
        ctx.clearRect(
            -offset.x / scale,
            -offset.y / scale,
            canvas.width / scale,
            canvas.height / scale
        )
    }

    const handleMouseDown = e => {
        setIsDragging(true)
        setLastPos({ x: e.clientX, y: e.clientY })
    }

    const handleMouseMove = e => {
        if (!isDragging) return

        const dx = e.clientX - lastPos.x
        const dy = e.clientY - lastPos.y

        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
        setLastPos({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => setIsDragging(false)

    const handleWheel = e => {
        const zoomCoef = 0.001
        const zoomRange = [0.1, 5]

        const zoomAmount = -e.deltaY * zoomCoef
        const newScale = Math.min(
            Math.max(zoomRange[0], scale + zoomAmount),
            zoomRange[1]
        )
        setScale(newScale)
    }
    return (
        <canvas
            id="whiteboard"
            className="w-dvw h-dvh bg-gray-950"
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        ></canvas>
    )
}
