'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [checkouts, setCheckouts] = useState([])
  const [usage, setUsage] = useState([])
  const [inventory, setInventory] = useState([])
  const [tab, setTab] = useState('inventory')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('wt_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.role === 'admin') { router.push('/admin'); return }
    setUser(u)

    Promise.all([
      fetch(`${API}?action=getMyCheckouts&technician=${encodeURIComponent(u.name)}`).then(r => r.json()),
      fetch(`${API}?action=getMyUsage&technician=${encodeURIComponent(u.name)}`).then(r => r.json()),
      fetch(`${API}?action=getInventory`).then(r => r.json()),
    ]).then(([c, us, inv]) => {
      setCheckouts(c.data || [])
      setUsage(us.data || [])
      setInventory((inv.data || []).filter(i => i.technician === u.name))
      setLoading(false)
    })
  }, [])

  const formatDate = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (!user) return null

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', paddingBottom: 40, background: '#F9F9F8' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: '#fff', borderBottom: '1px solid #E2E1DD',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FDF0E8', color: '#E8611A', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user.name[0]}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>{user.name}</p>
            <p style={{ fontSize: 12, color: '#A8A69F' }}>Technician</p>
          </div>
        </div>
        <button onClick={() => { sessionStorage.clear(); router.push('/login') }}
          style={{ border: 'none', background: 'none', color: '#A8A69F', fontSize: 13 }}>Sign out</button>
      </header>

      {/* Log Usage button - main action */}
      <div style={{ padding: '16px 20px' }}>
        <button onClick={() => router.push('/use')} style={{
          width: '100%', padding: '18px', borderRadius: 12,
          border: 'none', background: '#E8611A', color: '#fff',
          fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
        }}>
          🔧 Log Part Usage
        </button>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#A8A69F', marginTop: 8 }}>
          Record parts used at a job
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E1DD', background: '#fff', padding: '0 20px' }}>
        {[
          { key: 'inventory', label: 'My Stock' },
          { key: 'checkouts', label: 'Received' },
          { key: 'usage', label: 'Used' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '12px 16px', border: 'none', background: 'none', fontSize: 14,
            fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? '#E8611A' : '#6B6963',
            borderBottom: tab === t.key ? '2px solid #E8611A' : '2px solid transparent',
            marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#A8A69F', padding: 40 }}>Loading…</p>
        ) : (
          <>
            {tab === 'inventory' && (
              <div>
                {inventory.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#A8A69F', padding: 40 }}>No parts on hand yet</p>
                ) : inventory.map((item, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E1DD', padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 500 }}>{item.partName}</p>
                      <p style={{ fontSize: 12, color: '#A8A69F', marginTop: 2 }}>Received: {item.checkedOut} · Used: {item.used}</p>
                    </div>
                    <div style={{ minWidth: 44, height: 44, borderRadius: 8, background: item.onHand > 0 ? '#EBF5EF' : '#F0EFED', color: item.onHand > 0 ? '#2D7D46' : '#A8A69F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                      {item.onHand}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'checkouts' && (
              <div>
                {checkouts.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#A8A69F', padding: 40 }}>No parts received yet</p>
                ) : checkouts.map((c, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E1DD', padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: 15, fontWeight: 500 }}>{c.partName}</p>
                      <span style={{ background: '#FDF0E8', color: '#E8611A', fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 12 }}>×{c.quantity}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#A8A69F', marginTop: 4 }}>{formatDate(c.timestamp)}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'usage' && (
              <div>
                {usage.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#A8A69F', padding: 40 }}>No usage logged yet</p>
                ) : usage.map((u, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E1DD', padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: 15, fontWeight: 500 }}>{u.partName}</p>
                      <span style={{ background: '#EBF5EF', color: '#2D7D46', fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 12 }}>×{u.quantity}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#A8A69F', marginTop: 4 }}>{u.jobAddress || '—'}</p>
                    <p style={{ fontSize: 11, color: '#A8A69F', marginTop: 2 }}>{formatDate(u.timestamp)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
