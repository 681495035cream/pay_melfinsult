import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const copy = {
  signIn: {
    title: "Sign in",
    subtitle: "Return to your legal workspace.",
    submit: "Sign in",
    switchCopy: "New to Lexelle?",
    switchAction: "Create an account",
    marker: "01",
  },
  register: {
    title: "Create account",
    subtitle: "Create your private legal workspace.",
    submit: "Create account",
    switchCopy: "Already have an account?",
    switchAction: "Sign in",
    marker: "02",
  },
};

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const content = registerMode ? copy.register : copy.signIn;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        if (!response.ok) throw new Error("Session expired");
        return response.json();
      })
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        setShowAuth(falsse);
      })
      .catch(() => localStorage.removeItem("accessToken"));
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function switchMode() {
    setRegisterMode((current) => !current);
    setMessage("");
    setShowPassword(false);
  }

  function openAuth(register = false) {
    setRegisterMode(register);
    setShowAuth(true);
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const payload = registerMode
        ? form
        : { email: form.email, password: form.password };
      const response = await fetch(`${API_BASE}/auth/${registerMode ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to sign in");
      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
      setShowAuth(false);
      setShowAuth(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    localStorage.removeItem("accessToken");
    setUser(null);
    setForm({ name: "", email: "", password: "" });
    setMessage("");
  }

  reuser ? (
      <Dashboard user={user} onSignOut={signOut} />
    ) : showAuth ? (
      <main className="min-h-screen bg-[#0d0d0c] text-[#f2eee7] lg:grid lg:grid-cols-[minmax(320px,.92fr)_1.08fr]">
        <BrandPanel compact onBack={() => setShowAuth(false)} />
        <section className="flex min-h-[58vh] items-start justify-center bg-[#151514] px-7 py-14 sm:px-12 lg:min-h-screen lg:items-center lg:px-20 lg:py-8" aria-labelledby="form-title">
          <div className="w-full max-w-md" data-state={loading ? "loading" : "ready"}>
            <AuthForm content={content} registerMode={registerMode} form={form} message={message} loading={loading} showPassword={showPassword} onChange={updateField} onSubmit={submit} onTogglePassword={() => setShowPassword((current) => !current)} onSwitchMode={switchMode} />
        <section className="flex min-h-[58vh] items-start justify-center bg-[#151514] px-7 py-14 sm:px-12 lg:min-h-screen lg:items-center lg:px-20 lg:py-8" aria-labelledby="form-title">
          <div className="w-full max-w-md" data-state={loading ? "loading" : "ready"}>
            <AuthForm content={content} registerMode={registerMode} form={form} message={message} loading={loading} showPassword={showPassword} onChange={updateField} onSubmit={submit} onTogglePassword={() => setShowPassword((current) => !current)} onSwitchMode={switchMode} />
          </div>
        </section>
      </main>
    ) : <Landing onSignIn={() => openAuth(false)} onRegister={() => openAuth(true)} />
  );
}

function Landing({ onSignIn, onRegister }) {
  return (
    <main className="landing-shell min-h-screen overflow-hidden bg-[#0d0d0c] text-[#f2eee7]">
      <header className="relative z-10 flex items-center justify-between px-7 py-7 sm:px-12 lg:px-20">
        <button className="brand-wordmark" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>LEXELLE<span>®</span></button>
        <div className="flex items-center gap-6 text-[.62rem] tracking-[.18em] text-[#9d968b]"><span className="hidden sm:inline">LEGAL INTELLIGENCE / 01</span><button className="nav-button" type="button" onClick={onSignIn}>Sign in</button></div>
      </header>
      <section className="relative mx-auto grid min-h-[calc(100vh-96px)] max-w-360 items-center gap-12 px-7 pb-16 pt-10 sm:px-12 lg:grid-cols-[1.1fr_.9fr] lg:px-20 lg:pb-24 lg:pt-0">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow text-[#c5a878]">LEXELLE LEGAL / EST. 2024</p>
          <h1 className="display-title mt-5 text-[clamp(4.8rem,11vw,10.5rem)] leading-[.77] tracking-[-.04em]">Make your case.<br /><em>Know the law.</em></h1>
          <p className="mt-10 max-w-md text-sm leading-[1.9] text-[#aaa39a]">A sharper way to understand your rights, organize legal matters, and move forward with confidence.</p>
          <div className="mt-10 flex flex-wrap items-center gap-5"><button className="primary-button w-auto px-8" type="button" onClick={onRegister}>Enter Lexelle <span className="ml-5">↗</span></button><button className="text-xs tracking-[.12em] text-[#c5a878] underline underline-offset-8" type="button" onClick={onSignIn}>I already have access</button></div>
        </div>
        <div className="relative flex min-h-88 items-center justify-center lg:min-h-136">
          <div className="legal-seal" aria-hidden="true"><span>LEXELLE</span><strong>§</strong><span>LAW / ORDER / CLARITY</span></div>
          <div className="absolute bottom-3 right-0 max-w-52 border-l border-[#725b3e] pl-4 text-xs leading-6 text-[#8e887f] lg:right-10">“You can insult people, but do it legally”</div>
        </div>
      </section>
      <div className="landing-grid" aria-hidden="true" />
    </main>
  );
}

function BrandPanel({ compact, onBack }) {
  return (
    <section className="flex min-h-[42vh] flex-col justify-between bg-[linear-gradient(145deg,rgba(20,20,19,.75),rgba(47,43,37,.88)),repeating-linear-gradient(115deg,transparent_0_32px,rgba(215,188,150,.08)_33px_34px),#282621] px-7 py-7 text-[#f3eee6] sm:px-12 sm:py-10 lg:min-h-screen lg:px-[clamp(2rem,5vw,5.5rem)] lg:py-[clamp(2rem,5vw,5.5rem)]" aria-label="Lexelle legal platform">
    <div className="flex justify-between text-[.62rem] tracking-[.18em] text-[#b9aa96]"><span>LEX / 01</span><span>EST. 2024</span></div>
    {compact && <button className="mt-10 self-start text-xs tracking-[.12em] text-[#c5a878]" type="button" onClick={onBack}>← Back to overview</button>}
    <div className="my-auto py-14 lg:py-20">
      <p className="eyebrow text-[#c8ad88]">LEXELLE LEGAL</p>
      <h1 className="display-title mt-3 max-w-100 text-[clamp(4rem,8vw,7.6rem)] leading-[.82] tracking-[-.03em]">Know your<br /><em>rights.</em></h1>
      <p className="mt-8 max-w-sm text-sm leading-[1.9] text-[#c9c1b5]">A private legal workspace for understanding claims, tracking cases, and making confident decisions.</p>
      <blockquote className="mt-9 max-w-sm border-l border-[#aa8960] pl-4 text-xl leading-tight text-[#d5c5ae]">“You can insult people, but do it legally”</blockquote>
    </div>
    <div className="flex justify-between text-[.62rem] tracking-[.18em] text-[#b9aa96]"><span>CLARITY. CONTROL. JUSTICE.</span><span className="text-base text-[#cbb18e]">✦</span></div>
  </section>
  );
}

function AuthForm({ content, registerMode, form, message, loading, showPassword, onChange, onSubmit, onTogglePassword, onSwitchMode }) {
  return (
    <>
      <div className="flex items-center justify-between"><p className="eyebrow">PRIVATE ACCESS</p><span className="text-xs tracking-[.15em] text-[#b2aaa0]">{content.marker}</span></div>
      <h2 id="form-title" className="display-title mt-2 text-5xl leading-[.95] sm:text-6xl">{content.title}</h2>
      <p className="mt-3 text-sm text-[#817b72]">{content.subtitle}</p>
      <div className={`min-h-7 pt-5 text-xs ${message ? "text-[#a45c4e]" : "text-transparent"}`} role="alert" aria-live="polite">{message || "No message"}</div>
      <form className="mt-3 grid gap-5" onSubmit={onSubmit}>
        {registerMode && <Field label="Full name"><input className="field" name="name" value={form.name} onChange={onChange} maxLength="80" autoComplete="name" required /></Field>}
        <Field label="Email address"><input className="field" name="email" value={form.email} onChange={onChange} type="email" placeholder="you@example.com" autoComplete="email" required /></Field>
        <Field label="Password"><span className="relative block"><input className="field pr-12" name="password" value={form.password} onChange={onChange} type={showPassword ? "text" : "password"} minLength="8" autoComplete={registerMode ? "new-password" : "current-password"} required /><button className="absolute bottom-3 right-0 text-[.64rem] text-[#aa8960]" type="button" onClick={onTogglePassword} aria-label={`${showPassword ? "Hide" : "Show"} password`}>{showPassword ? "Hide" : "Show"}</button></span></Field>
        <button className="primary-button mt-2" type="submit" disabled={loading}>{loading ? "Checking access" : content.submit}</button>
      </form>
      <p className="mt-6 text-center text-xs text-[#817b72]">{content.switchCopy}{" "}<button className="font-semibold text-[#c5a878] underline underline-offset-4" type="button" onClick={onSwitchMode}>{content.switchAction}</button></p>
    </>
  );
}

function Field({ label, children }) {
  return Dashboard({ user, onSignOut }) {
  const stats = [
    { label: "Open matters", value: "03" },
    { label: "Consultations", value: "07" },
    { label: "Legal notes", value: "14" },
  ];

  const quickActions = [
    "Review legal cases",
    "Track consultation status",
    "Prepare case summary",
  ];

  return (
    <main className="min-h-screen bg-[#0d0d0c] text-[#f2eee7]">
      <header className="border-b border-[#2f2d2a] px-7 py-6 sm:px-12 lg:px-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-[#c5a878]">LEXELLE LEGAL</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {user.name}</h1>
          </div>
          <button className="secondary-button" type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-7 py-10 sm:px-12 lg:px-20">
        <div className="grid gap-5 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[#2e2a26] bg-[#171614] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
              <p className="text-xs tracking-[.18em] text-[#91897f]">{stat.label}</p>
              <p className="mt-6 text-3xl font-semibold text-[#f0e6d8]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[#2e2a26] bg-[#171614] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">CASE OVERVIEW</p>
                <h2 className="mt-2 text-2xl font-semibold">Your legal workspace</h2>
              </div>
              <button className="primary-button" type="button">New consultation</button>
            </div>

            <div className="mt-8 space-y-4">
              {quickActions.map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-xl border border-[#352f2b] bg-[#201d1a] p-4">
                  <div>
                    <p className="text-sm font-medium text-[#f4eadb]">{item}</p>
                    <p className="mt-1 text-xs text-[#8f867a]">Status: Ready</p>
                  </div>
                  <span className="text-xs tracking-[.18em] text-[#c5a878]">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-[#2e2a26] bg-[#171614] p-6">
            <p className="eyebrow">PROFILE</p>
            <h3 className="mt-3 text-xl font-semibold">{user.name}</h3>
            <p className="mt-2 text-sm text-[#a59e95]">{user.email}</p>

            <div className="mt-8 rounded-xl border border-[#3b362f] bg-[#1d1a17] p-4">
              <p className="text-xs tracking-[.18em] text-[#928a80]">LAST LOGIN</p>
              <p className="mt-3 text-sm text-[#eadcc4]">Today, 09:42 AM</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )

function Dashboard({ user, onSignOut }) {
  const stats = [
    { label: "Open matters", value: "03" },
    { label: "Consultations", value: "07" },
    { label: "Legal notes", value: "14" },
  ];

  const quickActions = [
    "Review legal cases",
    "Track consultation status",
    "Prepare case summary",
  ];

  return (
    <main className="min-h-screen bg-[#0d0d0c] text-[#f2eee7]">
      <header className="border-b border-[#2f2d2a] px-7 py-6 sm:px-12 lg:px-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-[#c5a878]">LEXELLE LEGAL</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {user.name}</h1>
          </div>
          <button className="secondary-button" type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-7 py-10 sm:px-12 lg:px-20">
        <div className="grid gap-5 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[#2e2a26] bg-[#171614] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
              <p className="text-xs tracking-[.18em] text-[#91897f]">{stat.label}</p>
              <p className="mt-6 text-3xl font-semibold text-[#f0e6d8]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[#2e2a26] bg-[#171614] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">CASE OVERVIEW</p>
                <h2 className="mt-2 text-2xl font-semibold">Your legal workspace</h2>
              </div>
              <button className="primary-button" type="button">New consultation</button>
            </div>

            <div className="mt-8 space-y-4">
              {quickActions.map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-xl border border-[#352f2b] bg-[#201d1a] p-4">
                  <div>
                    <p className="text-sm font-medium text-[#f4eadb]">{item}</p>
                    <p className="mt-1 text-xs text-[#8f867a]">Status: Ready</p>
                  </div>
                  <span className="text-xs tracking-[.18em] text-[#c5a878]">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-[#2e2a26] bg-[#171614] p-6">
            <p className="eyebrow">PROFILE</p>
            <h3 className="mt-3 text-xl font-semibold">{user.name}</h3>
            <p className="mt-2 text-sm text-[#a59e95]">{user.email}</p>

            <div className="mt-8 rounded-xl border border-[#3b362f] bg-[#1d1a17] p-4">
              <p className="text-xs tracking-[.18em] text-[#928a80]">LAST LOGIN</p>
              <p className="mt-3 text-sm text-[#eadcc4]">Today, 09:42 AM</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default App;
