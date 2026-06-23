'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BarcodeScanner from '../components/BarcodeScanner'

const API = process.env.NEXT_PUBLIC_API_URL

export default function ReceivePage() {
  const [user, setUser] = useState(null)
  const [parts, setParts] = useState([])
  const [items, setItems] = useState([{ partName: '', barcode: '', quantity: '' }])
  const [notes, setNotes] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanTarget, setScanTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('wt_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'admin') { router.push('/dashboard'); return }
    setUser(u)
    fetch(`${API}?action=getParts`).then(r => r.json()).then(d => setParts(d.data || []))
  }, [])

  const addItem = () => setItems([...items, { partName: '', barcode: '', quantity: '' }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => {
    const updated = [...items]; updated[i][field] = value; setItems(updated)
  }

  const handleBarcode = async (barcode) => {
    setScanning(false)
    // Look up part by barcode
    const res = await fetch(`${API}?action=getPartByBarcode&barcode=${encodeURIComponent(barcode)}`)
    const data = await res.json()
    if (data.found) {
      const updated = [...items]
      updated[scanTarget] = { partName: data.data.name, barcode, quantity: updated[scanTarget].quantity }
      setItems(updated)
    } else {
      // barcode not found, just store the barcode and let user pick part manually
      const updated = [...items]
      updated[scanTarget] = { ...updated[scanTarget], barcode, partName: '' }
      setItems(updated)
      setError(`Barcode ${barcode} not found in parts list. Please select part manually or add barcode to Parts sheet.`)
    }
    setScanTarget(null)
  }

  const validItems = items.filter(it => it.partName && it.quantity > 0)

  const handleSubmit = async () => {
    if (validItems.length === 0) { setError('Please add at least one part with quantity.'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'addReceive', notes, items: validItems })
      })
      const data = await res.json()
      if (data.success) setSubmitted(true)
      else setError('Something went wrong. Please try again.')
    } catch { setError('Network error. Please try again.') }
    setSubmitting(false)
  }

  if (!user) return null

  if (submitted) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 40 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EBF5EF', color: '#2D7D46', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>Stock received!</h2>
      <p style={{ color: '#6B6963' }}>{validItems.length} item{validItems.length > 1 ? 's' : ''} added to warehouse</p>
      <button onClick={() => router.push('/admin')} style={{ marginTop: 8, padding: '14px 32px', borderRadius: 10, border: 'none', background: '#E8611A', color: '#fff', fontSize: 16, fontWeight: 600 }}>Done</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', paddingBottom: 100, background: '#F9F9F8' }}>
      {scanning && <BarcodeScanner onDetected={handleBarcode} onClose={() => { setScanning(false); setScanTarget(null) }} />}

      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', borderBottom: '1px solid #E2E1DD', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/admin')} style={{ border: 'none', background: 'none', color: '#E8611A', fontSize: 14, fontWeight: 600, padding: 0 }}>← Back</button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Receive Stock</h1>
      </header>

      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#6B6963', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Parts received *</p>

        {items.map((item, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #E2E1DD', padding: '14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <button
                onClick={() => { setScanTarget(i); setScanning(true) }}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#F9F9F8', fontSize: 20, flexShrink: 0 }}
              >📷</button>
              <div style={{ flex: 1, fontSize: 13, color: item.barcode ? '#1A1917' : '#A8A69F', padding: '10px 12px', background: '#F9F9F8', borderRadius: 8, border: '1.5px solid #E2E1DD' }}>
                {item.barcode || 'Scan barcode…'}
              </div>
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F0EFED', color: '#6B6963', fontSize: 12, flexShrink: 0 }}>✕</button>
              )}
            </div>
            <select value={item.partName} onChange={e => updateItem(i, 'partName', e.target.value)}
              style={{ width: '100%', padding: '11px 12px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#fff', fontSize: 14, marginBottom: 8 }}>
              <option value="">Select part…</option>
              {parts.map(p => <option key={p.name} value={p.name}>{p.name}{p.notes ? ` — ${p.notes}` : ''}</option>)}
            </select>
            <input type="number" min="1" placeholder="Quantity received" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
              style={{ width: '100%', padding: '11px 12px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#fff', fontSize: 15, fontWeight: 600 }} />
          </div>
        ))}

        <button onClick={addItem} style={{ border: 'none', background: 'none', color: '#E8611A', fontSize: 14, fontWeight: 600, padding: '8px 0' }}>+ Add another part</button>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#6B6963', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Notes <span style={{ color: '#A8A69F', fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
        <textarea rows={2} placeholder="e.g. Invoice #1234, vendor name…" value={notes} onChange={e => setNotes(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#fff', fontSize: 15, resize: 'none' }} />
      </div>

      {error && <div style={{ margin: '16px 20px 0', padding: '12px 14px', borderRadius: 8, background: '#FDECEA', color: '#C0392B', fontSize: 14 }}>{error}</div>}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: '#fff', borderTop: '1px solid #E2E1DD', maxWidth: 480, margin: '0 auto' }}>
        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', padding: 15, borderRadius: 10, border: 'none', background: submitting ? '#E2E1DD' : '#E8611A', color: submitting ? '#A8A69F' : '#fff', fontSize: 16, fontWeight: 600 }}>
          {submitting ? 'Saving…' : 'Confirm receipt'}
        </button>
      </div>
    </div>
  )
}
