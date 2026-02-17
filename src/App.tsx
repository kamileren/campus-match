import { useState, useEffect, useRef, type FormEvent } from 'react'
import './App.css'
import { supabase } from './supabase'

const LAUNCH_DATE = new Date('2026-03-03T00:00:00')

const TAGLINES = [
  'Find your people at Carleton.',
  'Your next best friend is one survey away.',
  'Study partners. Soulmates. Or both.',
  'Because the tunnel connects more than buildings.',
  'Let the algorithm do the awkward part.',
]

function getTimeLeft() {
  const now = new Date().getTime()
  const diff = LAUNCH_DATE.getTime() - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="6" width="32" height="36" rx="4" />
        <path d="M16 2v8M32 2v8M8 18h32" />
        <path d="M20 28l4 4 6-8" stroke="var(--sage)" strokeWidth="3" />
      </svg>
    ),
    title: 'Sign up with your Carleton email',
    description: 'Only @cmail.carleton.ca — this is Ravens-only territory.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 14h24M12 24h18M12 34h12" />
        <circle cx="38" cy="34" r="6" stroke="var(--amber)" strokeWidth="3" fill="none" />
        <path d="M36 34l2 2 3-4" stroke="var(--amber)" strokeWidth="2" />
      </svg>
    ),
    title: 'Answer a few fun questions',
    description: 'What\'s your ideal study spot? Pizza or shawarma? We\'ll take it from here.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="8" width="18" height="14" rx="4" />
        <path d="M8 22v4l-2 3" />
        <rect x="26" y="18" width="18" height="14" rx="4" />
        <path d="M40 32v4l2 3" />
        <path d="M24 20l-1.5-3 1.5-3 1.5 3z" stroke="var(--terra-light)" strokeWidth="2" fill="var(--terra-light)" />
      </svg>
    ),
    title: 'Meet your matches',
    description: 'Friends, study buddies, or something more — you decide what you\'re looking for.',
  },
]

const FAQS = [
  {
    q: 'Wait, is this a dating app?',
    a: 'Nope — or at least, not only. You choose: platonic matches, romantic matches, or both. It\'s about finding your people, whatever that means for you.',
  },
  {
    q: 'Who can use this?',
    a: 'Any current Carleton student with an @cmail.carleton.ca email. If you\'ve got the email, you\'re in.',
  },
  {
    q: 'Okay but how does the matching actually work?',
    a: 'Our algorithm looks at your survey answers, what you\'re looking for, and a few secret ingredients to find your most compatible Ravens. The more honestly you answer, the better it works.',
  },
  {
    q: 'How many matches do I get?',
    a: 'A curated handful — quality over quantity. Think of it as your personalized shortlist of interesting people.',
  },
  {
    q: 'Is it free?',
    a: 'Totally free. We\'re students too — we get it.',
  },
  {
    q: 'Will anyone see my answers?',
    a: 'Nope. Your survey responses are only used for matching and never shared. What happens in the algorithm stays in the algorithm.',
  },
]

/* ── Decorative SVG doodles ── */
function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={`doodle ${className ?? ''}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" />
    </svg>
  )
}

function Squiggle({ className }: { className?: string }) {
  return (
    <svg className={`doodle ${className ?? ''}`} viewBox="0 0 120 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M2 10c10-12 20 12 30 0s20 12 30 0 20 12 30 0 20 12 28 0" />
    </svg>
  )
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={`doodle ${className ?? ''}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.5 6.5L20 10l-5 3.5L16 20l-4-3-4 3 1-6.5L4 10l6.5-1.5z" />
    </svg>
  )
}

function useStepParallax() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState<number[]>([0, 0, 0])

  useEffect(() => {
    function onScroll() {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const windowH = window.innerHeight
      const sectionTop = -rect.top
      const sectionHeight = rect.height - windowH

      const newProgress = STEPS.map((_, i) => {
        const stepStart = (i / STEPS.length) * sectionHeight
        const stepEnd = ((i + 1) / STEPS.length) * sectionHeight
        const stepRange = stepEnd - stepStart
        const raw = (sectionTop - stepStart) / stepRange
        return Math.max(0, Math.min(1, raw))
      })
      setProgress(newProgress)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return { containerRef, progress }
}

function App() {
  const [time, setTime] = useState(getTimeLeft)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signupCount, setSignupCount] = useState<number | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [taglineIdx, setTaglineIdx] = useState(0)
  const [taglineFading, setTaglineFading] = useState(false)
  const { containerRef, progress } = useStepParallax()

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setTaglineFading(true)
      setTimeout(() => {
        setTaglineIdx((prev) => (prev + 1) % TAGLINES.length)
        setTaglineFading(false)
      }, 400)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => {
        if (count !== null) setSignupCount(count)
      })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.endsWith('@cmail.carleton.ca')) {
      setError('Hmm, that doesn\'t look like a Carleton email. Try your @cmail.carleton.ca one!')
      return
    }
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    setSignupCount((prev) => (prev ?? 0) + 1)
    setSubmitted(true)
  }

  return (
    <div className="page">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-glow glow-1" aria-hidden="true" />
        <div className="hero-glow glow-2" aria-hidden="true" />
        <div className="hero-glow glow-3" aria-hidden="true" />

        <Sparkle className="sparkle-1" />
        <Sparkle className="sparkle-2" />
        <Star className="star-1" />
        <Star className="star-2" />

        <div className="hero-content">
          <h1 className="title">
            Carleton
            <span className="title-accent">
              Match
              <Squiggle className="title-squiggle" />
            </span>
          </h1>

          <p className={`tagline ${taglineFading ? 'fading' : ''}`}>
            {TAGLINES[taglineIdx]}
          </p>

          <p className="subtitle">
            A short, fun survey. A clever algorithm.<br />
            Real connections with fellow Ravens.
          </p>

          {/* Countdown */}
          <div className="countdown">
            {[
              { value: time.days, label: 'days' },
              { value: time.hours, label: 'hrs' },
              { value: time.minutes, label: 'min' },
              { value: time.seconds, label: 'sec' },
            ].map((unit, i) => (
              <div className="countdown-card" key={unit.label}>
                <span className="countdown-number" style={{ animationDelay: `${i * 0.1}s` }}>
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="countdown-label">{unit.label}</span>
              </div>
            ))}
          </div>

          {/* Signup counter */}
          {signupCount !== null && (
            <div className="signup-counter">
              <span className="signup-count">{signupCount}</span>
              <span className="signup-text">Ravens signed up so far</span>
            </div>
          )}

          {/* Email signup */}
          {!submitted ? (
            <div className="notify-section">
              <p className="notify-label">Drop your Carleton email — we'll ping you when it's go time.</p>
              <form className="notify-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="notify-input"
                  placeholder="you@cmail.carleton.ca"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  required
                />
                <button type="submit" className="notify-btn" disabled={loading}>
                  {loading ? 'Sending…' : 'Count me in'}
                </button>
              </form>
              {error && <p className="notify-error">{error}</p>}
            </div>
          ) : (
            <div className="notify-success">
              <span className="success-check">&#10003;</span>
              <p>You're in! We'll let you know the second it's live.</p>
            </div>
          )}
        </div>

        <div className="scroll-hint" aria-hidden="true">
          <span>How does it work?</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ── How it works (parallax) ── */}
      <section className="how-it-works" ref={containerRef}>
        <div className="how-sticky">
          <h2 className="section-title">
            Three steps. That's it.
            <Star className="section-star" />
          </h2>

          <div className="steps-parallax">
            {STEPS.map((step, i) => {
              const p = progress[i]
              // Card: slides up and fades in, then fades out
              const isActive = p > 0.05 && p < 0.95
              const entering = p < 0.5
              const cardY = entering ? (1 - p * 2) * 60 : 0
              const cardOpacity = entering ? Math.min(1, p * 3) : Math.max(0, 1 - (p - 0.8) * 5)
              // Icon floats at a different rate (parallax offset)
              const iconY = entering ? (1 - p * 2) * 30 : (p - 0.5) * -20

              return (
                <div
                  className={`step-panel${isActive ? ' active' : ''}`}
                  key={i}
                  style={{
                    transform: `translateY(${cardY}px)`,
                    opacity: cardOpacity,
                  }}
                >
                  <div
                    className="step-icon"
                    style={{ transform: `translateY(${iconY}px)` }}
                  >
                    {step.icon}
                  </div>
                  <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.description}</p>
                </div>
              )
            })}
          </div>

          {/* Progress dots */}
          <div className="steps-dots" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`steps-dot${progress[i] > 0.05 && progress[i] < 0.95 ? ' active' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section faq-section">
        <h2 className="section-title">
          Got questions? We've got answers.
        </h2>
        <div className="faq-list">
          {FAQS.map((item, i) => (
            <div className={`faq-item${openFaq === i ? ' open' : ''}`} key={i}>
              <button
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span>{item.q}</span>
                <span className="faq-toggle" aria-hidden="true" />
              </button>
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <Squiggle className="footer-squiggle" />
        <p className="footer-note">
          Made with late nights & instant noodles by Carleton students.
        </p>
      </footer>
    </div>
  )
}

export default App
