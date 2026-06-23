'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('warehouse')
  const [warehouseStock, setWarehouseStock] = useState([])
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
      fetch(`${API}?action=getWarehouseStock`).then(r => r.json()),
      fetch(`${API}?action=getInventory`).then(r => r.json()),
      fetch(`${API}?action=getCheckouts`).then(r => r.json()),
      fetch(`${API}?action=getUsage`).then(r => r.json()),
    ]).then(([ws, inv, c, u]) => {
      setWarehouseStock(ws.data || [])
      setInventory(inv.data || [])
      setCheckouts(c.data || [])
      setUsage(u.data || [])
      setLoading(false)
    })
  }, [])

  const technicians = [...new Set(inventory.map(i => i.technician))]
  const parts = [...new Set([...inventory.map(i => i.partName), ...warehouseStock.map(w => w.partName)])]

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

  const thStyle = { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A8A69F', borderBottom: '1px solid #E2E1DD', background: '#F9F9F8', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #F0EFED', color: '#1A1917', verticalAlign: 'middle' }

  if (!user) return null

  return (
    <div style={{ minHeight: '100dvh', background: '#F9F9F8' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#fff', borderBottom: '1px solid #E2E1DD' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>📦</span>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700 }}>Warehouse Tracker</p>
            <p style={{ fontSize: 12, color: '#A8A69F' }}>Admin · {user.name}</p>
          </div>
        </div>
        <button onClick={() => { sessionStorage.clear(); router.push('/login') }}
          style={{ border: 'none', background: 'none', color: '#A8A69F', fontSize: 13 }}>Sign out</button>
      </header>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 24px', background: '#fff', borderBottom: '1px solid #E2E1DD' }}>
        <button onClick={() => router.push('/receive')} style={{ padding: '14px', borderRadius: 10, border: 'none', background: '#E8611A', color: '#fff', fontSize: 15, fontWeight: 600 }}>
          📥 Receive Stock
        </button>
        <button onClick={() => router.push('/checkout')} style={{ padding: '14px', borderRadius: 10, border: '1.5px solid #E2E1DD', background: '#fff', color: '#1A1917', fontSize: 15, fontWeight: 600 }}>
          📦 Checkout
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 24px', background: '#fff', borderBottom: '1px solid #E2E1DD', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterTech} onChange={e => setFilterTech(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#F9F9F8', fontSize: 14, minWidth: 150 }}>
          <option value="">All technicians</option>
          {technicians.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterPart} onChange={e => setFilterPart(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#F9F9F8', fontSize: 14, minWidth: 150 }}>
          <option value="">All parts</option>
          {parts.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filterTech || filterPart) && (
          <button onClick={() => { setFilterTech(''); setFilterPart('') }}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #E2E1DD', background: '#fff', color: '#6B6963', fontSize: 14 }}>Clear</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E1DD', background: '#fff', padding: '0 24px', overflowX: 'auto' }}>
        {[
          { key: 'warehouse', label: '🏭 Warehouse' },
          { key: 'techstock', label: '👷 Tech Stock' },
          { key: 'checkouts', label: '📦 Checkouts' },
          { key: 'usage', label: '🔧 Usage' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '12px 16px', border: 'none', background: 'none', fontSize: 14, whiteSpace: 'nowrap',
            fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? '#E8611A' : '#6B6963',
            borderBottom: tab === t.key ? '2px solid #E8611A' : '2px solid transparent',
            marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '20px 24px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#A8A69F', padding: 40 }}>Loading…</p>
        ) : (
          <>
            {/* Warehouse Stock */}
            {tab === 'warehouse' && (
              <div style={{ overflowX: 'auto' }}>
                {warehouseStock.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#A8A69F', padding: 40 }}>No stock received yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E1DD', fontSize: 14 }}>
                    <thead>
                      <tr>
                        {['Part', 'Received', 'Checked Out', 'On Hand'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {warehouseStock.map((item, i) => (
                        <tr key={i}>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{item.partName}</td>
                          <td style={tdStyle}>{item.received}</td>
                          <td style={tdStyle}>{item.checkedOut}</td>
                          <td style={tdStyle}>
                            <span style={{ display: 'inline-block', padding: '2px 12px', borderRadius: 12, fontWeight: 700, background: item.onHand > 0 ? '#EBF5EF' : '#F0EFED', color: item.onHand > 0 ? '#2D7D46' : '#A8A69F' }}>{item.onHand}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tech Stock */}
            {tab === 'techstock' && (
              <div style={{ overflowX: 'auto' }}>
                {filteredInventory.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#A8A69F', padding: 40 }}>No data yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E1DD', fontSize: 14 }}>
                    <thead>
                      <tr>
                        {['Technician', 'Part', 'Received', 'Used', 'On Hand'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item, i) => (
                        <tr key={i}>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{item.technician}</td>
                          <td style={tdStyle}>{item.partName}</td>
                          <td style={{ ...tdStyle, color: '#6B6963' }}>{item.checkedOut}</td>
                          <td style={{ ...tdStyle, color: '#6B6963' }}>{item.used}</td>
                          <td style={tdStyle}>
                            <span style={{ display: 'inline-block', padding: '2px 12px', borderRadius: 12, fontWeight: 700, background: item.onHand > 0 ? '#EBF5EF' : '#F0EFED', color: item.onHand > 0 ? '#2D7D46' : '#A8A69F' }}>{item.onHand}</span>
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
                  <p style={{ textAlign: 'center', color: '#A8A69F', padding: 40 }}>No checkouts yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E1DD', fontSize: 14 }}>
                    <thead>
                      <tr>{['Date', 'Tech', 'Part', 'Qty', 'Notes'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredCheckouts.map((c, i) => (
                        <tr key={i}>
                          <td style={{ ...tdStyle, color: '#6B6963', fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(c.timestamp)}</td>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{c.technician}</td>
                          <td style={tdStyle}>{c.partName}</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#E8611A' }}>{c.quantity}</td>
                          <td style={{ ...tdStyle, color: '#A8A69F', fontSize: 13, fontStyle: 'italic' }}>{c.notes || '—'}</td>
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
                  <p style={{ textAlign: 'center', color: '#A8A69F', padding: 40 }}>No usage logged yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E1DD', fontSize: 14 }}>
                    <thead>
                      <tr>{['Date', 'Tech', 'Part', 'Qty', 'Job Address', 'Notes'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredUsage.map((u, i) => (
                        <tr key={i}>
                          <td style={{ ...tdStyle, color: '#6B6963', fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(u.timestamp)}</td>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{u.technician}</td>
                          <td style={tdStyle}>{u.partName}</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#2D7D46' }}>{u.quantity}</td>
                          <td style={{ ...tdStyle, color: '#6B6963', fontSize: 13 }}>{u.jobAddress || '—'}</td>
                          <td style={{ ...tdStyle, color: '#A8A69F', fontSize: 13, fontStyle: 'italic' }}>{u.notes || '—'}</td>
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
