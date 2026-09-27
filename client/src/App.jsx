import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(response.ok ? "Unexpected server response." : `Request failed (${response.status})`);
  }
}

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

const normalizeSearchText = (value = "") =>
  value
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[.,/\\'"()[\]{}!?@#$%^&*+=_:;<>~`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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
      .then(async (response) => {
        if (!response.ok) {
          const payload = await readJsonResponse(response);
          throw new Error(payload?.message || "Session expired");
        }

        const payload = await readJsonResponse(response);
        const currentUser = payload?.user;
        if (!currentUser) throw new Error("Session user not found");

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
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data?.message || "Unable to sign in");
      if (!data?.accessToken || !data?.user) throw new Error("Login response was incomplete.");

      localStorage.setItem("accessToken", data.accessToken);
      setUser(data.user);
      setShowAuth(false);
    } catch (error) {
      setMessage(error.message || "Unable to complete sign in");
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

            <div className="mt-8 rounded-[1.5rem] border border-[#312d28] bg-[#201d1b] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <div className="quote-label">Legal principle</div>
              <blockquote className="quote-english mt-4">
                “Laws and institutions are constantly tending to gravitate. Like clocks, they must be cleansed, and wound up, and set to true time.”
              </blockquote>
              <p className="quote-attribution mt-3">— Henry Ward Beecher</p>
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
  const [activeView, setActiveView] = useState("dashboard");
  const displayName = user?.name || "Client";
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CL";

  const stats = [
    { label: "CONSULT", value: "Consult a Lawyer" },
    { label: "LAW CODES", value: "Legal Codes\n& Statutes" },
    { label: "ARTICLES", value: "Articles" },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedLaw, setSelectedLaw] = useState(null);
  const normalizedQuery = normalizeSearchText(searchQuery);

  const searchResults = !normalizedQuery
    ? []
    : websiteSearchCatalog
        .filter((entry) => {
          const searchable = normalizeSearchText(entry.searchableText);
          const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

          return queryTerms.every((term) => searchable.includes(term));
        })
        .slice(0, 8);

  if (selectedLaw) {
    return <LegalCodeDetailPage law={selectedLaw} onBack={() => setSelectedLaw(null)} />;
  }

  if (selectedArticle) {
    return <ArticleDetailPage article={selectedArticle} onBack={() => setSelectedArticle(null)} />;
  }

  if (activeView === "consultation") {
    return <ConsultationPage onBack={() => setActiveView("dashboard")} user={user} />;
  }

  if (activeView === "legal-codes") {
    return <LegalCodesPage onBack={() => setActiveView("dashboard")} />;
  }

  if (activeView === "articles") {
    return <ArticlesPage onBack={() => setActiveView("dashboard")} />;
  }

  const matters = [
    { title: "Contract review", status: "Pending review", time: "Today, 10:30" },
    { title: "Property dispute", status: "Awaiting evidence", time: "Tomorrow, 09:00" },
    { title: "Employment advice", status: "Ready for consultation", time: "Thu, 14:00" },
  ];

  return (
    <main className="min-h-screen bg-[#0d0d0c] text-[#f2eee7]">
      <header className="border-b border-[#2f2d2a] bg-[linear-gradient(180deg,rgba(27,24,21,0.96),rgba(10,10,9,0.96))] px-7 py-6 sm:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-[#c5a878]">LEXELLE LEGAL</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome back, {displayName}</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-full border border-[#3d362f] bg-[#171614] px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#d4b677] bg-[#201d1a] text-xs font-bold text-[#f6e7c6]">
                  {initials}
                </div>
                <div className="text-left">
                  <p className="text-[0.52rem] tracking-[0.18em] text-[#8a817b]">SIGNED IN</p>
                  <p className="text-sm font-medium text-[#f0e6d8]">{displayName}</p>
                </div>
              </div>

              <button type="button" onClick={onSignOut} className="rounded-full border border-[#c5a878] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#c5a878] transition hover:bg-[#c5a878] hover:text-[#1a1714]">
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-7 rounded-[1.4rem] border border-[#3b362f] bg-[#141311]/90 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.26)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[#3b362f] bg-[#201d1a] px-4 py-3 text-sm text-[#d9d0c3]">
                <span className="text-lg text-[#d2b77d]">⌕</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search lawyers, legal codes, cases, or clauses"
                  className="w-full border-0 bg-transparent text-sm text-[#f3ead9] placeholder:text-[#8f887e] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select className="rounded-xl border border-[#3b362f] bg-[#201d1a] px-3 py-3 text-xs uppercase tracking-[0.16em] text-[#d7c29d] outline-none">
                  <option>All categories</option>
                  <option>Lawyers</option>
                  <option>Legal codes</option>
                  <option>Cases</option>
                  <option>Clauses</option>
                </select>

                <button type="button" className="rounded-xl bg-[#c5a878] px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#171412] shadow-[0_12px_30px_rgba(197,168,120,0.22)]">
                  Search
                </button>
              </div>
            </div>

            {normalizedQuery ? (
              <div className="mt-4 rounded-2xl border border-[#3b362f] bg-[#171614] p-4">
                <p className="mb-3 text-[0.62rem] uppercase tracking-[0.18em] text-[#c5a878]">Search results</p>

                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.title}-${index}`}
                        type="button"
                        onClick={() => {
                          if (result.article) {
                            setSelectedArticle(result.article);
                            return;
                          }
                          if (result.law) {
                            setSelectedLaw(result.law);
                            return;
                          }
                          if (result.title === "กฎหมายปกครอง") {
                            setSelectedLaw(categories[0].items[0]);
                          }
                        }}
                        className="w-full rounded-xl border border-[#312d29] bg-[#1d1a17] p-3 text-left transition hover:border-[#d2b77d]/70 hover:bg-[#201d1a]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[0.56rem] uppercase tracking-[0.15em] text-[#c0a16d]">{result.type}</p>
                          <span className="text-[0.56rem] uppercase tracking-[0.15em] text-[#8b8177]">Match</span>
                        </div>
                        <h4 className="mt-2 text-base font-semibold text-[#f3ead9]">{result.title}</h4>
                        <p className="mt-1 text-sm leading-6 text-[#c9bfa8]">{result.detail}</p>
                        {(result.article || result.law) && (
                          <span className="mt-3 inline-block text-[0.62rem] uppercase tracking-[0.16em] text-[#d6b778]">
                            {result.article ? "Read article" : "Read legal code"} →
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#4f453f] bg-[#171614] p-4 text-sm text-[#d8c7aa]">
                    ค้นหาไม่เจอ
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2 text-[0.58rem] uppercase tracking-[0.16em] text-[#9d9389]">
                <span className="rounded-full border border-[#3d362f] bg-[#181614] px-2.5 py-1.5">Attorney</span>
                <span className="rounded-full border border-[#3d362f] bg-[#181614] px-2.5 py-1.5">Civil code</span>
                <span className="rounded-full border border-[#3d362f] bg-[#181614] px-2.5 py-1.5">Criminal law</span>
                <span className="rounded-full border border-[#3d362f] bg-[#181614] px-2.5 py-1.5">Contract review</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-7 py-10 sm:px-12 lg:px-20">
        <div className="grid gap-5 md:grid-cols-3">
          {stats.map((stat, index) => (
            <button
              key={stat.label}
              type="button"
              onClick={() => {
                if (index === 0) setActiveView("consultation");
                if (index === 1) setActiveView("legal-codes");
                if (index === 2) setActiveView("articles");
              }}
              className={`relative rounded-2xl border border-[#2e2a26] bg-[#171614] p-6 text-left shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition hover:border-[#c5a878]/60 hover:bg-[#1a1816] ${
                index === 0 || index === 1 ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <p className="text-xs tracking-[.18em] text-[#91897f]">{stat.label}</p>
              <p
                className="mt-5 whitespace-pre-line font-[Cormorant_Garamond,serif] text-[2.3rem] leading-[0.92] tracking-[-0.04em] text-[#f0e6d8] md:text-[2.8rem]"
                style={{ whiteSpace: "pre-line" }}
              >
                {stat.value}
              </p>
              <span className="absolute bottom-4 right-4 text-lg leading-none text-[#d2b77d] opacity-80">→</span>
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <CaseOverviewAd />

          <aside className="rounded-2xl border border-[#2e2a26] bg-[#171614] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.2)]">
            <p className="text-xs tracking-[0.18em] text-[#c5a878]">PROFILE</p>
            <h3 className="mt-3 text-xl font-semibold">{displayName}</h3>
            <p className="mt-2 text-sm text-[#a59e95]">{user.email}</p>

            <div className="mt-8 rounded-xl border border-[#3b362f] bg-[#1d1a17] p-4">
              <p className="text-xs tracking-[.18em] text-[#928a80]">LAST LOGIN</p>
              <p className="mt-3 text-sm text-[#eadcc4]">Today, 09:42 AM</p>
            </div>

            <div className="mt-6 rounded-xl border border-[#3b362f] bg-[#1d1a17] p-4">
              <p className="text-xs tracking-[.18em] text-[#928a80]">LEGAL FOCUS</p>
              <p className="mt-3 text-sm text-[#eadcc4]">Contracts • Employment • Disputes</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-7 pb-16 sm:px-12 lg:px-20">
        <div className="rounded-[2rem] border border-[#2f2d2a] bg-[linear-gradient(180deg,rgba(20,18,16,0.96),rgba(11,10,9,0.96))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-10 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex-1">
              <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-[#f6e7c6] sm:text-4xl lg:text-[3rem]">
                How it works <span className="text-[#c5a878]">Legal consultation 24/7</span>
              </h2>

              <div className="space-y-8">
                <div className="rounded-3xl border border-[#352f2b] bg-[#171614] p-6 shadow-[inset_0_0_0_1px_rgba(197,168,120,0.05)]">
                  <h3 className="mb-4 text-[2rem] font-bold leading-tight text-[#f2eee7]">
                    1. Start your request
                  </h3>
                  <p className="mb-3 text-xl text-[#e9dfcf]">Describe your legal issue quickly.</p>
                  <ul className="space-y-2 text-lg text-[#daccb5]">
                    <li>• Submit your case details</li>
                    <li>• Mention the relevant law or concern</li>
                    <li>• Receive a quick review request</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-[#352f2b] bg-[#151312] p-5">
                  <h3 className="mb-3 text-[2rem] font-bold leading-tight text-[#f2eee7]">
                    2. Choose the right legal support
                  </h3>
                  <p className="text-xl text-[#e9dfcf]">Browse available legal guidance based on your situation.</p>
                </div>

                <div className="rounded-3xl border border-[#352f2b] bg-[#151312] p-5">
                  <h3 className="mb-3 text-[2rem] font-bold leading-tight text-[#f2eee7]">
                    3. Get connected and proceed
                  </h3>
                  <p className="text-xl text-[#e9dfcf]">Continue the conversation and receive legal assistance in minutes.</p>
                </div>
              </div>
            </div>

            <div className="relative flex flex-1 justify-center">
              <div className="absolute inset-y-10 left-1/2 hidden w-[60%] -translate-x-1/2 rounded-full bg-[#c5a878]/15 blur-3xl xl:block" />

              <div className="relative w-full max-w-[430px] rounded-[2.5rem] border border-[#3b362f] bg-[linear-gradient(180deg,#171614_0%,#0d0d0c_100%)] p-4 shadow-[0_35px_60px_rgba(0,0,0,0.45)]">
                <div className="relative overflow-hidden rounded-[2rem] border border-[#3b362f] bg-[linear-gradient(180deg,#201d1a_0%,#151312_100%)] px-4 pb-4 pt-6">
                  <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(#c5a878 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

                  <div className="relative flex justify-between">
                    <div className="h-16 w-16 rounded-full bg-[#d8d2c9]" />
                    <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#c5a878] text-lg font-bold text-[#171412]">1</div>
                  </div>

                  <div className="relative mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#3b362f] bg-[#1c1917]/90 px-4 py-3 text-[#f2eee7] shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#d8c29b]" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-[#c5a878]">Legal support</p>
                        <p className="text-sm font-semibold text-[#f2eee7]">Need instant guidance?</p>
                      </div>
                    </div>
                    <div className="rounded-full bg-[#c5a878] px-2 py-1 text-[0.65rem] font-semibold text-[#171412]">Live</div>
                  </div>

                  <div className="relative mt-5 space-y-4">
                    <div className="ml-auto mr-3 w-[70%] rounded-2xl border border-[#3b362f] bg-[#201d1a] px-4 py-3 text-sm font-medium text-[#f6e7c6] shadow-md">
                      Lawyer consultation
                    </div>

                    <div className="w-[78%] rounded-2xl border border-[#3b362f] bg-[#171614] px-4 py-3 text-sm font-medium text-[#f6e7c6] shadow-md">
                      Legal codes & statutes
                    </div>

                    <div className="ml-auto mr-3 w-[60%] rounded-2xl border border-[#3b362f] bg-[#1d1a17] px-4 py-3 text-sm font-medium text-[#f6e7c6] shadow-md">
                      Articles & basics
                    </div>
                  </div>

                  <div className="relative mt-6 flex items-center justify-between rounded-2xl border border-[#3b362f] bg-[#171614] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.2)]">
                    <div>
                      <p className="text-sm font-semibold text-[#f6e7c6]">Get legal help now</p>
                      <p className="text-xs text-[#bfa988]">24/7 support</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a878] text-lg font-bold text-[#171412]">→</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const categories = [
    { title: "Administrative Law", icon: "📄", items: [
      { name: "กฎหมายปกครอง", code: "กฎหมายปกครอง", summary: "กฎหมายพื้นฐานเกี่ยวกับการใช้อำนาจรัฐ การบริหารราชการ และการคุ้มครองความเป็นธรรม", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติจัดตั้งศาลปกครองและวิธีพิจารณาคดีปกครอง", code: "พ.ศ. 2539", summary: "การจัดตั้งศาลปกครองและขั้นตอนพิจารณาคดีปกครอง", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติการอำนวยความสะดวกในการพิจารณาอนุญาตทางราชการ", code: "พ.ศ. 2558", summary: "การอำนวยความสะดวกและลดขั้นตอนในกระบวนการอนุญาตราชการ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติความรับผิดทางปกครอง", code: "พ.ศ. 2539", summary: "ความรับผิดชอบของหน่วยงานภาครัฐและเจ้าหน้าที่ที่กระทำผิด", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติข้อมูลข่าวสารของราชการ", code: "พ.ศ. 2540", summary: "หลักเกณฑ์การเปิดเผยข้อมูลข่าวสารของราชการและการเข้าถึงข้อมูล", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติข้อมูลสาธารณะ", code: "พ.ศ. 2540", summary: "การกำกับดูแลและการเข้าถึงข้อมูลสาธารณะของภาครัฐ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติองค์กรปกครองส่วนท้องถิ่น", code: "พ.ศ. 2542", summary: "อำนาจหน้าที่และการบริหารงานขององค์กรปกครองส่วนท้องถิ่น", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Criminal Law", icon: "⚖️", items: [
      { name: "พระราชบัญญัติให้ใช้ประมวลกฎหมายอาญา", code: "พ.ศ. 2499", summary: "การใช้ประมวลกฎหมายอาญาเป็นกฎหมายหลักในการกำหนดความผิดและโทษ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "ภาค 1 บทบัญญัติทั่วไป", code: "(มาตรา 1 - 106)", summary: "หลักการทั่วไป ความหมายของคำศัพท์ และหลักกฎหมายอาญาเบื้องต้น", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "ภาค 2 ความผิด", code: "(มาตรา 107 - 366/4)", summary: "ลักษณะของความผิดและเงื่อนไขความรับผิดทางอาญา", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "ภาค 3 ลหุโทษ", code: "(มาตรา 367 - 398)", summary: "ประเภทของโทษและมาตรการที่กระทำกับผู้กระทำความผิด", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "เหตุผลในการประกาศใช้", code: "", summary: "การกำหนดวันเริ่มใช้และเหตุผลในการบังคับใช้กฎหมายอาญา", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Civil & Commercial Law", icon: "📝", items: [
      { name: "ข้อความเบื้องต้น (มาตรา 1 - 3)", code: "", summary: "หลักเกณฑ์เบื้องต้นเกี่ยวกับกฎหมายแพ่งและพาณิชย์", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "บรรพ 1 หลักทั่วไป (มาตรา 4 - 193/35)", code: "", summary: "หลักการทั่วไปและการใช้อำนาจของกฎหมายแพ่งและพาณิชย์", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "บรรพ 2 ผู้นี้ (มาตรา 194 - 452)", code: "", summary: "สิทธิและหน้าที่ของบุคคลตามกฎหมายแพ่งและพาณิชย์", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "บรรพ 3 เอกเทศัญญา (มาตรา 453 - 1297)", code: "", summary: "กฎหมายเกี่ยวกับสัญญาและความรับผิดทางสัญญา", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "บรรพ 4 ทรัพย์สิน (มาตรา 1298 - 1434)", code: "", summary: "สิทธิในทรัพย์สินและลักษณะของทรัพย์สินตามกฎหมาย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "บรรพ 5 คูณครี (มาตรา 1435 - 1598/41)", code: "", summary: "เรื่องเกี่ยวกับความรับผิดและสัญญาอันเกิดจากการไม่ชำระหนี้", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "บรรพ 6 มรดก (มาตรา 1599 - 1755)", code: "", summary: "กฎหมายแห่งมรดกและการรับมรดกตามกฎหมาย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "เหตุผลในการประกาศใช้", code: "", summary: "เหตุผลและวันเริ่มใช้ของกฎหมายแพ่งและพาณิชย์", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติให้ใช้ประมวลกฎหมายแพ่งและพาณิชย์", code: "", summary: "การกำหนดให้ใช้ประมวลกฎหมายแพ่งและพาณิชย์ตามกฎหมาย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Labor Law", icon: "🧑‍💼", items: [
      { name: "พระราชบัญญัติค่าธรรมเนียมทางราชการ พ.ศ. 2541", code: "", summary: "กฎหมายเกี่ยวกับค่าธรรมเนียมและการจัดเก็บทางราชการ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติประกันสังคม พ.ศ. 2533", code: "", summary: "หลักเกณฑ์และเงื่อนไขการประกันสังคม", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติเงินกู้ดอกเบี้ยต่ำ พ.ศ. 2537", code: "", summary: "กฎหมายเรื่องสินเชื่อและสิทธิประโยชน์ทางการเงิน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติแรงงานสัมพันธ์ พ.ศ. 2518", code: "", summary: "กฎหมายที่เกี่ยวข้องกับแรงงานและสวัสดิการแรงงาน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชกำหนดการบริหารจัดการภาครัฐภายใต้กฎหมายว่าด้วยการค้ำประกันจากราชการ พ.ศ. 2560", code: "", summary: "การกำกับดูแลและบริหารจัดการภาระผูกพันของรัฐ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติแรงงานรัฐวิสาหกิจสัมพันธ์ พ.ศ. 2542", code: "", summary: "กฎหมายที่เกี่ยวข้องกับรัฐวิสาหกิจและการบริหารแรงงาน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติจัดตั้งศาลแรงงานและวิธีพิจารณาคดีแรงงาน พ.ศ. 2522", code: "", summary: "กระบวนการพิจารณาคดีแรงงานและการจัดตั้งศาลแรงงาน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "ข้อกำหนดศาลแรงงาน ว่าด้วยการดำเนินกระบวนพิจารณาในศาลแรงงาน พ.ศ. 2556", code: "", summary: "แนวทางและวิธีการพิจารณาในศาลแรงงาน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Family Law", icon: "👨‍👩‍👧", items: [{ name: "Family Registration Act", code: "พ.ร.บ. ทะเบียนราษฎร์", summary: "สถานะและทะเบียนครอบครัว", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" }, { name: "Marriage Registration Act", code: "พ.ร.บ. สมรส", summary: "การสมรส การหย่า และผลทางกฎหมาย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" }, { name: "Inheritance Act", code: "กฎหมายมรดก", summary: "สิทธิและการแบ่งมรดก", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" }] },
    { title: "Intellectual Property Law", icon: "🏢", items: [
      { name: "พระราชบัญญัติลิขสิทธิ์ พ.ศ. 2537", code: "", summary: "กฎหมายเกี่ยวกับสิทธิในทรัพย์สินทางปัญญาและการคุ้มครองผลงาน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติลิขสิทธิ์ พ.ศ. 2522", code: "", summary: "กฎหมายว่าด้วยการคุ้มครองสิทธิในทรัพย์สินทางปัญญา", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติเคลื่อนย้ายกำลังการค้า พ.ศ. 2534", code: "", summary: "กฎหมายที่เกี่ยวกับการเคลื่อนย้ายและการใช้ประโยชน์ทางปัญญา", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติการรับรองนโยบาย พ.ศ. 2534", code: "", summary: "กฎหมายที่กำหนดแนวทางและเงื่อนไขของการรับรองผลงาน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติจัดตั้งศาลลิขสิทธิ์ พ.ศ. 2539", code: "", summary: "กฎหมายเกี่ยวกับการจัดตั้งและการพิจารณาคดีลิขสิทธิ์", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Tax Law", icon: "💰", items: [
      { name: "ประมวลรัษฎากร", code: "", summary: "กฎหมายว่าด้วยภาษีอากรและภาระทางภาษี", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติตั้งศาลภาษีอากรและวิธีพิจารณาคดีภาษีอากร พ.ศ. 2528", code: "", summary: "การจัดตั้งศาลภาษีอากรและ procedure การพิจารณาคดีภาษี", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "ข้อกำหนดศาลภาษีอากร พ.ศ. 2544", code: "", summary: "ระเบียบและแนวทางการดำเนินงานของศาลภาษีอากร", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติภาษีอากร พ.ศ. 2510", code: "", summary: "กฎหมายพื้นฐานเกี่ยวกับภาษีอากรและฐานภาษี", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติภาษีภาษีบำเนินและวิธีการปรับปรุงช่วงการใช้ภาษี พ.ศ. 2563", code: "", summary: "การปรับปรุงระบบภาษีและแนวทางการปฏิบัติทางภาษี", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Environmental Law", icon: "🌿", items: [
      { name: "พระราชบัญญัติส่งเสริมและรักษาคุณภาพสิ่งแวดล้อมแห่งชาติ พ.ศ. 2535", code: "", summary: "กฎหมายหลักในการส่งเสริมและรักษาคุณภาพสิ่งแวดล้อมแห่งชาติ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติโรงงาน พ.ศ. 2535", code: "", summary: "กฎหมายเกี่ยวกับการควบคุมและดูแลโรงงานเพื่อป้องกันมลพิษ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติการนิคมอุตสาหกรรมแห่งประเทศไทย พ.ศ. 2522", code: "", summary: "กฎหมายว่าด้วยการจัดตั้งและการบริหารนิคมอุตสาหกรรม", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติการสาธารณสุข พ.ศ. 2535", code: "", summary: "กฎหมายที่เกี่ยวข้องกับสุขภาพอนามัยและการปกป้องสุขภาพของประชาชน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติวัตถุอันตราย พ.ศ. 2535", code: "", summary: "กฎหมายควบคุมและกำกับวัตถุอันตรายเพื่อความปลอดภัยของสังคม", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติมาตรฐานผลิตภัณฑ์อุตสาหกรรม พ.ศ. 2511", code: "", summary: "กฎหมายเกี่ยวกับมาตรฐานผลิตภัณฑ์เพื่อความปลอดภัยและคุณภาพ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "กฎหมายเกี่ยวกับการจัดการขยะของไทย", code: "", summary: "กฎหมายและแนวทางการจัดการขยะและมลพิษอย่างยั่งยืน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Education Law", icon: "🎓", items: [
      { name: "พระราชบัญญัติการศึกษาแห่งชาติ พ.ศ. 2542 (ฉบับอัพเดท)", code: "", summary: "กฎหมายหลักของระบบการศึกษาของชาติที่ปรับปรุงให้สอดคล้องกับยุคปัจจุบัน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติการศึกษาแห่งชาติ (ฉบับที่ 2) พ.ศ. 2545", code: "", summary: "การปรับปรุงแก้ไขเพื่อยกระดับและพัฒนาระบบการศึกษาของชาติ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติการศึกษาแห่งชาติ (ฉบับที่ 3) พ.ศ. 2553", code: "", summary: "การปรับปรุงให้สอดรับกับการเปลี่ยนแปลงด้านการศึกษาและสังคม", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติการศึกษาแห่งชาติ (ฉบับที่ 4) พ.ศ. 2562", code: "", summary: "การปรับปรุงและต่อยอดระบบการศึกษาของชาติให้ทันสมัยมากยิ่งขึ้น", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Consumer Protection Law", icon: "🛡️", items: [
      { name: "พระราชบัญญัติคุ้มครองผู้บริโภค พ.ศ. 2522", code: "", summary: "หลักเกณฑ์การคุ้มครองสิทธิและความปลอดภัยของผู้บริโภค", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติความรับผิดชอบต่อความเสียหายที่เกิดขึ้นจากการผลิตภัณฑ์ พ.ศ. 2551", code: "", summary: "ความรับผิดชอบของผู้ผลิตต่อความเสียหายที่เกิดจากสินค้า", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติตราสินค้าและตลาดแบบครบวงจร พ.ศ. 2545", code: "", summary: "กฎระเบียบเกี่ยวกับตราสินค้าและการตลาดที่ปลอดภัย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติตัวชี้วัดให้มีการจัดการผลิต ภ.พ.ศ. 2540", code: "", summary: "การกำกับดูแลและควบคุมการผลิตสินค้าเพื่อความปลอดภัย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติการจัดตั้งสำนักงานคุ้มครองผู้บริโภค พ.ศ. 2562", code: "", summary: "การจัดตั้งหน่วยงานที่รับผิดชอบการคุ้มครองผู้บริโภค", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "ข้อกำหนดของประธานศาลกว่าด้วยการดำเนินการเกี่ยวกับการคุ้มครองผู้บริโภค พ.ศ. 2551", code: "", summary: "แนวทางปฏิบัติและการดำเนินการในศาลเกี่ยวกับผู้บริโภค", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติว่าด้วยการคุ้มครองเสรีภาพในการเลือกซื้อสินค้า พ.ศ. 2551", code: "", summary: "การคุ้มครองสิทธิของผู้บริโภคในการเลือกซื้อและใช้สินค้า", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Traffic Law", icon: "🚗", items: [{ name: "กฎหมายจราจร", code: "จราจร", summary: "การขับขี่ การจราจร และความรับผิด", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" }, { name: "กฎหมายประกันภัยรถยนต์", code: "ประกันรถยนต์", summary: "ความคุ้มครองและการเคลมประกันภัย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" }, { name: "กฎหมายลิขสิทธิ์การขนส่ง", code: "ขนส่ง", summary: "กฎระเบียบส่งสินค้าและขนส่ง", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" }] },
    { title: "Narcotics Law", icon: "💊", items: [
      { name: "ประมวลกฎหมายยาเสพติด", code: "", summary: "กฎหมายว่าด้วยการป้องกันและควบคุมสารเสพติด", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติวีธีการบริหารคดียาเสพติด พ.ศ. 2550", code: "", summary: "กระบวนการจัดการและพิจารณาคดีเกี่ยวกับยาเสพติด", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Constitutional Law", icon: "📜", items: [
      { name: "พระราชบัญญัติป้องกันและปราบปรามการทุจริตแห่งชาติว่าด้วยการเลือกตั้งสมาชิกสภาผู้แทนราษฎร พ.ศ. 2561", code: "", summary: "กฎหมายว่าด้วยการคัดเลือกและการป้องกันการทุจริตในการเลือกตั้ง", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติป้องกันและปราบปรามการทุจริตในภาครัฐ พ.ศ. 2561", code: "", summary: "กฎหมายเพื่อป้องกันการทุจริตและประพฤติมิชอบในหน่วยงานภาครัฐ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติป้องกันและปราบปรามการทุจริตบุคคลผู้มีอิทธิพลในภาครัฐ พ.ศ. 2560", code: "", summary: "กฎหมายสำหรับการป้องกันและปราบปรามการทุจริตในหน่วยงานราชการ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติป้องกันและปราบปรามการทุจริตบุคคลผู้มีอิทธิพลในการดำเนินการสาธารณะ พ.ศ. 2560", code: "", summary: "กฎหมายเกี่ยวกับการป้องกันการทุจริตและการกดขี่จากการใช้อำนาจ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติป้องกันและปราบปรามการทุจริตบุคคลที่มีอำนาจหน้าที่ระหว่างประเทศ พ.ศ. 2560", code: "", summary: "กฎหมายคุ้มครองการใช้อำนาจและการควบคุมการทุจริตภายในหน่วยงาน", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติป้องกันและปราบปรามการทุจริตบุคคลที่มีส่วนเกี่ยวข้องกับการละเมิดระบอบประชาธิปไตย พ.ศ. 2561", code: "", summary: "กฎหมายป้องกันการแทรกแซงหรือการกระทำที่บั่นทอนระบอบประชาธิปไตย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติป้องกันและปราบปรามการทุจริตบุคคลที่มีอำนาจหน้าที่ในการประเมินผลการปฏิบัติหน้าที่ของเจ้าหน้าที่รัฐ พ.ศ. 2561", code: "", summary: "กฎหมายในการคัดกรองและป้องกันการทุจริตในกระบวนการประเมินผล", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติป้องกันและปราบปรามการทุจริตบุคคลที่มีอำนาจหน้าที่ควบคุมการให้บริการสาธารณะ พ.ศ. 2560", code: "", summary: "กฎหมายเกี่ยวกับการป้องกันการทุจริตในกระบวนการให้บริการสาธารณะ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติป้องกันและปราบปรามการทุจริตบุคคลที่มีอำนาจหน้าที่ดำเนินการภาครัฐ พ.ศ. 2561", code: "", summary: "กฎหมายสำหรับการป้องกันการทุจริตและการเอารัดเอาเปรียบภาครัฐ", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
    { title: "Bankruptcy Law", icon: "📉", items: [
      { name: "พระราชบัญญัติล้มละลาย พ.ศ. 2483", code: "", summary: "หลักเกณฑ์และข้อบังคับเกี่ยวกับการล้มละลาย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติล้มละลาย พุทธศักราช 2483", code: "", summary: "กฎหมายว่าด้วยการจัดการทรัพย์สินและหนี้สินของผู้ล้มละลาย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "พระราชบัญญัติจัดตั้งศาลล้มละลายและวิธีพิจารณาคดีล้มละลาย พ.ศ. 2542", code: "", summary: "การจัดตั้งศาลล้มละลายและกระบวนการพิจารณาคดี", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
      { name: "ข้อกำหนดศาลล้มละลาย พ.ศ. 2549", code: "", summary: "ระเบียบและการดำเนินกระบวนพิจารณาในศาลล้มละลาย", sourceUrl: "https://www.law.go.th/", sourceLabel: "Official Thai legal database" },
    ] },
  ];

function LegalCodesPage({ onBack }) {
  const [selectedLaw, setSelectedLaw] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (selectedLaw) {
    return <LegalCodeDetailPage law={selectedLaw} onBack={() => setSelectedLaw(null)} />;
  }

  if (selectedCategory) {
    return (
      <main className="min-h-screen bg-[#0d0d0c] px-5 py-6 text-[#f2eee7] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c5a878]/60 bg-[#171614] text-xl text-[#d9b876]">📄</div>
              <h1 className="text-[1.1rem] font-bold tracking-[-0.02em] text-[#f4e8d1]">{selectedCategory.title}</h1>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="inline-flex items-center gap-2 rounded-full border border-[#c5a878]/60 bg-[#171614] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#f0d99a] shadow-[0_12px_28px_rgba(0,0,0,0.25)]"
            >
              <span aria-hidden="true">←</span>
              Back
            </button>
          </div>

          <div className="space-y-3">
            {selectedCategory.items.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setSelectedLaw(item)}
                className="flex w-full items-center justify-start gap-3 rounded-xl border border-[#3b362f] bg-[#171614] px-4 py-4 text-left shadow-[0_10px_22px_rgba(0,0,0,0.2)] transition hover:border-[#d8bb7d] hover:shadow-[0_12px_26px_rgba(197,168,120,0.12)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#c5a878]/40 bg-[#201d1a] text-sm text-[#f0d99a]">📄</span>
                <span className="text-left text-base font-medium text-[#f4e8d1]">
                  {item.code} {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d0c] px-5 py-6 text-[#f2eee7] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-[#c5a878]/60 bg-[#171614] text-xl text-[#d9b876]">📚</div>
            <div>
              <h1 className="luxury-serif text-[2.5rem] font-bold tracking-[-0.04em] text-[#f4e8d1]">Legal Categories</h1>
              <p className="text-sm text-[#c3b39a]">Choose a legal category</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c5a878]/60 bg-[#171614] text-lg text-[#f0d99a] shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
            aria-label="Back"
          >
            ◫
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((category, index) => (
            <button
              key={`${category.title}-${index}`}
              type="button"
              onClick={() => {
                if (category.title === "Family Law") {
                  window.open("https://www.thaiembassy.cz/uploads/download/fcWRXfiIHL25cVnc5gd.pdf", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Administrative Law") {
                  window.open("https://webdev.excise.go.th/act2560/images/files/%E0%B8%81%E0%B8%8E%E0%B8%AB%E0%B8%A1%E0%B8%B2%E0%B8%A2%E0%B8%AD%E0%B8%99%E0%B9%86/Administrativelaw.pdf", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Criminal Law") {
                  window.open("https://ops.moph.go.th/public/download/document/laws/%E0%B8%81%E0%B8%8E%E0%B8%AB%E0%B8%A1%E0%B8%B2%E0%B8%A2%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%80%E0%B8%81%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%A7%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%87/162.dBtvfsIDLNFmAZKPSjMFXTETKjOwVvFs.pdf", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Civil & Commercial Law") {
                  window.open("https://webportal.bangkok.go.th/public/user_files_editor/75/basic_info/Laws/01_Pokkrong/Act_CivilCommLaw_2535.pdf", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Labor Law") {
                  window.open("https://www.ratchakitcha.soc.go.th/DATA/PDF/2541/A/008/1.PDF", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Intellectual Property Law") {
                  window.open("https://www.drthawip.com/intellectualproperty/008", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Tax Law") {
                  window.open("https://www.rd.go.th/674.html", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Environmental Law") {
                  window.open("https://www.pcd.go.th/wp-content/uploads/2020/05/pcdnew-2020-05-25_07-02-31_245442.pdf", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Education Law") {
                  window.open("https://pattani2.go.th/web/?p=859", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Consumer Protection Law") {
                  window.open("https://www3.ago.go.th/center/wp-content/uploads/2021/12/1-1.pdf", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Traffic Law") {
                  window.open("https://www.ratchakitcha.soc.go.th/DATA/PDF/2565/A/028/T_0005.PDF", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Narcotics Law") {
                  window.open("https://www.ratchakitcha.soc.go.th/DATA/PDF/2564/A/073/T_0001.PDF", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Constitutional Law") {
                  window.open("https://www.senate.go.th/assets/portals/93/fileups/257/files/%E0%B8%A3%E0%B8%81/mixrorkor_66%20_up%2012_7_66.pdf", "_blank", "noopener,noreferrer");
                  return;
                }
                if (category.title === "Bankruptcy Law") {
                  window.open("https://cbc.coj.go.th/th/file/get/file/20190808c1386784b3b2f05484fbdf58a1662d6d093241.pdf", "_blank", "noopener,noreferrer");
                  return;
                }
                setSelectedCategory(category);
              }}
              className="group flex min-h-[210px] flex-col items-center justify-center rounded-[1.35rem] border border-[#3b362f] bg-[#171614] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:border-[#d8bb7d] hover:shadow-[0_16px_30px_rgba(197,168,120,0.12)]"
            >
              <div className="flex h-[90px] w-[90px] items-center justify-center rounded-[1.2rem] border border-[#3b362f] bg-[#201d1a] text-4xl text-[#f0d99a] transition group-hover:border-[#d8bb7d] group-hover:shadow-[0_0_0_1px_rgba(197,168,120,0.15)]">
                {category.icon}
              </div>

              <span className="mt-5 text-center text-[1.1rem] font-medium leading-snug text-[#f4e8d1]">
                {category.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function LegalCodeDetailPage({ law, onBack }) {
  const safeLaw = {
    ...law,
    highlights: law.highlights || [
      "สิทธิและหน้าที่ที่กำหนดโดยกฎหมายฉบับนี้",
      "แนวทางปฏิบัติและการประเมินผลลัพธ์ทางกฎหมาย",
      "การใช้อำนาจและข้อพิจารณาที่เกี่ยวข้องกับกรณีที่ได้รับผลกระทบ",
    ],
    usage: law.usage || "ใช้ประกอบการประเมินข้อกฎหมายและวางแผนทางกฎหมายตามสถานการณ์จริงของแต่ละกรณี",
  };

  return (
    <main className="min-h-screen bg-[#0d0d0c] px-5 py-6 text-[#f3ead9] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c5a878]/60 bg-[#161411] text-lg text-[#d1af74] shadow-[0_8px_24px_rgba(197,168,120,0.12)]">◌</div>
            <h1 className="text-[1rem] font-bold tracking-[-0.02em] text-[#f2eee7]">Thai Legal Code</h1>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-[#c5a878]/60 bg-[#171614] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#f0d99a] shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition hover:border-[#e1bf7a] hover:text-[#f7e6bf]"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        </div>

        <article className="rounded-[2rem] border border-[#2f2d2a] bg-[linear-gradient(180deg,rgba(20,18,16,0.96),rgba(11,10,9,0.96))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
          <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#c5a878]">{safeLaw.code}</p>
          <h2 className="mt-4 font-[Cormorant_Garamond,serif] text-4xl leading-none tracking-[-0.05em] text-[#f4e8d1] sm:text-5xl">
            {safeLaw.name}
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-8 text-[#d9cfbc]">{safeLaw.summary}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.2rem] border border-[#3b362f] bg-[#171614] p-5">
              <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[#c5a878]">What it covers</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#e7dcc4]">
                {safeLaw.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3">
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#d2b06d]" aria-hidden="true" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.2rem] border border-[#3b362f] bg-[#171614] p-5">
              <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[#c5a878]">Practical use</p>
              <p className="mt-4 text-sm leading-7 text-[#e7dcc4]">{safeLaw.usage}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => window.open(law.sourceUrl, "_blank", "noopener,noreferrer")}
              className="rounded-xl bg-[linear-gradient(135deg,#d9bb7a_0%,#c99d5a_100%)] px-5 py-3 text-sm font-semibold text-[#181411] shadow-[0_8px_20px_rgba(197,168,120,0.24)]"
            >
              Read official text
            </button>
            <span className="text-xs uppercase tracking-[0.18em] text-[#c5a878]">{law.sourceLabel}</span>
          </div>

          <div className="mt-8 rounded-[1.3rem] border border-[#3b362f] bg-[#151312] p-5">
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[#c5a878]">Legal note</p>
            <p className="mt-3 text-sm leading-7 text-[#d7cdb7]">
              ข้อมูลนี้เป็นสรุปเชิงกฎหมายเพื่อช่วยให้เข้าใจโครงสร้างและวัตถุประสงค์ของกฎหมายแต่ละฉบับ และควรใช้ร่วมกับคำปรึกษาทางกฎหมายเฉพาะกรณีเพื่อประเมินผลทางกฎหมายอย่างถูกต้อง
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}

const articlePosts = [
  {
    id: "article-1",
    category: "กฎหมายธุรกิจ",
    title: "15 อันดับสำนักกฎหมายชั้นนำที่มีประสบการณ์ทางกฎหมาย",
    summary: "การเลือกสำนักกฎหมายที่มีความเหมาะสมต้องพิจารณาภาพรวมของประสบการณ์ ความเชี่ยวชาญเฉพาะทาง และความสามารถในการปกป้องสิทธิของลูกค้าในสถานการณ์ทางกฎหมายที่ซับซ้อนจริง ๆ",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    content: [
      "การเลือกสำนักกฎหมายที่เหมาะสมเป็นการตัดสินใจที่มีผลต่อทั้งศักยภาพในการคุ้มครองสิทธิและความเสี่ยงต่อการเสียเวลา เสียเงิน หรือแม้แต่สูญเสียประโยชน์ทางกฎหมายโดยไม่รู้ตัว การประเมินสำนักกฎหมายไม่ควรอิงเพียงชื่อเสียงหรือการโฆษณา แต่ควรพิจารณาอย่างรอบด้านว่าองค์กรดังกล่าวมีความเชี่ยวชาญจริงในด้านที่สอดคล้องกับปัญหาของตนหรือไม่",
      "สำนักกฎหมายที่มีคุณภาพมักให้ความสำคัญกับการวิเคราะห์ข้อเท็จจริงก่อนตัดสินใจทางกฎหมาย และสามารถอธิบายให้ลูกค้ารับทราบว่า ปัญหานี้อยู่ภายใต้กฎหมายประเภทใด สิทธิและหน้าที่ของลูกค้าอยู่ตรงไหน และควรใช้แนวทางใดในการเจรจา หรือจัดการกับสถานการณ์ที่เกิดขึ้นอย่างเหมาะสม การสื่อสารที่ชัดเจนจึงเป็นตัวชี้วัดสำคัญของความเชี่ยวชาญที่ไม่ใช่แค่ความรู้ทางกฎหมายตามหนังสือ",
      "การเลือกทนายหรือสำนักกฎหมายที่มีประสบการณ์ในคดีที่ใกล้เคียงกับปัญหาของคุณจะช่วยลดความเสี่ยงจากการประเมินผิดหรือจัดการผิดลำดับขั้นตอนได้มากกว่าการเลือกเพียงจากความนิยมหรือความโด่งดัง การถามคำถามเชิงลึก เช่น เคยแก้ไขปัญหาแบบเดียวกันมาก่อนหรือไม่ มีความรู้ด้านสัญญาแรงงาน ทรัพย์สิน หรือคดีอาญาด้านใดมากกว่า มีระบบการติดตามคดีและการรายงานลูกค้าอย่างไร จะช่วยให้เห็นภาพความสามารถจริงของทีมได้ชัดขึ้น",
      "นอกจากนี้ ผู้ให้คำปรึกษาทางกฎหมายที่ดีควรสามารถจับประเด็นทางกฎหมายในระดับเชิงปฏิบัติ ไม่ใช่เพียงการอธิบายกฎหมายตามกฎเกณฑ์ทั่วไป แต่ต้องสามารถเชื่อมโยงกับข้อเท็จจริงของเรื่องและวางแนวทางการป้องกันหรือแก้ไขปัญหาให้สอดรับกับสถานการณ์จริง เช่น หากเรื่องเกี่ยวกับสัญญา ควรมีความเข้าใจถึงข้อกำหนดและความบกพร่องที่อาจถูกใช้เป็นเหตุในการโต้แย้ง หากเรื่องเกี่ยวกับธุรกิจ ควรคำนึงถึงผลกระทบต่อการดำเนินงาน ความสัมพันธ์กับคู่ค้า และความคุ้มค่าในการเจรจา",
      "ดังนั้นก่อนตัดสินใจจ้างสำนักกฎหมาย ควรตรวจสอบประวัติความเชี่ยวชาญ รูปแบบการให้คำปรึกษา และระดับความใกล้ชิดกับปัญหาของตัวเอง หากเป็นไปได้ให้ขอคำปรึกษาเบื้องต้นเพื่อประเมินว่า ทีมงานมีความเข้าใจปัญหาและวางแผนได้เหมาะสมหรือไม่ เพราะในกฎหมาย ความแตกต่างระหว่าง ‘รู้กฎหมาย’ กับ ‘รู้วิธีใช้กฎหมายให้คุ้มค่า’ อาจส่งผลอย่างมากต่อผลลัพธ์สุดท้าย",
      "สรุปได้ว่า สำนักกฎหมายที่ดีไม่ใช่แค่คนที่มีป้ายชื่อหรือมีประวัติพอควร แต่คือผู้ที่สามารถใช้อำนาจทางกฎหมายเพื่อคุ้มครองสิทธิของลูกค้าอย่างมีเหตุผล มีความรับผิดชอบ และสามารถนำทางได้ในช่วงเวลาที่อาจเป็นจุดเปลี่ยนของชีวิตหรือธุรกิจได้จริง"
    ],
  },
  {
    id: "article-2",
    category: "กฎหมายแพ่ง",
    title: "ไขข้อสงสัย: คดีแพ่งมีอายุความกี่ปี? คดีขาดอายุความฟ้องได้ไหม?",
    summary: "อายุความเป็นหัวใจของกฎหมายแพ่ง เพราะกำหนดว่า บุคคลสามารถใช้สิทธิเรียกร้องหรือฟ้องคดีได้กี่ปี หากพ้นกำหนดแล้ว แม้ข้อเท็จจริงจะชัดเจน ก็อาจเสียสิทธิในการคุ้มครองได้",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=1200&q=80",
    content: [
      "กฎหมายแพ่งมีระบบอายุความเพื่อให้เกิดความแน่นอนและป้องกันการเรียกร้องสิทธิที่ล่าช้าหรือไม่ชัดเจนเกินกว่าที่กฎหมายยอมรับ ในความหมายที่ง่ายที่สุด อายุความคือระยะเวลาที่กฎหมายให้บุคคลใช้สิทธิฟ้องร้องหรือเรียกร้องค่าสินไหมทดแทนได้ หากเลยระยะเวลานั้นไป ข้อเรียกร้องอาจถูกปฏิเสธได้โดยอัตโนมัติหรือมีความยากมากขึ้นในการบังคับใช้สิทธิ",
      "ศาลและกฎหมายไม่ได้กำหนดระยะเวลาแบบเดียวกันสำหรับทุกคดี เพราะประเภทของสิทธิและประเภทของคดีมีความต่างกัน เช่น คดีที่เกิดจากสัญญา คดีละเมิด คดีเกี่ยวกับทรัพย์สิน หรือคดีที่มีการกระทำโดยมิชอบต่างมีเงื่อนไขของอายุความที่ไม่เท่ากัน บางคดีอาจเริ่มนับจากวันที่เกิดเหตุ บางคดีอาจเริ่มนับจากวันที่ผู้เสียหายรู้หรือควรรู้ว่าได้รับความเสียหาย จึงมีความสำคัญมากที่ต้องวิเคราะห์ประเภทของคดีให้ถูกต้องก่อนตัดสินใจว่าจะฟ้องหรือไม่",
      "ความเข้าใจผิดที่พบบ่อยคือคิดว่าคดีแพ่ง ‘ถ้าหลักฐานชัดเจนก็น่าจะฟ้องได้ตลอดเวลา’ แต่ในความจริงกฎหมายมีข้อจำกัดเรื่องเวลาเพื่อให้เกิดความชัดเจน การเลื่อนการฟ้องไปเรื่อย ๆ อาจทำให้คู่กรณีโต้แย้งเรื่องอายุความได้ หากศาลเห็นว่าพ้นกำหนดแล้ว อาจถือว่าเสียสิทธิ์ในการเรียกร้อง แม้จะมีหลักฐานที่หนักแน่นก็ตาม",
      "อีกประเด็นที่สำคัญคืออายุความไม่จำเป็นต้องเป็นเกณฑ์ที่ตายตัวเสมอไป เพราะมีกรณีที่อายุความอาจหยุดชั่วคราวหรือได้รับการยกเว้นภายใต้เงื่อนไขบางประการ เช่น เมื่อกรณีมีการเจรจา ข้อพิพาทยังอยู่ระหว่างการไกล่เกลี่ย หรือมีการยอมรับสิทธิจากฝ่ายหนึ่ง การเปรียบเทียบประเด็นเหล่านี้จึงต้องอาศัยความเข้าใจเชิงกฎหมายและข้อเท็จจริงร่วมกัน",
      "ดังนั้นก่อนที่จะเริ่มกระบวนการทางกฎหมายหรือปล่อยให้เวลาผ่านไป ควรประเมินให้ชัดเจนว่าเหตุการณ์เกิดขึ้นเมื่อไหร่ ความเสียหายเกิดขึ้นเมื่อใด และสิทธิที่เรียกร้องมีลักษณะใด หากมีข้อสงสัย ควรปรึกษาทนายความโดยเร็ว เพราะความล่าช้าในคดีแพ่งมักนำไปสู่การสูญเสียสิทธิด้วยอายุความแม้จะมีปัญหาที่ชัดเจนก็ตาม",
      "สรุปง่าย ๆ คือ อายุความเป็นสิ่งที่กฎหมายกำหนดเพื่อความเป็นธรรมและความแน่นอน ไม่ได้มีไว้เพื่อทำให้คนเสียสิทธิอย่างไร้เหตุผล แต่หากคนไม่เข้าใจว่ากฎหมายกำหนดเวลาไว้เท่าไรหรือเริ่มนับเมื่อใด ก็อาจทำให้พลาดโอกาสในการฟ้องหรือเรียกร้องผลประโยชน์ที่ควรได้รับ"
    ],
  },
  {
    id: "article-3",
    category: "กฎหมายอาญา",
    title: "รอลงอาญา คืออะไร? ทำไมต้องรอลงอาญา? บทความนี้มีคำตอบ",
    summary: "รอลงอาญาเป็นแนวทางที่ศาลใช้เพื่อให้ผู้กระทำผิดมีโอกาสปรับเปลี่ยนพฤติกรรมและกลับสู่สังคม โดยกำหนดเงื่อนไขที่ชัดเจนเพื่อป้องกันการกลับมาทำผิดซ้ำ",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    content: [
      "รอลงอาญาเป็นหลักเกณฑ์ทางอาญาที่ศาลใช้ในบางกรณี โดยที่ศาลอาจไม่ลงโทษในทันที แต่ให้ผู้กระทำผิดปฏิบัติตามเงื่อนไขที่กำหนด เช่น ไม่กระทำผิดซ้ำ จัดการค่าเสียหาย หรือเข้ารับการอบรมหรือการให้คำแนะนำทางสังคม แนวคิดนี้มีวัตถุประสงค์เพื่อให้โอกาสแก้ไขและฟื้นฟูผู้กระทำผิด โดยคำนึงถึงคุณค่าของการปรับปรุงพฤติกรรมแทนการลงโทษที่อาจทำลายอนาคตของบุคคลในทันที",
      "การรอลงอาญาไม่ได้หมายถึงการปล่อยให้ทุกคนผ่านพ้นความผิดโดยไม่มีผลลัพธ์ เพราะศาลยังคงให้ความสำคัญกับความรุนแรงของพฤติการณ์ ผลกระทบต่อเหยื่อ และพฤติกรรมเดิมของผู้กระทำผิด หากผู้กระทำผิดมีประวัติหรือมีความเสี่ยงสูงว่าจะกลับทำผิดซ้ำ ศาลอาจปฏิเสธการรอลงอาญา หรือกำหนดเงื่อนไขที่เข้มข้นขึ้นเพื่อให้เกิดความรับผิดชอบมากยิ่งขึ้น",
      "แนวทางนี้มีประโยชน์มากในกรณีที่ความผิดไม่รุนแรงมากนักหรือเมื่อมีโอกาสที่ผู้กระทำผิดจะรับรู้และเปลี่ยนแปลงพฤติกรรมได้จริง อย่างไรก็ตาม ต้องเข้าใจว่าการรอลงอาญาไม่ใช่การยกเว้นความผิด แต่เป็นการ ‘เลื่อนผลบังคับความผิด’ ให้เกิดขึ้นเมื่อมีการฝ่าฝืนเงื่อนไข ดังนั้นถ้าหลังจากนี้ผู้กระทำผิดทำผิดซ้ำ หรือไม่ปฏิบัติตามเงื่อนไขที่ศาลกำหนด ศาลอาจยกเลิกการรอลงอาญาและส่งกลับไปพิจารณาโทษเดิมได้",
      "สำหรับคนทั่วไป ความเข้าใจผิดที่พบบ่อยคือคิดว่าเพียงแค่ไปศาลแล้วได้รับรอลงอาญา หมายความว่าพ้นจากคดีไปแล้ว แต่ความจริงคือภายใต้เงื่อนไขเป็นช่วงเวลาที่ต้องมีการประพฤติปฏิบัติและรักษาความรับผิดชอบต่อสังคม หากในช่วงนี้มีการกระทำผิดซ้ำ คดีอาจกลับมาดำเนินการอีกครั้งอีกด้วย",
      "ดังนั้น หากคุณหรือคนใกล้ชิดถูกพิจารณาเรื่องรอลงอาญา ควรให้ความสำคัญกับรายละเอียดของคำสั่งศาล คำแนะนำจากทนายความ และการปฏิบัติตามเงื่อนไขอย่างเคร่งครัด เพื่อให้ประโยชน์จากโอกาสนี้เกิดขึ้นจริง ไม่ใช่แค่ผ่านไปด้วยความเข้าใจผิด",
      "ในภาพรวม รอลงอาญาเป็นเครื่องมือทางกฎหมายที่มุ่งหวังทั้งความเป็นธรรมและการฟื้นฟูสังคม มันให้โอกาสหนึ่ง แต่ไม่ใช่การยกเว้นความรับผิดชอบที่ขาดเงื่อนไขและความเคร่งครัด"
    ],
  },
  {
    id: "article-4",
    category: "กฎหมายแรงงาน",
    title: "โดนคดียาสเพติด ประกันตัวได้ไหม? ต้องเตรียมเอกสารอะไรบ้าง?",
    summary: "การขอประกันตัวต้องอาศัยความเข้าใจในหลักเกณฑ์ทางกฎหมายและการจัดเตรียมเอกสารที่สอดคล้องกับข้อเท็จจริง เพื่อเพิ่มโอกาสให้ศาลเห็นว่าความเสี่ยงในการหลบหนีหรือรบกวนกระบวนการยุติธรรมมีจำกัด",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
    content: [
      "การขอประกันตัวเป็นอีกหนึ่งประเด็นที่มีผลกระทบต่อชีวิตและความมั่นใจของผู้ถูกกล่าวหาอย่างมาก เพราะเป็นคำถามที่เกี่ยวข้องกับการถูกควบคุมตัวและสิทธิในการอยู่รอดในช่วงที่คดียังดำเนินอยู่ ศาลหรือเจ้าหน้าที่จะพิจารณาไม่ใช่แค่เรื่องว่าผู้ถูกกล่าวหามีความผิดหรือไม่ แต่ยังพิจารณาความเสี่ยงต่อการหลบหนี ความรุนแรงของข้อกล่าวหา และความเหมาะสมของการปล่อยให้มีอิสระชั่วคราว",
      "การเตรียมเอกสารจึงเป็นส่วนสำคัญ เพราะเอกสารที่ชัดเจนจะช่วยให้ศาลเห็นว่าผู้ขอประกันตัวมีที่อยู่ที่แน่นอน มีผู้อยู่ประคอง หรือมีภาระทางสังคมที่ทำให้ไม่อาจหลบหนีได้ง่าย เอกสารทั่วไปที่ใช้ประกอบ เช่น บัตรประจำตัวประชาชน หลักฐานที่แสดงที่อยู่และการมีชีวิตประจำวัน หรือเอกสารที่พิสูจน์ว่าเป็นคนทำงานและมีภาระทางครอบครัวที่ต้องรับผิดชอบ",
      "หากมีผู้ค้ำประกัน ผู้ค้ำประกันเองจะต้องมีข้อมูลที่เพียงพอเพื่อยืนยันว่าสามารถรับผิดชอบและดูแลผู้ถูกกล่าวหาได้ หากผู้ค้ำประกันมีเอกสารที่สอดคล้องกับความจริงและสามารถอธิบายความสัมพันธ์กับผู้ถูกกล่าวหาได้ดี ศาลจะมีข้อมูลมากขึ้นในการประเมินว่าความเสี่ยงต่อการหลบหนีมีน้อยเพียงใด",
      "สิ่งที่อาจมองข้ามคือการเตรียมคำชี้แจงให้ชัดเจนและตรงกับข้อเท็จจริง คำชี้แจงที่ดีควรระบุความจริงที่เกี่ยวข้อง สถานะของผู้ร้องประกันชั่วคราว ประวัติการปฏิบัติตามกฎหมาย และเหตุผลที่พอให้ศาลเชื่อว่าการปล่อยตัวชั่วคราวจะไม่ก่อให้เกิดผลกระทบต่อกระบวนการยุติธรรม",
      "ในการทำงานกับคดีที่ซับซ้อน การปรึกษาทนายความหรือผู้มีประสบการณ์ที่เคยดำเนินงานในลักษณะเดียวกันจะช่วยให้เข้าใจแนวทางและเอกสารที่จำเป็นมากขึ้น เพราะกลยุทธ์ที่ดีในการขอประกันตัวไม่ได้ขึ้นอยู่กับเพียงความลำบากของสถานการณ์ แต่ขึ้นกับความสามารถในการสื่อสารข้อเท็จจริงให้ศาลเข้าใจและยอมรับได้",
      "ดังนั้น การประกันตัวจึงควรดูเป็นเรื่องของการวางแผนและการเตรียมข้อมูล ไม่ใช่เพียงแค่การยื่นคำร้องเพื่อขอความเป็นธรรมในช่วงเวลาที่ยากลำบาก เพราะศาลมักจะยึดประเด็นความเสี่ยงและความน่าเชื่อถือเป็นสำคัญ"
    ],
  },
  {
    id: "article-5",
    category: "กฎหมายครอบครัว",
    title: "เจ้าหนี้ต้องอ่าน! หนังสือว่าทางกฎหมายที่มีผลต่อครอบครัวและสิทธิผู้เสียหาย",
    summary: "เอกสารทางกฎหมายที่เกี่ยวข้องกับครอบครัวและหนี้สินมีผลต่อสิทธิและความรับผิดชอบในเชิงปฏิบัติอย่างมาก เพราะมันกำหนดสิทธิของแต่ละฝ่ายและอาจเปลี่ยนแนวทางการเจรจาในอนาคตได้",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    content: [
      "เอกสารทางกฎหมายภายในครอบครัวและกรณีหนี้สินมักมีความอ่อนไหวและมีผลต่อความสัมพันธ์ระหว่างบุคคลมากกว่าที่หลายคนคาด เพราะมันไม่ได้เป็นเพียงแค่บทสรุปเรื่องเงิน แต่เป็นหลักฐานเชิงกฎหมายที่อาจใช้เป็นฐานในการพิสูจน์สิทธิและหน้าที่ในอนาคต เช่น ข้อตกลงชำระหนี้ หนังสือยินยอม การทำสัญญาเช่าซื้อ หรือเอกสารที่เกี่ยวข้องกับทรัพย์สิน",
      "ในสถานการณ์ที่มีข้อพิพาท ความชัดเจนของเอกสารเป็นสิ่งที่ช่วยลดความสับสนและป้องกันการโต้แย้งที่เกิดจากการเล่าเรื่องต่างกัน หากฝ่ายใดฝ่ายหนึ่งไม่มีหลักฐานที่เพียงพอ ศาลอาจไม่สามารถพิสูจน์ได้ว่าใครเป็นเจ้าของสิทธิใด หรือใครมีหน้าที่ต้องรับผิดชอบมากกว่ากัน การจัดเก็บและประเมินเอกสารอย่างถูกต้องจึงมีความสำคัญเป็นพิเศษ",
      "อีกหนึ่งประเด็นที่สำคัญคือความเข้าใจว่าทรัพย์สินหรือหนี้สินที่เกิดขึ้นภายในครอบครัวอาจมีลักษณะทางกฎหมายที่ซับซ้อนมากกว่าเรื่องส่วนตัวปกติ เพราะบางกรณีมีการใช้ร่วมกันมีค่าใช้จ่ายร่วมกัน หรือมีสิทธิของกลุ่มคนหลายคนร่วมอยู่ด้วย การแก้ปัญหาโดยไม่ดูเอกสารที่มีความชัดเจนอาจนำไปสู่การตัดสินใจที่ตื้นเกินไป หรือทำให้คนสูญเสียสิทธิที่ควรได้รับ",
      "ดังนั้น บุคคลที่อยู่ในสถานการณ์ดังกล่าวควรให้ความสำคัญกับการเก็บรักษาเอกสาร การตรวจสอบความถูกต้องของข้อมูล และการประเมินว่าเอกสารนั้นมีผลทางกฎหมายเพียงใด และหากมีข้อสงสัย ควรได้รับคำปรึกษาเพราะหลายครั้งความจริงที่เป็นไปไม่ได้จะถูกแปลงเป็นความจำเป็นของคดีได้ก็ต่อเมื่อเอกสารมีความชัดเจนและถูกบันทึกไว้ถูกต้อง",
      "การเจรจาก็เป็นส่วนสำคัญเช่นกัน เพราะในหลายกรณี หากมีการชะลอหรือไม่ยอมรับเอกสารที่เหมาะสม อาจทำให้ปัญหายืดเยื้อและเกิดความคุกรุ่นภายในครอบครัว แต่ถ้ามีกฎหมายที่ชัดเจนและมีการวางแนวทางสู่ความเหมาะสม ก็สามารถลดความขัดแย้งได้มากขึ้น",
      "สุดท้าย การเข้าใจสิทธิและหน้าที่ของแต่ละฝ่ายไม่ใช่เพียงการอ่านจบหนึ่งชิ้นเอกสาร แต่ต้องเชื่อมโยงกับสถานการณ์จริงและความตั้งใจของแต่ละฝ่ายที่ร่วมเรื่องนี้ จึงเป็นเหตุผลว่าทำไมคำปรึกษาทางกฎหมายจึงจำเป็นในกรณีที่ละเอียดอ่อนเช่นนี้"
    ],
  },
  {
    id: "article-6",
    category: "กฎหมายภาษี",
    title: "รู้จักภาษีตามกฎหมายไทย: เริ่มจากพื้นฐานที่ทุกคนควรรู้",
    summary: "ภาษีเป็นภาระทางกฎหมายที่ส่งผลต่อทั้งบุคคลและธุรกิจ การเข้าใจพื้นฐานจะช่วยให้สามารถวางแผนทางการเงิน คงความถูกต้องของเอกสาร และลดความเสี่ยงต่อการผิดพลาดทางกฎหมายได้",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    content: [
      "ภาษีเป็นหนึ่งในกิจกรรมทางกฎหมายที่มีผลต่อสังคมและเศรษฐกิจอย่างต่อเนื่อง เพราะภาษีไม่ได้เป็นเพียงค่าใช้จ่ายที่จ่ายให้รัฐ แต่เป็นการกำกับการไหลของรายได้และการทำธุรกิจภายใต้กรอบกฎหมายที่กำหนดไว้ โดยทั่วไปภาษีมีหลายประเภท เช่น ภาษีเงินได้ ภาษีมูลค่าเพิ่ม และภาษีที่เกี่ยวกับธุรกรรมหรือทรัพย์สินที่เฉพาะเจาะจงขึ้นอยู่กับลักษณะของกิจกรรม",
      "พื้นฐานที่สำคัญคือการรู้ว่า ภาษีมีความเกี่ยวข้องกับรายได้และกิจกรรมทางเศรษฐกิจของบุคคลหรือองค์กรอย่างไร ผู้เสียภาษีไม่จำเป็นต้องเป็นธุรกิจขนาดใหญ่เท่านั้น แต่บุคคลธรรมดาก็อาจมีภาระภาษีกับรายได้ที่ได้รับ การจัดทำเอกสารที่ถูกต้องและการปฏิบัติตามเงื่อนไขของภาษีจึงเป็นส่วนที่ควรให้ความสำคัญ",
      "การคำนวณภาษีต้องอาศัยข้อมูลหลายด้าน เช่น ประเภทรายได้ การหักค่าใช้จ่ายตามที่กฎหมายอนุญาตหรือกำหนด และลักษณะของภาระภาษีที่เกี่ยวกับการประกอบกิจการหรือการลงทุน การเข้าใจเรื่องนี้จะช่วยให้บุคคลและธุรกิจสามารถวางแผนทางการเงินได้อย่างมีประสิทธิภาพ และลดความเสี่ยงจากการจ่ายภาษีเกินหรือผิดเงื่อนไข",
      "ความจริงที่หลายคนมองข้ามคือภาษีจำเป็นต้องมีการติดตามและจัดการอย่างต่อเนื่อง ไม่ใช่แค่จ่ายในช่วงเวลาหนึ่งหรือจำกัดเพียงหลังสิ้นปี แต่ต้องมีการเก็บเอกสาร ตรวจสอบข้อเท็จจริง และยื่นแบบฟอร์มตามกำหนด หากมีความคลาดเคลื่อนหรือไม่แน่ใจ ควรปรึกษาผู้เชี่ยวชาญเพื่อหลีกเลี่ยงความผิดพลาดทางกฎหมายที่ส่งผลต่อค่าเสียหายหรือค่าปรับในภายหลัง",
      "สำหรับธุรกิจ ภาษีเป็นประเด็นที่มีความซับซ้อนเพิ่มขึ้นจากการจัดการบัญชี การรายงานรายได้ และการปฏิบัติตามกฎหมายที่มีการเปลี่ยนแปลงอยู่เสมอ การมีระบบจัดเก็บข้อมูลที่ดีและการวางแผนเชิงรุกจะช่วยให้บริษัทมีความโปร่งใสและลดความเสี่ยงจากการถูกดำเนินการทางกฎหมาย",
      "ดังนั้น การเข้าใจภาษีแบบพื้นฐานไม่ใช่เรื่องของการเทรดข้อมูลหรือรู้แต่ชื่อประเภทภาษีเท่านั้น แต่เป็นเรื่องของการเข้าใจว่าใครมีหน้าที่จ่ายภาษีอย่างไร ใครมีสิทธิใช้ประโยชน์ทางภาษีตามกฎหมาย และเมื่อเกิดข้อพิพาท ควรดำเนินการอย่างไรเพื่อรักษาสิทธิและความถูกต้องให้มากที่สุด"
    ],
  },
];

const legalCodesSearchCatalog = categories.flatMap((category) =>
  category.items.map((law) => ({
    title: law.name,
    type: "Legal codes",
    detail: law.summary,
    law: {
      ...law,
      highlights: law.highlights || [
        "สิทธิและหน้าที่ที่กฎหมายกำหนด",
        "ลักษณะและเงื่อนไขของการใช้กฎหมาย",
        "การประเมินผลและแนวทางการดำเนินการตามข้อกฎหมาย",
      ],
      usage: law.usage || "ใช้ประกอบการวางแผนและประเมินผลทางกฎหมายในสถานการณ์จริง",
    },
    searchableText: `${law.name} ${law.code} ${law.summary} ${category.title}`.toLowerCase(),
  }))
);

const websiteSearchCatalog = [
  ...articlePosts.map((article) => ({
    title: article.title,
    type: "บทความ",
    detail: article.summary,
    article,
    searchableText: `${article.title} ${article.category} ${article.summary} ${article.content.join(" ")}`.toLowerCase(),
  })),
  ...legalCodesSearchCatalog,
  { title: "กฎหมายปกครอง", type: "กฎหมาย", detail: "กฎหมายพื้นฐานเกี่ยวกับการใช้อำนาจรัฐ การบริหารราชการ และการคุ้มครองความเป็นธรรม", searchableText: "กฎหมายปกครอง หน่วยงานภาครัฐ การใช้อำนาจรัฐ บริหารราชการ ความเป็นธรรม" },
  { title: "ประมวลกฎหมายอาญา", type: "กฎหมาย", detail: "กฎหมายที่กำหนดความผิดและโทษด้านอาญา", searchableText: "ประมวลกฎหมายอาญา อาญา ความผิด โทษ คดีอาญา" },
  { title: "ประมวลกฎหมายแพ่งและพาณิชย์", type: "กฎหมาย", detail: "กฎหมายพื้นฐานเกี่ยวกับสัญญา ทรัพย์สิน และสิทธิของบุคคล", searchableText: "ประมวลกฎหมายแพ่งและพาณิชย์ กฎหมายแพ่ง สัญญา ทรัพย์สิน สิทธิ" },
  { title: "กฎหมายแรงงาน", type: "กฎหมาย", detail: "กฎหมายเกี่ยวกับการจ้างงาน การประกันสังคม และสิทธิแรงงาน", searchableText: "กฎหมายแรงงาน แรงงาน การจ้างงาน ประกันสังคม สิทธิแรงงาน" },
  { title: "กฎหมายครอบครัว", type: "กฎหมาย", detail: "กฎหมายเกี่ยวกับสมรส ทรัพย์สิน ครอบครัว และมรดก", searchableText: "กฎหมายครอบครัว สมรส ครอบครัว มรดก ทรัพย์สิน" },
  { title: "ภาษี", type: "กฎหมาย", detail: "ภาระทางภาษีและการปฏิบัติตามกฎหมายภาษี", searchableText: "ภาษี ภาษีอากร รายได้ ภาษีมูลค่าเพิ่ม ภาระภาษี" },
  { title: "บริการปรึกษาทนาย", type: "บริการ", detail: "ให้คำปรึกษาและติดตามกรณีทางกฎหมาย", searchableText: "ปรึกษาทนาย คำปรึกษา ทนายความ การให้คำปรึกษา" },
  { title: "สัญญา", type: "บริการ", detail: "ตรวจสอบและทบทวนสัญญาก่อนลงนาม", searchableText: "สัญญา ตรวจสอบสัญญา ทบทวนสัญญา จัดทำสัญญา" },
];

function ArticlesPage({ onBack }) {
  const [selectedArticle, setSelectedArticle] = useState(null);

  if (selectedArticle) {
    return <ArticleDetailPage article={selectedArticle} onBack={() => setSelectedArticle(null)} />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,175,106,0.18),transparent_35%),linear-gradient(180deg,#11100f_0%,#171412_100%)] px-4 py-8 text-[#f4e9d3] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.05em] text-[#f7ecd0] sm:text-5xl">บทความยอดนิยม</h1>
            <p className="mt-2 text-lg text-[#d9c79b]">รับรู้ข่าวสารและความรู้ทางกฎหมายแบบเข้าใจง่าย เรียบหรูและมีระดับ</p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-full border border-[#d4af6a]/50 bg-[#151311] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d08b] shadow-[0_0_0_1px_rgba(212,175,106,0.15)] transition hover:border-[#d4af6a] hover:bg-[#1a1714]"
          >
            Back
          </button>
        </div>

        <div className="mb-8 overflow-hidden rounded-[1.6rem] border border-[#d4af6a]/30 bg-[linear-gradient(135deg,#171513_0%,#221d18_100%)] p-4 shadow-[0_24px_50px_rgba(0,0,0,0.38)]">
          <p className="text-2xl font-black leading-snug text-[#f7ecd0] sm:text-3xl">
            15 อันดับสำนักกฎหมายชั้นนำที่มีประสบการณ์ทางกฎหมาย
          </p>
          <p className="mt-3 max-w-4xl text-base leading-8 text-[#d8c9a7]">
            มีปัญหาทางกฎหมายหรือมีคำถามเรื่องสิทธิขั้นตอนต่าง ๆ ควรเลือกสำนักกฎหมายที่มีประสบการณ์และความเชี่ยวชาญในด้านที่ต้องการ เพื่อให้คำปรึกษาและได้รับการช่วยเหลืออย่างแม่นยำและตรงกับสถานการณ์จริง
          </p>
        </div>

        <div className="space-y-5">
          {articlePosts.map((article) => (
            <article key={article.id} className="rounded-[1.4rem] border border-[#d4af6a]/25 bg-[linear-gradient(180deg,#171513_0%,#120f0d_100%)] shadow-[0_18px_38px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-[#d4af6a]/50 hover:shadow-[0_24px_50px_rgba(212,175,106,0.08)]">
              <div className="grid gap-5 p-4 md:grid-cols-[260px_1fr] md:p-5">
                <img src={article.image} alt={article.title} className="h-52 w-full rounded-[1.2rem] object-cover md:h-full" />

                <div className="flex flex-col justify-between">
                  <div>
                    <span className="inline-flex rounded-full bg-[#2c241d] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#f0c877] ring-1 ring-[#d4af6a]/30">
                      {article.category}
                    </span>
                    <h2 className="mt-3 text-2xl font-black leading-snug text-[#f7ecd0]">{article.title}</h2>
                    <p className="mt-3 text-base leading-8 text-[#d8c9a7]">{article.summary}</p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-[#c4b18a]">อ่าน 5 นาที</span>
                    <button
                      type="button"
                      onClick={() => setSelectedArticle(article)}
                      className="rounded-xl bg-[linear-gradient(135deg,#d7b669_0%,#b88a3f_100%)] px-5 py-3 text-sm font-semibold text-[#140f0c] shadow-[0_12px_28px_rgba(191,145,70,0.28)] transition hover:brightness-110"
                    >
                      อ่าน
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function ArticleDetailPage({ article, onBack }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,175,106,0.18),transparent_35%),linear-gradient(180deg,#11100f_0%,#171412_100%)] px-4 py-8 text-[#f4e9d3] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-full border border-[#d4af6a]/50 bg-[#151311] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d08b] shadow-[0_0_0_1px_rgba(212,175,106,0.15)] transition hover:border-[#d4af6a] hover:bg-[#1a1714]"
          >
            Back
          </button>
          <span className="inline-flex rounded-full bg-[#2c241d] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#f0c877] ring-1 ring-[#d4af6a]/30">
            {article.category}
          </span>
        </div>

        <article className="overflow-hidden rounded-[1.8rem] border border-[#d4af6a]/25 bg-[linear-gradient(180deg,#171513_0%,#120f0d_100%)] shadow-[0_20px_45px_rgba(0,0,0,0.36)]">
          <img src={article.image} alt={article.title} className="h-[280px] w-full object-cover sm:h-[360px]" />

          <div className="p-5 sm:p-8 lg:p-10">
            <h1 className="text-3xl font-black leading-tight text-[#f7ecd0] sm:text-5xl">{article.title}</h1>
            <p className="mt-4 text-lg text-[#d9c79b]">{article.summary}</p>

            <div className="mt-8 space-y-5">
              {article.content.map((paragraph) => (
                <p key={paragraph} className="text-base leading-8 text-[#e4d3a3]">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8 rounded-[1.2rem] border border-[#d4af6a]/20 bg-[#1a1714] p-5 text-base leading-8 text-[#e7d6ac]">
              ข้อมูลในบทความนี้มีวัตถุประสงค์เพื่อให้ความรู้เบื้องต้นและเป็นแนวทางทั่วไปสำหรับการตัดสินใจทางกฎหมาย ไม่ใช่การให้คำปรึกษาเฉพาะกรณี หากคุณมีปัญหาจริงควรปรึกษาทนายหรือผู้เชี่ยวชาญที่เกี่ยวข้องต่อไป
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}

function ConsultationPage({ onBack, user }) {
  const lawyers = [
    { name: "สาโรจน์ กุลติน", title: "ผู้ก่อตั้ง", location: "ภูเก็ต", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80" },
    { name: "ชิน สำนักงานซินเซ็ท", title: "นานนท์", location: "นนทบุรี", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80" },
    { name: "กิตยากร วิสัยศิริ", title: "วิสัยศิริ", location: "นนทบุรี", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80" },
    { name: "สุภาภรณ์ เร่งดี", title: "ทนายความ", location: "นนทบุรี", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80" },
    { name: "ธนาคาร วินมหาชัย", title: "กรุงเทพมหานคร", location: "กรุงเทพฯ", image: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80" },
    { name: "บัณฑิต สังข์บุญชู", title: "พระนครศรีอยุธยา", location: "กรุงเทพฯ", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80" },
    { name: "กัลยวัฒน์ ยศธรรม", title: "สมุทรปราการ", location: "สุพรรณบุรี", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80" },
    { name: "ปรเมศวร์ พรมเติม", title: "ชลบุรี", location: "ชลบุรี", image: "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80" },
    { name: "นพรัตน์ มนต์ลิน", title: "ชมรมกฎหมาย", location: "กรุงเทพฯ", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80" },
    { name: "อาทิรัตน์ แจ้งนัด", title: "ธนบัตร", location: "เชียงใหม่", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80" },
    { name: "อัครพงษ์ กุญชร", title: "กฎหมายภาคธุรกิจ", location: "เชียงใหม่", image: "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=600&q=80" },
    { name: "ศรรัตน์ พรนิต", title: "กฎหมายควบคุม", location: "กาญจนบุรี", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" },
    { name: "อัจฉริยะ แจ่มผล", title: "กฎหมายอสังหา", location: "สมุทรสาคร", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" },
    { name: "พิชญ์ บุญยืน", title: "ฝ่ายแพ่ง", location: "สงขลา", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80" },
    { name: "พงศ์ศิริ จิตต์สุนทร", title: "กฎหมายครอบครัว", location: "พัทยา", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80" },
    { name: "อนุสรณ์ ศรีเกษม", title: "กฎหมายการค้า", location: "ศรีสะเกษ", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80" },
  ];

  return (
    <main className="min-h-screen bg-[#0d0d0c] px-5 py-6 text-[#f3ead9] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c5a878]/60 bg-[#161411] text-lg text-[#d1af74] shadow-[0_8px_24px_rgba(197,168,120,0.12)]">◌</div>
            <h1 className="text-[1.1rem] font-bold tracking-[-0.02em] text-[#f2eee7]">lawyers on # Platform</h1>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-[#c5a878]/60 bg-[#171614] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#f0d99a] shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition hover:border-[#e1bf7a] hover:text-[#f7e6bf]"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {lawyers.map((lawyer, index) => (
            <div
              key={`${lawyer.name}-${index}`}
              className="rounded-[1.3rem] border border-[#c5a878]/60 bg-[linear-gradient(180deg,rgba(29,25,22,0.96),rgba(15,14,13,0.96))] p-3 shadow-[0_0_0_1px_rgba(197,168,120,0.18),0_15px_30px_rgba(0,0,0,0.22)]"
            >
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[#c5a878]/70 bg-[#201d1a] px-3 py-1.5 text-[0.62rem] font-semibold text-[#f2d296] shadow-[0_8px_20px_rgba(197,168,120,0.12)]"
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#cfaf68] text-[0.58rem] text-[#171412]">✦</span>
                  นัดเข้า
                </button>
              </div>

              <div className="mt-1 flex flex-col items-center">
                <div className="relative">
                  <img
                    src={lawyer.image}
                    alt={lawyer.name}
                    className="h-24 w-24 rounded-full border-[3px] border-[#d4b56d] object-cover shadow-[0_0_0_4px_rgba(17,14,11,0.9)]"
                  />
                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[#171412] bg-[#42c77c]" />
                </div>

                <h2 className="mt-4 text-center text-[1.05rem] font-bold leading-snug text-[#f3ead9]">
                  {lawyer.name}
                </h2>
                <p className="mt-1 text-center text-[0.8rem] text-[#c7b89d]">{lawyer.location}</p>

                <div className="mt-4 w-full rounded-[0.7rem] border border-[#3b362f] bg-[#171614] px-3 py-2 text-center text-[0.72rem] text-[#e8d8b9]">
                  พร้อมปรึกษากับทนาย 1 ชั่วโมง
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-xl bg-[linear-gradient(135deg,#d9bb7a_0%,#c99d5a_100%)] px-4 py-3 text-sm font-semibold text-[#181411] shadow-[0_8px_20px_rgba(197,168,120,0.24)]"
                >
                  นัดหมายปรึกษาทนาย
                </button>

                <div className="mt-4 flex w-full items-center justify-center gap-4 text-[0.68rem] text-[#d0c3a9]">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#2ab77b] bg-[#163b2e] text-[0.62rem] text-[#bfe9d1]">✓</span>
                    ยืนยันทันที
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#d0b04e] bg-[#352d18] text-[0.62rem] text-[#f0d48a]">◔</span>
                    เลือกเวลาได้
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function CaseOverviewAd() {
  const slides = [
    {
      title: "Nawapas Legal",
      subtitle: "สำนักกฎหมายที่ให้คำปรึกษาและดูแลคดีแบบครบวงจร",
      badge: "Corporate • Litigation",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
    },
    {
      title: "Lexa Counsel",
      subtitle: "ให้บริการด้านกฎหมายภาคธุรกิจและการเจรจาเชิงกลยุทธ์",
      badge: "Business • Contract",
      image:
        "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=1400&q=80",
    },
    {
      title: "Bam Legal Studio",
      subtitle: "ทีมทนายมืออาชีพพร้อมวางแผนคดีและรับคำปรึกษาทุกปัญหา",
      badge: "Consultation • Family",
      image:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80",
    },
    {
      title: "Pattaya Law Group",
      subtitle: "ความเชี่ยวชาญในกฎหมายอสังหาริมทรัพย์และการคุ้มครองสิทธิ",
      badge: "Property • Rights",
      image:
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1400&q=80",
    },
    {
      title: "Siam Justice Partners",
      subtitle: "บริการด้านกฎหมายการค้าและการจัดการปัญหาทางกฎหมายอย่างรอบด้าน",
      badge: "Legal advice • Cases",
      image:
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 3500);

    return () => clearInterval(intervalId);
  }, [slides.length]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2e2a26] bg-[#171614] shadow-[0_18px_48px_rgba(0,0,0,0.2)]">
      <div className="border-b border-[#352f2b] px-6 py-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-[#c5a878]">CASE OVERVIEW</p>
          <h2 className="mt-2 text-2xl font-semibold">Your legal workspace</h2>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.title} className="min-w-full">
              <div className="relative h-[260px] w-full sm:h-[310px]">
                <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0c]/85 via-[#0d0d0c]/45 to-[#0d0d0c]/20" />

                <div className="absolute inset-0 flex items-center justify-between gap-4 px-5 sm:px-6">
                  <div className="max-w-md">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-[#f0d88d]">
                      {slide.badge}
                    </p>
                    <h3 className="mt-3 font-[Cormorant_Garamond,serif] text-3xl font-semibold leading-none text-[#f8f0df] sm:text-4xl">
                      {slide.title}
                    </h3>
                    <p className="mt-3 max-w-sm text-xs leading-6 text-[#ece2d4] sm:text-sm">
                      {slide.subtitle}
                    </p>
                  </div>

                  <div className="hidden h-20 w-20 items-center justify-center rounded-full border border-[#d1b779]/60 bg-[#11100f]/50 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-[#f0d99a] backdrop-blur-sm md:flex">
                    Ad
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 border-t border-[#352f2b] px-4 py-3">
        {slides.map((slide, index) => (
          <button
            key={`${slide.title}-dot`}
            type="button"
            aria-label={`View slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex ? "w-8 bg-[#d8b66d]" : "w-2.5 bg-[#6b6259]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
