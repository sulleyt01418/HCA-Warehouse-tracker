'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL

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
  }, [])

  const addItem = () => setItems([...items, { partName: '', quantity: '' }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => {
    const updated = [...items]; updated[i][field] = value; setItems(updated)
  }

  const validItems = items.filter(it => it.partName && it.quantity > 0)

  const handleSubmit = async () => {
    if (validItems.length === 0) { setError('Please select at least one part.'); return }
    if (!jobAddress.trim()) { setError('Please enter the job address.'); return }

    // Check if technician has enough stock
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 40 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-light)', color: 'var(--green)', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>Usage logged!</h2>
      <p style={{ color: 'var(--gray-600)' }}>{validItems.length} item{validItems.length > 1 ? 's' : ''} recorded for {jobAddress}</p>
      <button onClick={() => router.push('/dashboard')} style={{ marginTop: 8, padding: '14px 32px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--orange)', color: '#fff', fontSize: 16, fontWeight: 600 }}>Done</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', borderBottom: '1px solid var(--gray-200)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/dashboard')} style={{ border: 'none', background: 'none', color: 'var(--orange)', fontSize: 14, fontWeight: 600, padding: 0 }}>← Back</button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Log Usage</h1>
      </header>

      {/* My stock summary */}
      {myStock.length > 0 && (
        <div style={{ padding: '16px 20px', background: 'var(--blue-light)', borderBottom: '1px solid #C5D9F0' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Your current stock</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {myStock.map(s => (
              <span key={s.partName} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12, background: '#fff', color: 'var(--blue)', border: '1px solid #C5D9F0', fontWeight: 500 }}>
                {s.partName} ×{s.onHand}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Parts used *</p>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <select value={item.partName} onChange={e => updateItem(i, 'partName', e.target.value)}
              style={{ flex: 1, padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', background: '#fff', fontSize: 14 }}>
              <option value="">Select part…</option>
              {myStock.length > 0
                ? myStock.map(s => <option key={s.partName} value={s.partName}>{s.partName} (×{s.onHand} on hand)</option>)
                : parts.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
              }
            </select>
            <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
              style={{ width: 64, padding: '11px 8px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', background: '#fff', textAlign: 'center', fontSize: 15, fontWeight: 600 }} />
            {items.length > 1 && <button onClick={() => removeItem(i)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--gray-100)', color: 'var(--gray-600)', fontSize: 12 }}>✕</button>}
          </div>
        ))}
        <button onClick={addItem} style={{ border: 'none', background: 'none', color: 'var(--orange)', fontSize: 14, fontWeight: 600, padding: '8px 0' }}>+ Add another part</button>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Job address *</p>
        <input type="text" placeholder="e.g. 123 Main St, Las Vegas" value={jobAddress} onChange={e => setJobAddress(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', background: '#fff', fontSize: 15 }} />
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Notes <span style={{ color: 'var(--gray-400)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
        <textarea rows={2} placeholder="Any additional info…" value={notes} onChange={e => setNotes(e.target.value)}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', background: '#fff', fontSize: 15, resize: 'none' }} />
      </div>

      {error && <div style={{ margin: '16px 20px 0', padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--red-light)', color: 'var(--red)', fontSize: 14 }}>{error}</div>}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: '#fff', borderTop: '1px solid var(--gray-200)', maxWidth: 480, margin: '0 auto' }}>
        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', padding: 15, borderRadius: 'var(--radius)', border: 'none', background: submitting ? 'var(--gray-200)' : 'var(--orange)', color: submitting ? 'var(--gray-400)' : '#fff', fontSize: 16, fontWeight: 600 }}>
          {submitting ? 'Submitting…' : 'Log usage'}
        </button>
      </div>
    </div>
  )
}
