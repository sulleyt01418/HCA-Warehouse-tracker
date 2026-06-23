'use client'
import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    let worker = null

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          scanFrame()
        }
      } catch (e) {
        setError('Camera access denied. Please allow camera and try again.')
      }
    }

    const scanFrame = () => {
      if (!videoRef.current || !scanning) return
      const video = videoRef.current
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(scanFrame)
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)

      if (window.BarcodeDetector) {
        const detector = new window.BarcodeDetector({ formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'] })
        detector.detect(canvas).then(barcodes => {
          if (barcodes.length > 0) {
            onDetected(barcodes[0].rawValue)
            stopCamera()
          } else {
            animFrameRef.current = requestAnimationFrame(scanFrame)
          }
        }).catch(() => {
          animFrameRef.current = requestAnimationFrame(scanFrame)
        })
      } else {
        setError('Barcode scanning not supported on this browser. Please enter manually.')
        stopCamera()
      }
    }

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }

    startCamera()
    return () => stopCamera()
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
        {error ? (
          <div style={{ color: '#fff', textAlign: 'center', padding: 24, fontSize: 15 }}>{error}</div>
        ) : (
          <>
            <video ref={videoRef} style={{ width: '100%', borderRadius: 12 }} playsInline muted />
            {/* Scan overlay */}
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: 240, height: 120, border: '2px solid #E8611A', borderRadius: 8,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)'
              }} />
            </div>
            <p style={{ color: '#fff', textAlign: 'center', marginTop: 16, fontSize: 14 }}>
              Point camera at barcode
            </p>
          </>
        )}
      </div>
      <button onClick={onClose} style={{
        marginTop: 24, padding: '12px 32px', borderRadius: 10,
        border: '1.5px solid #fff', background: 'transparent',
        color: '#fff', fontSize: 15, fontWeight: 600
      }}>Cancel</button>
    </div>
  )
}
