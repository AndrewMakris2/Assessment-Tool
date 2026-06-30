const NAV = [
  { id: 'overview', label: 'Overview', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
  { id: 'assessments', label: 'Assessments', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z' },
  { id: 'remediation', label: 'Remediation', icon: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
  { id: 'engagements', label: 'Engagements', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5' },
];

export default function ClientLayout({ currentPage, onNavigate, user, onLogout, children }) {
  return (
    <div className="min-h-screen bg-surface-0 flex">
      <aside className="w-56 border-r border-white/[0.06] bg-surface-1 flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-sm shadow-violet-500/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white tracking-[-0.01em]">CyberAssess</span>
          </div>
          <p className="text-[11px] text-subtle mt-2 truncate">{user?.org_name}</p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                currentPage === item.id ? 'bg-accent/15 text-accent-light' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
              }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-white/[0.06]">
          <p className="text-[11px] text-subtle truncate mb-1">{user?.email}</p>
          <button onClick={onLogout} className="text-[11px] text-subtle hover:text-red-400 transition-colors">Sign out</button>
        </div>
      </aside>

      <main className="flex-1 ml-56">
        <div className="max-w-4xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
