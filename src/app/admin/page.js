'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('inventory')
  const [inventory, setInventory] = useState([])
  const [checkouts, setCheckouts] = useState([])
  const [usage, setUsage] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTech, setFilterTech] = useState('')
  const [filterPart, setFilterPart] = useState('')
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('wt_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'admin') { router.push('/dashboard'); return }
    setUser(u)

    Promise.all([
      fetch(`${API}?action=getInventory`).then(r => r.json()),
      fetch(`${API}?action=getCheckouts`).then(r => r.json()),
      fetch(`${API}?action=getUsage`).then(r => r.json()),
    ]).then(([inv, c, u]) => {
      setInventory(inv.data || [])
      setCheckouts(c.data || [])
      setUsage(u.data || [])
      setLoading(false)
    })
  }, [])

  const technicians = [...new Set(inventory.map(i => i.technician))]
  const parts = [...new Set(inventory.map(i => i.partName))]

  const filteredInventory = inventory.filter(i =>
    (!filterTech || i.technician === filterTech) &&
    (!filterPart || i.partName === filterPart)
  )

  const filteredCheckouts = checkouts.filter(c =>
    (!filterTech || c.technician === filterTech) &&
    (!filterPart || c.partName === filterPart)
  )

  const filteredUsage = usage.filter(u =>
    (!filterTech || u.technician === filterTech) &&
    (!filterPart || u.partName === filterPart)
  )

  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--gray-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>📦</span>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700 }}>Warehouse Tracker</p>
            <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Admin · {user.name}</p>
          </div>
        </div>
        <button onClick={() => { sessionStorage.clear(); router.push('/login') }}
          style={{ border: 'none', background: 'none', color: 'var(--gray-400)', fontSize: 13 }}>
          Sign out
        </button>
      </header>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--gray-200)', flexWrap: 'wrap' }}>
        <select value={filterTech} onChange={e => setFilterTech(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', background: 'var(--gray-50)', fontSize: 14, minWidth: 160 }}>
          <option value="">All technicians</option>
          {technicians.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterPart} onChange={e => setFilterPart(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', background: 'var(--gray-50)', fontSize: 14, minWidth: 160 }}>
          <option value="">All parts</option>
          {parts.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filterTech || filterPart) && (
          <button onClick={() => { setFilterTech(''); setFilterPart('') }}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gray-200)', background: '#fff', color: 'var(--gray-600)', fontSize: 14 }}>
            Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: '#fff', padding: '0 24px' }}>
        {[
          { key: 'inventory', label: '📊 Stock Overview' },
          { key: 'checkouts', label: '📦 Checkouts' },
          { key: 'usage', label: '🔧 Usage' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '12px 16px', border: 'none', background: 'none', fontSize: 14,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--orange)' : 'var(--gray-600)',
              borderBottom: tab === t.key ? '2px solid var(--orange)' : '2px solid transparent',
              marginBottom: -1
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 24px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>Loading…</p>
        ) : (
          <>
            {/* Stock Overview */}
            {tab === 'inventory' && (
              <div style={{ overflowX: 'auto' }}>
                {filteredInventory.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>No data yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--gray-200)', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)' }}>
                        {['Technician', 'Part', 'Checked Out', 'Used', 'On Hand'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.technician}</td>
                          <td style={{ padding: '12px 16px' }}>{item.partName}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--gray-600)' }}>{item.checkedOut}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--gray-600)' }}>{item.used}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              display: 'inline-block', padding: '2px 12px', borderRadius: 12, fontWeight: 700,
                              background: item.onHand > 0 ? 'var(--green-light)' : 'var(--gray-100)',
                              color: item.onHand > 0 ? 'var(--green)' : 'var(--gray-400)'
                            }}>{item.onHand}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Checkouts */}
            {tab === 'checkouts' && (
              <div style={{ overflowX: 'auto' }}>
                {filteredCheckouts.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>No checkouts yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--gray-200)', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)' }}>
                        {['Date', 'Technician', 'Part', 'Qty', 'Purpose', 'Notes'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCheckouts.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                          <td style={{ padding: '12px 16px', color: 'var(--gray-600)', fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(c.timestamp)}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{c.technician}</td>
                          <td style={{ padding: '12px 16px' }}>{c.partName}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--orange)' }}>{c.quantity}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--gray-600)', fontSize: 13 }}>{c.jobAddress || '—'}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--gray-400)', fontSize: 13, fontStyle: 'italic' }}>{c.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Usage */}
            {tab === 'usage' && (
              <div style={{ overflowX: 'auto' }}>
                {filteredUsage.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>No usage logged yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--gray-200)', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)' }}>
                        {['Date', 'Technician', 'Part', 'Qty', 'Job Address', 'Notes'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsage.map((u, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                          <td style={{ padding: '12px 16px', color: 'var(--gray-600)', fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(u.timestamp)}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{u.technician}</td>
                          <td style={{ padding: '12px 16px' }}>{u.partName}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--green)' }}>{u.quantity}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--gray-600)', fontSize: 13 }}>{u.jobAddress || '—'}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--gray-400)', fontSize: 13, fontStyle: 'italic' }}>{u.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
