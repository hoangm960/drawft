import { useRef, useEffect } from "react"

export default function Canvas() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        if (canvas) {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight

            const handleResize = () => {
                canvas.width = window.innerWidth
                canvas.height = window.innerHeight
            }
            window.addEventListener("resize", handleResize)
        }

        const svgString = `
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="orange" stroke="black" stroke-width="5"/>
          </svg>
        `
        const svgBlob = new Blob([svgString], {
            type: "image/svg+xml;charset=utf-8",
        })
        const url = URL.createObjectURL(svgBlob)

        const img = new Image()
        img.onload = () => {
            ctx.drawImage(img, 0, 0)
            URL.revokeObjectURL(url)
        }
        img.src = url
    }, [])

    return (
        <canvas
            id="whiteboard"
            className="bg-gray-950"
            ref={canvasRef}
        ></canvas>
    )
}
