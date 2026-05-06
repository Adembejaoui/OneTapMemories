"use client"

import { QRCodeSVG } from "qrcode.react"
import { Button } from "components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/ui/card"
import { Input } from "components/ui/input"
import { Download } from "lucide-react"
import { useState } from "react"

interface Props {
  eventUrl: string
  eventName: string
}

export default function QRCodeDisplay({ eventUrl, eventName }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(eventUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    // Find the SVG element in the DOM
    const svg = document.querySelector("svg")
    if (!svg) {
      console.error("QR code SVG not found in DOM")
      return
    }

    // Clone SVG to avoid modifying the displayed one
    const svgClone = svg.cloneNode(true) as SVGElement

    // Get dimensions from SVG attributes
    const width = parseInt(svg.getAttribute("width") || "220", 10)
    const height = parseInt(svg.getAttribute("height") || "220", 10)

    // Set explicit dimensions on the clone
    svgClone.setAttribute("width", String(width))
    svgClone.setAttribute("height", String(height))

    const svgData = new XMLSerializer().serializeToString(svgClone)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        URL.revokeObjectURL(url)
        return
      }
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.download = `${eventName.replace(/\s+/g, "_")}_qr.png`
          link.href = pngUrl
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(pngUrl)
        }
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      console.error("Failed to load SVG for QR code download")
    }

    img.src = url
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Your event is ready!</CardTitle>
        <CardDescription>{eventName}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div style={{ display: "inline-block" }}>
          <QRCodeSVG value={eventUrl} size={220} />
        </div>
        <div className="w-full space-y-3">
          <Input value={eventUrl} readOnly />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCopy}>
              Copy link
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Guests can scan this QR code to upload their photos
        </p>
      </CardContent>
    </Card>
  )
}
