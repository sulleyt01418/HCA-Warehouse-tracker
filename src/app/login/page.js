'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL

const TECHNICIANS = ['Javier', 'Eduardo', 'Sergio', 'Alan', 'Ocean', 'Miguel', 'Maddiel', 'Sulley']

export default function LoginPage() {
  const [step, setStep] = useState('name')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const selectName = (n) => {
    setName(n); setPin(''); setError(''); setStep('pin')
  }

  const handlePin = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) submitLogin(newPin)
    }
  }

  const submitLogin = async (enteredPin) => {
    setLoading(true); setError('')
    try {
      const res = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', name, pin: enteredPin })
      })
      const data = await res.json()
      if (data.success) {
        sessionStorage.setItem('wt_user', JSON.stringify({ name: data.name, role: data.role }))
        router.push(data.role === 'admin' ? '/admin' : '/dashboard')
      } else {
        setError('Wrong PIN, try again'); setPin('')
      }
    } catch {
      setError('Network error, try again'); setPin('')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 420, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', background: '#F9F9F8' }}>
      <div style={{ textAlign: 'center', padding: '40px 0 28px' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1917' }}>Warehouse Tracker</h1>
        <p style={{ fontSize: 14, color: '#A8A69F', marginTop: 4 }}>Hot Cold Air</p>
      </div>

      {step === 'name' && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#6B6963', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Who are you?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {TECHNICIANS.map(t => (
              <button key={t} onClick={() => selectName(t)} style={{
                padding: '16px 8px',
                borderRadius: '10px',
                border: '1.5px solid #E2E1DD',
                background: '#ffffff',
                color: '#1A1917',
                fontSize: 15,
                fontWeight: 500,
              }}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {step === 'pin' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => { setStep('name'); setPin(''); setError('') }}
            style={{ border: 'none', background: 'none', color: '#E8611A', fontSize: 14, fontWeight: 600, marginBottom: 20, padding: 0, textAlign: 'left' }}>
            ← Back
          </button>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#FDF0E8', color: '#E8611A',
              fontSize: 20, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 10
            }}>{name[0]}</div>
            <p style={{ fontSize: 17, fontWeight: 600, color: '#1A1917' }}>{name}</p>
            <p style={{ fontSize: 13, color: '#A8A69F', marginTop: 4 }}>Enter your PIN</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: '50%',
                background: pin.length > i ? '#E8611A' : '#E2E1DD',
                transition: 'background 0.15s'
              }} />
            ))}
          </div>

          {error && <div style={{ textAlign: 'center', color: '#C0392B', fontSize: 14, marginBottom: 16 }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingBottom: '20px' }}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
              <button key={i}
                onClick={() => {
                  if (d === '⌫') setPin(p => p.slice(0, -1))
                  else if (d !== '') handlePin(d)
                }}
                disabled={loading || d === ''}
                style={{
                  padding: '20px 8px',
                  borderRadius: '10px',
                  border: d === '' ? '1.5px solid transparent' : '1.5px solid #E2E1DD',
                  background: d === '' ? 'transparent' : '#ffffff',
                  color: '#1A1917',
                  fontSize: d === '⌫' ? 20 : 22,
                  fontWeight: 500,
                  opacity: loading ? 0.5 : 1,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >{loading && d === '0' ? '…' : d}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
