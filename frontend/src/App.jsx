import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import Clients from './components/admin/Clients';
import Assessments from './components/admin/Assessments';
import Engagements from './components/admin/Engagements';
import Analytics from './components/admin/Analytics';
import IntakeForm from './components/IntakeForm';
import DomainStep from './components/DomainStep';
import ReviewPage from './components/ReviewPage';
import ReportPage from './components/ReportPage';
import ClientLogin from './components/client/ClientLogin';
import ClientLayout from './components/client/ClientLayout';
import ClientOverview from './components/client/ClientOverview';
import ClientAssessments from './components/client/ClientAssessments';
import ClientRemediation from './components/client/ClientRemediation';
import ClientEngagements from './components/client/ClientEngagements';
import { DOMAINS, getQuestionsByDomain, QUESTIONS } from './data/questions';

const STORAGE_KEY = 'cybersec-assessment-state';
const AUTH_KEY = 'cybersec-auth';
const CLIENT_AUTH_KEY = 'cybersec-client-auth';
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getInitialPage(clientAuth, auth) {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  if (params.get('invite')) return 'client-activate';
  if (path === '/admin') return auth ? 'admin' : 'admin-login';
  if (path === '/client') return clientAuth ? 'client' : 'client-login';
  if (clientAuth) return 'client';
  if (auth) return 'admin';
  return 'landing';
}

function loadJson(key) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } }

export default function App() {
  const [auth, setAuth] = useState(() => loadJson(AUTH_KEY));
  const [clientAuth, setClientAuth] = useState(() => loadJson(CLIENT_AUTH_KEY));
  const [page, setPage] = useState(() => getInitialPage(loadJson(CLIENT_AUTH_KEY), loadJson(AUTH_KEY)));
  const [adminPage, setAdminPage] = useState('dashboard');
  const [clientPage, setClientPage] = useState('overview');
  const [inviteToken, setInviteToken] = useState(null);

  const saved = loadJson(STORAGE_KEY);
  const [step, setStep] = useState(saved?.step ?? 0);
  const [intake, setIntake] = useState(saved?.intake ?? null);
  const [answers, setAnswers] = useState(saved?.answers ?? {});
  const [notes, setNotes] = useState(saved?.notes ?? {});
  const [scores, setScores] = useState(saved?.scores ?? null);
  const [report, setReport] = useState(saved?.report ?? null);

  function navigate(pg) {
    setPage(pg);
    if (pg === 'admin' || pg === 'admin-login') window.history.pushState({}, '', '/admin');
    else if (pg === 'client' || pg === 'client-login') window.history.pushState({}, '', '/client');
    else window.history.pushState({}, '', '/');
  }

  // Check URL for invite token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (token) {
      setInviteToken(token);
      setPage('client-activate');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (adminPage === 'new-assessment') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, intake, answers, notes, scores, report }));
    }
  }, [step, intake, answers, notes, scores, report, adminPage]);

  // Admin auth
  function handleAdminAuth(token, username) {
    const a = { token, username };
    localStorage.setItem(AUTH_KEY, JSON.stringify(a));
    setAuth(a);
    navigate('admin');
  }

  function handleAdminLogout() {
    localStorage.removeItem(AUTH_KEY);
    setAuth(null);
    navigate('landing');
  }

  // Client auth
  function handleClientAuth(token, user) {
    const a = { token, user };
    localStorage.setItem(CLIENT_AUTH_KEY, JSON.stringify(a));
    setClientAuth(a);
    setInviteToken(null);
    navigate('client');
  }

  function handleClientLogout() {
    localStorage.removeItem(CLIENT_AUTH_KEY);
    setClientAuth(null);
    navigate('landing');
  }

  // Assessment helpers
  function handleStartOver() {
    setStep(0); setIntake(null); setAnswers({}); setNotes({}); setScores(null); setReport(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  async function saveAssessmentToDb() {
    if (!intake || !scores || !auth?.token) return;
    const hdrs = { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` };
    const clients = await fetch(`${API}/admin/clients`, { headers: hdrs }).then(r => r.json());
    let client = clients.find(c => c.org_name === intake.org_name && c.contact_email === intake.contact_email);
    if (!client) {
      client = await fetch(`${API}/admin/clients`, {
        method: 'POST', headers: hdrs, body: JSON.stringify(intake),
      }).then(r => r.json());
    }
    await fetch(`${API}/admin/assessments`, {
      method: 'POST', headers: hdrs,
      body: JSON.stringify({
        client_id: client.id, assessor_name: intake.assessor_name || '',
        assessment_date: intake.assessment_date, answers, notes,
        domain_scores: scores.domain_scores, overall_score: scores.overall_score,
        risk_rating: scores.risk_rating, flagged_findings: scores.flagged_findings,
        report: report || null,
      }),
    });
  }

  function handleAdminNavigate(pg) {
    if (pg === 'new-assessment') { handleStartOver(); }
    setAdminPage(pg);
  }

  // --- Routing ---

  // Landing
  if (page === 'landing') {
    return <LandingPage onGetStarted={() => navigate('admin-login')} onClientPortal={() => navigate('client-login')} />;
  }

  // Admin login
  if (page === 'admin-login') {
    return <LoginPage onAuth={handleAdminAuth} onBack={() => navigate('landing')} />;
  }

  // Client login / activation
  if (page === 'client-login' || page === 'client-activate') {
    return <ClientLogin onAuth={handleClientAuth} onBack={() => navigate('landing')} inviteToken={inviteToken} />;
  }

  // Client portal
  if (page === 'client' && clientAuth) {
    return (
      <ClientLayout currentPage={clientPage} onNavigate={setClientPage} user={clientAuth.user} onLogout={handleClientLogout}>
        {clientPage === 'overview' && <ClientOverview token={clientAuth.token} user={clientAuth.user} onNavigate={setClientPage} />}
        {clientPage === 'assessments' && <ClientAssessments token={clientAuth.token} />}
        {clientPage === 'remediation' && <ClientRemediation token={clientAuth.token} />}
        {clientPage === 'engagements' && <ClientEngagements token={clientAuth.token} />}
      </ClientLayout>
    );
  }

  // Admin portal
  if (page === 'admin' && auth) {
    if (adminPage !== 'new-assessment') {
      return (
        <AdminLayout currentPage={adminPage} onNavigate={handleAdminNavigate} username={auth.username} onLogout={handleAdminLogout}>
          {adminPage === 'dashboard' && <Dashboard onNavigate={handleAdminNavigate} token={auth.token} />}
          {adminPage === 'clients' && <Clients onNavigate={handleAdminNavigate} token={auth.token} />}
          {adminPage === 'assessments' && <Assessments token={auth.token} />}
          {adminPage === 'engagements' && <Engagements token={auth.token} />}
          {adminPage === 'analytics' && <Analytics token={auth.token} />}
        </AdminLayout>
      );
    }

    const totalAnswered = Object.keys(answers).length;
    const domainIndex = step - 1;

    return (
      <AdminLayout currentPage="new-assessment" onNavigate={handleAdminNavigate} username={auth.username} onLogout={handleAdminLogout}>
        {step === 0 && <IntakeForm onSubmit={(d) => { setIntake(d); setStep(1); }} />}

        {domainIndex >= 0 && domainIndex < DOMAINS.length && (() => {
          const domain = DOMAINS[domainIndex];
          return (
            <>
              <DomainNav domains={DOMAINS} currentIndex={domainIndex} answers={answers} onSelect={(s) => setStep(s)} />
              <DomainStep
                domain={domain} domainIndex={domainIndex} totalDomains={DOMAINS.length}
                questions={getQuestionsByDomain(domain)} answers={answers} notes={notes}
                onAnswer={(id, l) => setAnswers((p) => ({ ...p, [id]: l }))}
                onNote={(id, t) => setNotes((p) => ({ ...p, [id]: t }))}
                onNext={() => setStep(step + 1)} onBack={() => setStep(step - 1)}
                totalAnswered={totalAnswered} totalQuestions={QUESTIONS.length}
                industry={intake?.industry || ''}
              />
            </>
          );
        })()}

        {step === DOMAINS.length + 1 && (
          <ReviewPage intake={intake} answers={answers} notes={notes} scores={scores} setScores={setScores}
            onGenerateReport={(r) => { setReport(r); setStep(DOMAINS.length + 2); }}
            onStartOver={handleStartOver} onSave={saveAssessmentToDb} />
        )}

        {step === DOMAINS.length + 2 && report && (
          <ReportPage intake={intake} scores={scores} report={report} notes={notes}
            onStartOver={() => { saveAssessmentToDb().then(() => { handleStartOver(); setAdminPage('dashboard'); }); }} />
        )}
      </AdminLayout>
    );
  }

  return null;
}

function DomainNav({ domains, currentIndex, answers, onSelect }) {
  return (
    <div className="max-w-2xl mx-auto mb-6">
      <div className="flex flex-wrap gap-1">
        {domains.map((d, i) => {
          const qs = getQuestionsByDomain(d);
          const done = qs.filter((q) => answers[q.id]).length;
          const complete = done === qs.length;
          const current = i === currentIndex;
          return (
            <button key={d} onClick={() => onSelect(i + 1)} title={`${d} (${done}/${qs.length})`}
              className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-all duration-150 ${
                current ? 'bg-accent/15 text-accent-light border border-accent/25'
                : complete ? 'bg-emerald-500/8 text-emerald-400/80 border border-emerald-500/15'
                : 'text-zinc-600 border border-white/[0.04] hover:border-white/[0.08] hover:text-zinc-500'
              }`}>
              {d.split(' ')[0]}{complete ? ' ✓' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
