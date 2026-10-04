"use client"

import * as React from "react"
import { IconCamera, IconPhoto, IconX } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

// Long side in pixels. Enough to read small print, small enough to send on a
// slow connection.
const MAX_SIDE = 1600
const JPEG_QUALITY = 0.82

function toJpeg(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("No canvas")
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY)
}

function fileToJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      try {
        resolve(toJpeg(image, image.naturalWidth, image.naturalHeight))
      } catch (err) {
        reject(err)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not open that image"))
    }
    image.src = url
  })
}

// Live camera with a shutter button, or pick a photo. Hands back a shrunk
// JPEG data URL. Nothing is saved or sent from here.
export function PhotoCapture({ onPhoto }: { onPhoto: (dataUrl: string) => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [live, setLive] = React.useState(false)
  const [ready, setReady] = React.useState(false)

  const stopCamera = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setLive(false)
    setReady(false)
  }, [])

  React.useEffect(() => stopCamera, [stopCamera])

  React.useEffect(() => {
    if (live && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [live])

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      // Older phones, or a page not on https: the file picker still offers
      // the camera on most phones.
      fileRef.current?.click()
      return
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        audio: false,
      })
      setLive(true)
    } catch {
      toast.error("Could not open the camera. Allow camera access, or upload a photo.")
    }
  }

  function snap() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    try {
      onPhoto(toJpeg(video, video.videoWidth, video.videoHeight))
    } catch {
      toast.error("Could not take the photo. Try again.")
      return
    }
    stopCamera()
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      onPhoto(await fileToJpeg(file))
    } catch {
      toast.error("Could not open that photo. Try a different one.")
    }
  }

  return (
    <div className="grid gap-3">
      {live ? (
        <div className="grid gap-3">
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Camera view. Fit the whole page in the frame."
              onLoadedMetadata={() => setReady(true)}
              className="aspect-[3/4] max-h-[60vh] w-full object-contain sm:aspect-video"
            />
            <div className="pointer-events-none absolute inset-6 rounded-md border-2 border-dashed border-white/60" />
          </div>
          <p className="text-sm text-muted-foreground">
            Fit the whole page inside the box, in good light.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="lg" onClick={snap} disabled={!ready}>
              <IconCamera />
              Take photo
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={stopCamera}>
              <IconX />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="lg" onClick={startCamera}>
            <IconCamera />
            Use camera
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            <IconPhoto />
            Upload a photo
          </Button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleFile}
      />
    </div>
  )
}
