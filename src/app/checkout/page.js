'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL

export default function CheckoutPage() {
  const [user, setUser] = useState(null)
  const [parts, setParts] = useState([])
  const [items, setItems] = useState([{ partName: '', quantity: '' }])
  const [addressType, setAddressType] = useState('')
  const [jobAddress, setJobAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('wt_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored))
    fetch(`${API}?action=getParts`).then(r => r.json()).then(d => setParts(d.data || []))
  }, [])

  const addItem = () => setItems([...items, { partName: '', quantity: '' }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => {
    const updated = [...items]; updated[i][field] = value; setItems(updated)
  }

  const validItems = items.filter(it => it.partName && it.quantity > 0)
  const finalAddress = addressType === 'truck' ? 'Truck Restock' : jobAddress

  const handleSubmit = async () => {
    if (validItems.length === 0) { setError('Please select at least one part.'); return }
    if (!addressType) { setError('Please select Truck Restock or Specific Job.'); return }
    if (addressType === 'job' && !jobAddress.trim()) { setError('Please enter a job address.'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'addCheckout', technician: user.name, jobAddress: finalAddress, notes, items: validItems })
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
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>Checkout recorded!</h2>
      <p style={{ color: 'var(--gray-600)' }}>{validItems.length} item{validItems.length > 1 ? 's' : ''} logged</p>
      <button onClick={() => router.push('/dashboard')} style={{ marginTop: 8, padding: '14px 32px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--orange)', color: '#fff', fontSize: 16, fontWeight: 600 }}>Done</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: '#fff', borderBottom: '1px solid var(--gray-200)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/dashboard')} style={{ border: 'none', background: 'none', color: 'var(--orange)', fontSize: 14, fontWeight: 600, padding: 0 }}>← Back</button>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Checkout Parts</h1>
      </header>

      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Parts taken *</p>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <select value={item.partName} onChange={e => updateItem(i, 'partName', e.target.value)}
              style={{ flex: 1, padding: '11px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', background: '#fff', fontSize: 14 }}>
              <option value="">Select part…</option>
              {parts.map(p => <option key={p.name} value={p.name}>{p.name}{p.notes ? ` — ${p.notes}` : ''}</option>)}
            </select>
            <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
              style={{ width: 64, padding: '11px 8px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', background: '#fff', textAlign: 'center', fontSize: 15, fontWeight: 600 }} />
            {items.length > 1 && <button onClick={() => removeItem(i)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--gray-100)', color: 'var(--gray-600)', fontSize: 12 }}>✕</button>}
          </div>
        ))}
        <button onClick={addItem} style={{ border: 'none', background: 'none', color: 'var(--orange)', fontSize: 14, fontWeight: 600, padding: '8px 0' }}>+ Add another part</button>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Purpose *</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {[
            { key: 'truck', label: '🚚 Truck Restock' },
            { key: 'job', label: '📍 Specific Job' }
          ].map(opt => (
            <button key={opt.key} onClick={() => { setAddressType(addressType === opt.key ? '' : opt.key); setJobAddress('') }}
              style={{
                padding: '13px 16px', borderRadius: 'var(--radius-sm)', textAlign: 'left',
                border: `1.5px solid ${addressType === opt.key ? 'var(--orange)' : 'var(--gray-200)'}`,
                background: addressType === opt.key ? 'var(--orange-light)' : '#fff',
                color: addressType === opt.key ? 'var(--orange-dark)' : 'var(--gray-600)',
                fontSize: 15, fontWeight: 500
              }}>
              {opt.label}
            </button>
          ))}
        </div>
        {addressType === 'job' && (
          <input type="text" placeholder="e.g. 123 Main St, Las Vegas" value={jobAddress} onChange={e => setJobAddress(e.target.value)} autoFocus
            style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', background: '#fff', fontSize: 15 }} />
        )}
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
          {submitting ? 'Submitting…' : 'Submit checkout'}
        </button>
      </div>
    </div>
  )
}
