import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

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

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Session expired");
        return response.json();
      })
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        setShowAuth(false);
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
      });
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
      const payload = registerMode ? form : { email: form.email, password: form.password };
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

  if (user) {
    return <Dashboard user={user} onSignOut={signOut} />;
  }

  if (showAuth) {
    return (
      <main className="min-h-screen bg-[#0d0d0c] text-[#f2eee7] lg:grid lg:grid-cols-[minmax(320px,.92fr)_1.08fr]">
        <BrandPanel compact onBack={() => setShowAuth(false)} />
        <section className="flex min-h-[58vh] items-start justify-center bg-[#151514] px-7 py-14 sm:px-12 lg:min-h-screen lg:items-center lg:px-20 lg:py-8" aria-labelledby="form-title">
          <div className="w-full max-w-md" data-state={loading ? "loading" : "ready"}>
            <AuthForm
              content={content}
              registerMode={registerMode}
              form={form}
              message={message}
              loading={loading}
              showPassword={showPassword}
              onChange={updateField}
              onSubmit={submit}
              onTogglePassword={() => setShowPassword((current) => !current)}
              onSwitchMode={switchMode}
            />
          </div>
        </section>
      </main>
    );
  }

  return <Landing onSignIn={() => openAuth(false)} onRegister={() => openAuth(true)} />;
}

function ClockFace() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));

    return {
      hour: Number(map.hour || 0),
      minute: Number(map.minute || 0),
      second: Number(map.second || 0),
    };
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const parts = formatter.formatToParts(now);
      const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));

      setTime({
        hour: Number(map.hour || 0),
        minute: Number(map.minute || 0),
        second: Number(map.second || 0),
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const hourDegrees = ((time.hour % 12) + time.minute / 60 + time.second / 3600) * 30;
  const minuteDegrees = (time.minute + time.second / 60) * 6;
  const secondDegrees = time.second * 6;

  return (
    <div className="clock-shell" aria-label="Thailand time clock">
      <div className="clock-face">
        <div className="clock-center" />

        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((value) => {
          const angle = ((value - 3) * Math.PI) / 6;
          const radius = 32;
          const x = 50 + (Math.cos(angle) * radius);
          const y = 50 + (Math.sin(angle) * radius);

          return (
            <span
              key={value}
              className="clock-number"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {value}
            </span>
          );
        })}

        <div className="hand hour-hand" style={{ transform: `translateX(-50%) rotate(${hourDegrees}deg)` }} />
        <div className="hand minute-hand" style={{ transform: `translateX(-50%) rotate(${minuteDegrees}deg)` }} />
        <div className="hand second-hand" style={{ transform: `translateX(-50%) rotate(${secondDegrees}deg)` }} />
      </div>
      <div className="clock-bangkok">BKK</div>
    </div>
  );
}

function Landing({ onSignIn, onRegister }) {
  return (
    <main className="landing-shell min-h-screen overflow-hidden bg-[#0d0d0c] text-[#f2eee7]">
      <div className="landing-grid" />

      <header className="relative z-10 flex items-center justify-between px-7 py-7 sm:px-12 lg:px-20">
        <div className="brand-wordmark">LEXELLE</div>
        <button type="button" onClick={onSignIn} className="nav-button rounded-full border border-[#c5a878]/60 bg-[#13110f]/60 px-4 py-2 text-[0.62rem] tracking-[0.22em] text-[#c5a878] backdrop-blur-sm transition hover:border-[#d9bc8a] hover:text-[#f5e7d0]">
          Sign in
        </button>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl gap-12 px-7 py-8 sm:px-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-20 lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">LEXELLE LEGAL / EST. 2024</p>
          <h1 className="display-title mt-5 text-5xl font-semibold leading-none sm:text-7xl">
            Make your case.
            <span className="mt-3 block text-[#c5a878]">
              <em>Know the law.</em>
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-7 text-[#b3aba1] sm:text-base">
            A sharper way to understand your rights, organize legal matters, and move forward with confidence.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button type="button" onClick={onRegister} className="rounded-full bg-[#c5a878] px-6 py-3 text-sm font-medium text-[#1a1714] shadow-[0_18px_45px_rgba(197,168,120,0.35)] transition hover:-translate-y-0.5 hover:bg-[#d8bd8a]">
              Enter Lexelle
            </button>
            <button type="button" onClick={onSignIn} className="text-sm font-medium text-[#c5a878] underline decoration-[#c5a878]/50 underline-offset-8 transition hover:text-[#f1d7a1]">
              I already have access
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 text-[0.62rem] tracking-[0.18em] text-[#c8bfa8] uppercase">
            <span className="rounded-full border border-[#3d362d] bg-[#171614]/80 px-3 py-2">Private workspace</span>
            <span className="rounded-full border border-[#3d362d] bg-[#171614]/80 px-3 py-2">Case tracking</span>
            <span className="rounded-full border border-[#3d362d] bg-[#171614]/80 px-3 py-2">Legal insight</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,_rgba(197,168,120,0.18),_transparent_55%)] blur-3xl" />
          <div className="luxe-panel relative w-full max-w-xl rounded-[2rem] border border-[#36312d] bg-[#171614]/80 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-8">
            <div className="flex items-center justify-between">
              <div className="text-[0.62rem] tracking-[0.22em] text-[#b7a58d] uppercase">Legal intelligence</div>
              <span className="rounded-full border border-[#c5a878]/40 bg-[#1d1a17] px-2 py-1 text-[0.58rem] tracking-[0.18em] text-[#d7c29d]">LIVE</span>
            </div>

            <div className="mt-10 flex items-center justify-center">
              <ClockFace />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Open matters", value: "03" },
                { label: "Consultations", value: "07" },
                { label: "Case notes", value: "14" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#312d28] bg-[#201d1b] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <div className="text-[0.58rem] tracking-[0.16em] text-[#978d82] uppercase">{item.label}</div>
                  <div className="mt-3 text-2xl font-semibold text-[#f0e6d8]">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function BrandPanel({ compact, onBack }) {
  return (
    <section className="relative flex min-h-[42vh] flex-col justify-between overflow-hidden bg-[#1d1a17] px-7 py-7 text-[#f3eee6] sm:px-12 sm:py-10 lg:min-h-screen lg:px-16 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(197,168,120,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(197,168,120,0.1),_transparent_28%)]" />
      <div className="relative z-10 flex justify-between text-[.62rem] tracking-[.18em] text-[#b9aa96]">
        <span>LEX / 01</span>
        <span>EST. 2024</span>
      </div>

      {compact && (
        <button type="button" onClick={onBack} className="relative z-10 mt-10 self-start rounded-full border border-[#c5a878]/40 bg-[#1b1917]/50 px-3 py-2 text-[0.58rem] tracking-[.14em] text-[#c5a878] backdrop-blur-sm transition hover:border-[#d7b98e] hover:text-[#f4dfbb]">
          ← Back to overview
        </button>
      )}

      <div className="relative z-10 my-auto py-10">
        <p className="text-xs tracking-[0.22em] text-[#c8ad88]">LEXELLE LEGAL</p>
        <h1 className="display-title mt-3 max-w-md text-5xl font-semibold leading-[0.82] sm:text-6xl">
          Know your
          <span className="block text-[#c8ad88]">rights.</span>
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-7 text-[#c9c1b5]">
          A private legal workspace for understanding claims, tracking cases, and making confident decisions.
        </p>
      </div>

      <div className="relative z-10 flex justify-between items-center text-[.62rem] tracking-[.18em] text-[#b9aa96]">
        <span>CLARITY. CONTROL. JUSTICE.</span>
        <span className="rounded-full border border-[#c5a878]/40 bg-[#1b1917]/50 px-2 py-1 text-base text-[#cbb18e]">✦</span>
      </div>
    </section>
  );
}

function AuthForm({ content, registerMode, form, message, loading, showPassword, onChange, onSubmit, onTogglePassword, onSwitchMode }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-[0.18em] text-[#b2aaa0]">PRIVATE ACCESS</p>
        <span className="text-xs tracking-[0.15em] text-[#b2aaa0]">{content.marker}</span>
      </div>

      <h2 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{content.title}</h2>
      <p className="mt-3 text-sm text-[#817b72]">{content.subtitle}</p>

      <div className={`min-h-7 pt-5 text-xs ${message ? "text-[#a45c4e]" : "text-transparent"}`} role="alert" aria-live="polite">
        {message || "No message"}
      </div>

      <form className="mt-3 grid gap-5" onSubmit={onSubmit}>
        {registerMode && (
          <Field label="Full name">
            <input className="field" name="name" value={form.name} onChange={onChange} maxLength="80" autoComplete="name" required />
          </Field>
        )}

        <Field label="Email address">
          <input className="field" name="email" value={form.email} onChange={onChange} type="email" placeholder="you@example.com" autoComplete="email" required />
        </Field>

        <Field label="Password">
          <span className="relative block">
            <input
              className="field pr-12"
              name="password"
              value={form.password}
              onChange={onChange}
              type={showPassword ? "text" : "password"}
              minLength="8"
              autoComplete={registerMode ? "new-password" : "current-password"}
              required
            />
            <button
              type="button"
              className="absolute bottom-3 right-0 text-[.64rem] text-[#aa8960]"
              onClick={onTogglePassword}
              aria-label={`${showPassword ? "Hide" : "Show"} password`}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </Field>

        <button type="submit" disabled={loading} className="mt-2 rounded-full bg-[#c5a878] px-6 py-3 text-sm font-medium text-[#1a1714] disabled:opacity-60">
          {loading ? "Checking access" : content.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-[#817b72]">
        {content.switchCopy}{" "}
        <button type="button" className="font-semibold text-[#c5a878] underline underline-offset-4" onClick={onSwitchMode}>
          {content.switchAction}
        </button>
      </p>
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm text-[#ddd2c2]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Dashboard({ user, onSignOut }) {
  const stats = [
    { label: "Open matters", value: "03" },
    { label: "Consultations", value: "07" },
    { label: "Legal notes", value: "14" },
  ];

  return (
    <main className="min-h-screen bg-[#0d0d0c] text-[#f2eee7]">
      <header className="border-b border-[#2f2d2a] px-7 py-6 sm:px-12 lg:px-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-[#c5a878]">LEXELLE LEGAL</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {user.name}</h1>
          </div>
          <button type="button" onClick={onSignOut} className="rounded-full border border-[#c5a878] px-4 py-2 text-xs text-[#c5a878]">
            Sign out
          </button>
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
                <p className="text-xs tracking-[0.18em] text-[#c5a878]">CASE OVERVIEW</p>
                <h2 className="mt-2 text-2xl font-semibold">Your legal workspace</h2>
              </div>
              <button type="button" className="rounded-full bg-[#c5a878] px-4 py-2 text-sm font-medium text-[#1a1714]">
                New consultation
              </button>
            </div>

            <div className="mt-8 space-y-4">
              {[
                "Review legal cases",
                "Track consultation status",
                "Prepare case summary",
              ].map((item, index) => (
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
            <p className="text-xs tracking-[0.18em] text-[#c5a878]">PROFILE</p>
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
