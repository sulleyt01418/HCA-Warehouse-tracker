'use client'
import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onDetected, onClose }) {
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const scannerRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Load html5-qrcode from CDN
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
    script.onload = () => {
      if (mountedRef.current) setLoaded(true)
    }
    script.onerror = () => setError('Failed to load scanner. Check your connection.')
    document.head.appendChild(script)

    return () => {
      mountedRef.current = false
      stopScanner()
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    startScanner()
  }, [loaded])

  const startScanner = async () => {
    try {
      const scanner = new window.Html5Qrcode('barcode-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 120 } },
        (decodedText) => {
          stopScanner()
          onDetected(decodedText)
        },
        () => {} // ignore errors during scan
      )
    } catch (e) {
      setError('Camera access denied. Please allow camera and try again.')
    }
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
  }

  const handleClose = () => {
    stopScanner()
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px'
    }}>
      {error ? (
        <div style={{ color: '#fff', textAlign: 'center', padding: 24, fontSize: 15, lineHeight: 1.6 }}>{error}</div>
      ) : (
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div id="barcode-reader" style={{ borderRadius: 12, overflow: 'hidden', background: '#000' }} />
          {!loaded && (
            <p style={{ color: '#fff', textAlign: 'center', marginTop: 16, fontSize: 14 }}>Loading scanner…</p>
          )}
          {loaded && (
            <p style={{ color: '#fff', textAlign: 'center', marginTop: 16, fontSize: 14 }}>Point camera at barcode</p>
          )}
        </div>
      )}
      <button onClick={handleClose} style={{
        marginTop: 28, padding: '13px 36px', borderRadius: 10,
        border: '1.5px solid rgba(255,255,255,0.6)', background: 'transparent',
        color: '#fff', fontSize: 15, fontWeight: 600
      }}>Cancel</button>
    </div>
  )
}
