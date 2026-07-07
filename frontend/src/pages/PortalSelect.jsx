import { useNavigate } from 'react-router-dom';
import { ShieldCheck, GraduationCap, Lock, MapPin, Clock3, BarChart3, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: Lock, title: 'Secure Access', body: 'Role-based authentication and data protection.' },
  { icon: MapPin, title: 'Smart Verification', body: 'GPS and network checks confirm you\u2019re really in the room.' },
  { icon: Clock3, title: 'Real-time Updates', body: 'Live attendance tracking and instant reports.' },
  { icon: BarChart3, title: 'Insightful Reports', body: 'Analytics built for better academic decisions.' },
];

export default function PortalSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl">
        <div className="mb-14">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white">
              KGiSL<span className="text-signal-red">-IIM</span>
            </h1>
          </div>
          <p className="mt-2 text-sm tracking-[0.2em] text-slate-500 uppercase">MCA Department</p>
          <h2 className="mt-8 font-display text-2xl md:text-3xl font-semibold text-white">
            Welcome to <span className="text-signal-red">Smart Attendance</span>
          </h2>
          <p className="mt-2 text-slate-400">Secure. Reliable. Seamless. Choose your portal to continue.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/admin/login')}
            className="group text-left rounded-2xl border border-ink-border bg-ink-850/60 p-8 shadow-card transition hover:border-signal-blue/40 hover:bg-ink-850"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal-blue/10 border border-signal-blue/20">
              <ShieldCheck size={22} className="text-signal-blue" />
            </div>
            <h3 className="mt-6 font-display text-xl font-semibold text-white">Admin Portal</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Access the faculty dashboard to run live sessions, manage students, and view reports.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-lg bg-signal-blue/10 border border-signal-blue/30 px-4 py-2.5 text-sm font-medium text-slate-100 transition group-hover:bg-signal-blue/20">
              Faculty Login <ArrowRight size={15} />
            </div>
          </button>

          <button
            onClick={() => navigate('/student/login')}
            className="group text-left rounded-2xl border border-signal-red/30 bg-gradient-to-b from-ink-850/60 to-signal-redDim/10 p-8 shadow-glow transition hover:border-signal-red/60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-signal-red/10 border border-signal-red/25">
              <GraduationCap size={22} className="text-signal-red" />
            </div>
            <h3 className="mt-6 font-display text-xl font-semibold text-white">Student Portal</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Scan the live session QR to mark your attendance and view your records.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-lg bg-signal-red px-4 py-2.5 text-sm font-medium text-white transition group-hover:bg-red-600">
              Student Login <ArrowRight size={15} />
            </div>
          </button>
        </div>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-ink-border pt-10">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon size={18} className="text-slate-500" />
              <h4 className="mt-3 text-sm font-semibold text-slate-200">{title}</h4>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} KGiSL Institute of Information Management (IIM). All rights reserved.
        </p>
      </div>
    </div>
  );
}
