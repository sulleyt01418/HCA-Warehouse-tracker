'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

export default function UsePage() {
  const [user, setUser] = useState(null)
  const [parts, setParts] = useState([])
  const [myStock, setMyStock] = useState([])
  const [items, setItems] = useState([{ partName: '', quantity: '' }])
  const [jobAddress, setJobAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('wt_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    setUser(u)
    Promise.all([
      fetch(`${API}?action=getParts`).then(r => r.json()),
      fetch(`${API}?action=getInventory`).then(r => r.json()),
    ]).then(([p, inv]) => {
      setParts(p.data || [])
      setMyStock((inv.data || []).filter(i => i.technician === u.name && i.onHand > 0))
    })

    // Load Google Maps
    if (window.google) { setMapsLoaded(true); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`
    script.async = true
    script.onload = () => setMapsLoaded(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!mapsLoaded || !inputRef.current) return
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['formatted_address'],
      types: ['address']
    })
    autocompleteRef.current = autocomplete
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        setJobAddress(place.formatted_address)
      }
    })
  }, [mapsLoaded])

  const addItem = () => setItems([...items, { partName: '', quantity: '' }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => {
    const updated = [...items]; updated[i][field] = value; setItems(updated)
  }

  const validItems = items.filter(it => it.partName && it.quantity > 0)

  const handleSubmit = async () => {
    if (validItems.length === 0) { setError('Please select at least one part.'); return }
    if (!jobAddress.trim()) { setError('Please enter the job address.'); return }

    for (const item of validItems) {
      const stock = myStock.find(s => s.partName === item.partName)
      const onHand = stock ? stock.onHand : 0
      if (Number(item.quantity) > onHand) {
        setError(`Not enough ${item.partName} on hand (you have ${onHand})`)
        return
      }
    }

    setSubmitting(true); setError('')
    try {
      const res = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'addUsage', technician: user.name, jobAddress, notes, items: validItems })
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
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>Usage logged!</h2>
      <p style={{ color: '#6B6963' }}>{validItems.length} item{validItems.length > 1 ? 's' : ''} recorded for {jobAddress}</p>
      <button onClick={() => router.push('/dashboard')} style={{ marginTop: 8, padding: '14px 32px', borderRadius: 10, border: 'none', background: '#E8611A', color: '#fff', fontSize: 16, fontWeight: 600 }}>Done</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', paddingBottom: 100, background: '#F9F9F8' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', borderBottom: '1px solid #E2E1DD', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/dashboard')} style={{ border: 'none', background: 'none', color: '#E8611A', fontSize: 14, fontWeight: 600, padding: 0 }}>← Back</button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Log Usage</h1>
      </header>

      {/* My stock */}
      {myStock.length > 0 && (
        <div style={{ padding: '14px 20px', background: '#EBF2FB', borderBottom: '1px solid #C5D9F0' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#1A5EA8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Your current stock</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {myStock.map(s => (
              <span key={s.partName} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12, background: '#fff', color: '#1A5EA8', border: '1px solid #C5D9F0', fontWeight: 500 }}>
                {s.partName} ×{s.onHand}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Parts */}
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#6B6963', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Parts used *</p>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <select value={item.partName} onChange={e => updateItem(i, 'partName', e.target.value)}
              style={{ flex: 1, padding: '11px 12px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#fff', fontSize: 14 }}>
              <option value="">Select part…</option>
              {myStock.length > 0
                ? myStock.map(s => <option key={s.partName} value={s.partName}>{s.partName} (×{s.onHand})</option>)
                : parts.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
              }
            </select>
            <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
              style={{ width: 64, padding: '11px 8px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#fff', textAlign: 'center', fontSize: 15, fontWeight: 600 }} />
            {items.length > 1 && <button onClick={() => removeItem(i)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F0EFED', color: '#6B6963', fontSize: 12 }}>✕</button>}
          </div>
        ))}
        <button onClick={addItem} style={{ border: 'none', background: 'none', color: '#E8611A', fontSize: 14, fontWeight: 600, padding: '8px 0' }}>+ Add another part</button>
      </div>

      {/* Job address with Places Autocomplete */}
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#6B6963', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Job address *</p>
        <input
          ref={inputRef}
          type="text"
          placeholder="Start typing address…"
          value={jobAddress}
          onChange={e => setJobAddress(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#fff', fontSize: 15 }}
        />
        {!mapsLoaded && <p style={{ fontSize: 12, color: '#A8A69F', marginTop: 6 }}>Loading address search…</p>}
      </div>

      {/* Notes */}
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#6B6963', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Notes <span style={{ color: '#A8A69F', fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
        <textarea rows={2} placeholder="Any additional info…" value={notes} onChange={e => setNotes(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#fff', fontSize: 15, resize: 'none' }} />
      </div>

      {error && <div style={{ margin: '16px 20px 0', padding: '12px 14px', borderRadius: 8, background: '#FDECEA', color: '#C0392B', fontSize: 14 }}>{error}</div>}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: '#fff', borderTop: '1px solid #E2E1DD', maxWidth: 480, margin: '0 auto' }}>
        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', padding: 15, borderRadius: 10, border: 'none', background: submitting ? '#E2E1DD' : '#E8611A', color: submitting ? '#A8A69F' : '#fff', fontSize: 16, fontWeight: 600 }}>
          {submitting ? 'Submitting…' : 'Log usage'}
        </button>
      </div>
    </div>
  )
}
