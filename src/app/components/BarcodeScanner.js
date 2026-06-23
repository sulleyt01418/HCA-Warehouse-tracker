'use client'
import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Starting camera…')
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)
  const activeRef = useRef(true)

  useEffect(() => {
    activeRef.current = true

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setStatus('Point camera at barcode')
          loadZxing()
        }
      } catch (e) {
        setError('Camera access denied. Please allow camera and try again.')
      }
    }

    const loadZxing = () => {
      if (window.ZXing) { startScan(); return }
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js'
      script.onload = () => startScan()
      script.onerror = () => setError('Failed to load scanner. Check your connection.')
      document.head.appendChild(script)
    }

    const startScan = () => {
      const scan = () => {
        if (!activeRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          animFrameRef.current = requestAnimationFrame(scan)
          return
        }
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const hints = new Map()
          const formats = [
            window.ZXing.BarcodeFormat.CODE_128,
            window.ZXing.BarcodeFormat.CODE_39,
            window.ZXing.BarcodeFormat.EAN_13,
            window.ZXing.BarcodeFormat.EAN_8,
            window.ZXing.BarcodeFormat.UPC_A,
            window.ZXing.BarcodeFormat.UPC_E,
            window.ZXing.BarcodeFormat.QR_CODE,
          ]
          hints.set(window.ZXing.DecodeHintType.POSSIBLE_FORMATS, formats)
          const reader = new window.ZXing.MultiFormatReader()
          reader.setHints(hints)
          const luminance = new window.ZXing.RGBLuminanceSource(imageData.data, canvas.width, canvas.height)
          const binary = new window.ZXing.BinaryBitmap(new window.ZXing.HybridBinarizer(luminance))
          const result = reader.decode(binary)
          if (result) {
            stopCamera()
            onDetected(result.getText())
            return
          }
        } catch (e) {
          // no barcode found this frame, keep scanning
        }
        animFrameRef.current = requestAnimationFrame(scan)
      }
      animFrameRef.current = requestAnimationFrame(scan)
    }

    const stopCamera = () => {
      activeRef.current = false
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }

    startCamera()
    return () => stopCamera()
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px'
    }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
        {error ? (
          <div style={{ color: '#fff', textAlign: 'center', padding: 24, fontSize: 15, lineHeight: 1.6 }}>{error}</div>
        ) : (
          <>
            <video ref={videoRef} style={{ width: '100%', borderRadius: 12, display: 'block' }} playsInline muted />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: 260, height: 130, border: '2.5px solid #E8611A', borderRadius: 10, boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }} />
            </div>
            <p style={{ color: '#fff', textAlign: 'center', marginTop: 16, fontSize: 14 }}>{status}</p>
          </>
        )}
      </div>
      <button onClick={onClose} style={{
        marginTop: 28, padding: '13px 36px', borderRadius: 10,
        border: '1.5px solid rgba(255,255,255,0.6)', background: 'transparent',
        color: '#fff', fontSize: 15, fontWeight: 600
      }}>Cancel</button>
    </div>
  )
}
