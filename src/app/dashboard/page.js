'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [checkouts, setCheckouts] = useState([])
  const [usage, setUsage] = useState([])
  const [inventory, setInventory] = useState([])
  const [tab, setTab] = useState('inventory') // 'inventory' | 'checkouts' | 'usage'
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
    <div style={{ minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: '#fff',
        borderBottom: '1px solid var(--gray-200)', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--orange-light)', color: 'var(--orange)',
            fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {user.name[0]}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>{user.name}</p>
            <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Technician</p>
          </div>
        </div>
        <button
          onClick={() => { sessionStorage.clear(); router.push('/login') }}
          style={{ border: 'none', background: 'none', color: 'var(--gray-400)', fontSize: 13 }}
        >
          Sign out
        </button>
      </header>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 20px' }}>
        <button
          onClick={() => router.push('/checkout')}
          style={{
            padding: '16px', borderRadius: 'var(--radius)',
            border: 'none', background: 'var(--orange)', color: '#fff',
            fontSize: 15, fontWeight: 600
          }}
        >
          📦 Checkout Parts
        </button>
        <button
          onClick={() => router.push('/use')}
          style={{
            padding: '16px', borderRadius: 'var(--radius)',
            border: '1.5px solid var(--gray-200)', background: '#fff',
            color: 'var(--gray-900)', fontSize: 15, fontWeight: 600
          }}
        >
          🔧 Log Usage
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-200)', background: '#fff', padding: '0 20px' }}>
        {[
          { key: 'inventory', label: 'My Stock' },
          { key: 'checkouts', label: 'Checkouts' },
          { key: 'usage', label: 'Usage' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '12px 16px', border: 'none', background: 'none',
              fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--orange)' : 'var(--gray-600)',
              borderBottom: tab === t.key ? '2px solid var(--orange)' : '2px solid transparent',
              marginBottom: -1
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>Loading…</p>
        ) : (
          <>
            {/* My Stock */}
            {tab === 'inventory' && (
              <div>
                {inventory.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>No parts on hand yet</p>
                ) : (
                  inventory.map((item, i) => (
                    <div key={i} style={{
                      background: '#fff', borderRadius: 'var(--radius)',
                      border: '1px solid var(--gray-200)', padding: '14px 16px',
                      marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 500 }}>{item.partName}</p>
                        <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                          Checked out: {item.checkedOut} · Used: {item.used}
                        </p>
                      </div>
                      <div style={{
                        minWidth: 40, height: 40, borderRadius: 'var(--radius-sm)',
                        background: item.onHand > 0 ? 'var(--green-light)' : 'var(--gray-100)',
                        color: item.onHand > 0 ? 'var(--green)' : 'var(--gray-400)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 700
                      }}>
                        {item.onHand}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Checkouts */}
            {tab === 'checkouts' && (
              <div>
                {checkouts.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>No checkouts yet</p>
                ) : (
                  checkouts.map((c, i) => (
                    <div key={i} style={{
                      background: '#fff', borderRadius: 'var(--radius)',
                      border: '1px solid var(--gray-200)', padding: '14px 16px', marginBottom: 10
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ fontSize: 15, fontWeight: 500 }}>{c.partName}</p>
                        <span style={{
                          background: 'var(--orange-light)', color: 'var(--orange)',
                          fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 12
                        }}>×{c.quantity}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{c.jobAddress || '—'}</p>
                      <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{formatDate(c.timestamp)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Usage */}
            {tab === 'usage' && (
              <div>
                {usage.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>No usage logged yet</p>
                ) : (
                  usage.map((u, i) => (
                    <div key={i} style={{
                      background: '#fff', borderRadius: 'var(--radius)',
                      border: '1px solid var(--gray-200)', padding: '14px 16px', marginBottom: 10
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ fontSize: 15, fontWeight: 500 }}>{u.partName}</p>
                        <span style={{
                          background: 'var(--green-light)', color: 'var(--green)',
                          fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 12
                        }}>×{u.quantity}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{u.jobAddress || '—'}</p>
                      <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{formatDate(u.timestamp)}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
