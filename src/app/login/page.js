'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL

const TECHNICIANS = ['Javier', 'Eduardo', 'Sergio', 'Alan', 'Ocean', 'Miguel', 'Maddiel', 'Sulley']

export default function LoginPage() {
  const [step, setStep] = useState('name') // 'name' | 'pin'
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const selectName = (n) => {
    setName(n)
    setPin('')
    setError('')
    setStep('pin')
  }

  const handlePin = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) {
        submitLogin(newPin)
      }
    }
  }

  const submitLogin = async (enteredPin) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', name, pin: enteredPin })
      })
      const data = await res.json()
      if (data.success) {
        sessionStorage.setItem('wt_user', JSON.stringify({ name: data.name, role: data.role }))
        if (data.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError('Wrong PIN, try again')
        setPin('')
      }
    } catch (e) {
      setError('Network error, try again')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', maxWidth: 420, margin: '0 auto', padding: '0 20px 40px' }}>
      <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)' }}>Warehouse Tracker</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-400)', marginTop: 4 }}>Hot Cold Air</p>
      </div>

      {step === 'name' && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Who are you?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {TECHNICIANS.map(t => (
              <button
                key={t}
                onClick={() => selectName(t)}
                style={{
                  padding: '14px 8px',
                  borderRadius: 'var(--radius)',
                  border: '1.5px solid var(--gray-200)',
                  background: '#fff',
                  color: 'var(--gray-900)',
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'pin' && (
        <div>
          <button
            onClick={() => { setStep('name'); setPin(''); setError('') }}
            style={{ border: 'none', background: 'none', color: 'var(--orange)', fontSize: 14, fontWeight: 600, marginBottom: 24, padding: 0 }}
          >
            ← Back
          </button>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--orange-light)', color: 'var(--orange)',
              fontSize: 20, fontWeight: 700, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: 10
            }}>
              {name[0]}
            </div>
            <p style={{ fontSize: 17, fontWeight: 600 }}>{name}</p>
            <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 4 }}>Enter your PIN</p>
          </div>

          {/* PIN dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: '50%',
                background: pin.length > i ? 'var(--orange)' : 'var(--gray-200)',
                transition: 'background 0.15s'
              }} />
            ))}
          </div>

          {error && (
            <div style={{ textAlign: 'center', color: 'var(--red)', fontSize: 14, marginBottom: 16 }}>{error}</div>
          )}

          {/* Numpad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
              <button
                key={i}
                onClick={() => {
                  if (d === '⌫') setPin(p => p.slice(0, -1))
                  else if (d !== '') handlePin(d)
                }}
                disabled={loading || d === ''}
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius)',
                  border: '1.5px solid var(--gray-200)',
                  background: d === '' ? 'transparent' : '#fff',
                  color: 'var(--gray-900)',
                  fontSize: d === '⌫' ? 18 : 20,
                  fontWeight: 500,
                  borderColor: d === '' ? 'transparent' : 'var(--gray-200)',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading && d === '0' ? '…' : d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
