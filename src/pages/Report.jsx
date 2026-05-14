import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Dumbbell, Film, Clock, BarChart2, FolderOpen, ExternalLink, Flag } from 'lucide-react';
import { fetchResults, fetchUploads, fetchFlags } from '../api/prometheus';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatCard({ icon: Icon, label, value, color = '#F5F0E8', sub }) {
  return (
    <div className="bg-prometheus-card border border-prometheus-border rounded-lg p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}12` }}>
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div>
        <p className="text-prometheus-secondary text-[10px] uppercase tracking-widest">{label}</p>
        <p className="text-prometheus-cream text-[22px] font-semibold leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-prometheus-secondary text-[10px] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SessionSummary({ results }) {
  if (!results) return null;

  const frames = results.frames ?? [];
  const maxPersons = Math.max(...frames.map((f) => f.persons?.length ?? 0), 0);
  const machineCount = Math.max(...frames.map((f) => f.machines?.length ?? 0), 0);
  const framesWithPerson = frames.filter((f) => (f.persons?.length ?? 0) > 0).length;
  const allConf = frames.flatMap((f) => [
    ...(f.persons ?? []).map((p) => p.confidence),
    ...(f.machines ?? []).map((m) => m.confidence),
  ]);
  const avgConf = allConf.length
    ? Math.round((allConf.reduce((a, b) => a + b, 0) / allConf.length) * 100)
    : 0;
  const durationS = Math.round((results.total_frames_analyzed * 5) / (results.fps || 30));

  return (
    <div className="mb-8">
      <h2 className="text-prometheus-cream text-[13px] font-semibold mb-3 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-prometheus-green" />
        Current Session Summary
        <span className="text-prometheus-secondary text-[11px] font-normal ml-1">— {results.filename ?? 'latest video'}</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Peak Persons" value={maxPersons} color="#E84545"
          sub={`${framesWithPerson} frames with activity`} />
        <StatCard icon={Dumbbell} label="Machines Found" value={machineCount} color="#00C896" />
        <StatCard icon={Film} label="Frames Analyzed" value={results.total_frames_analyzed} color="#8A8A8A"
          sub={`${results.fps?.toFixed(0)} fps · every 5th frame`} />
        <StatCard icon={Clock} label="Video Duration" value={formatTime(durationS)} color="#F5A623"
          sub={`${results.frame_width}×${results.frame_height}`} />
      </div>
      {avgConf > 0 && (
        <div className="mt-3 bg-prometheus-card border border-prometheus-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-prometheus-secondary text-[11px]">Average model confidence</p>
            <span className="text-[12px] font-semibold" style={{
              color: avgConf >= 85 ? '#00C896' : avgConf >= 65 ? '#F5A623' : '#E84545'
            }}>{avgConf}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-prometheus-border overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${avgConf}%`,
              backgroundColor: avgConf >= 85 ? '#00C896' : avgConf >= 65 ? '#F5A623' : '#E84545',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Report() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [currentResults, setCurrentResults] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [flagCounts, setFlagCounts] = useState({});

  useEffect(() => {
    if (state?.session_id) {
      fetchResults(state.session_id).then(setCurrentResults).catch(() => {});
    }
    fetchUploads()
      .then((d) => setUploads(d.uploads))
      .finally(() => setLoadingUploads(false));
    fetchFlags().then((d) => setFlagCounts(d.flags)).catch(() => {});
  }, [state?.session_id]);

  const openInPlayer = (sessionId) => {
    navigate('/dashboard', { state: { session_id: sessionId } });
  };

  return (
    <div className="h-full flex flex-col bg-prometheus-bg font-inter overflow-auto">
      <div className="flex-shrink-0 px-6 py-5 border-b border-prometheus-border"
        style={{ background: 'linear-gradient(to bottom, #0f181e, #0d151b)' }}>
        <h1 className="text-prometheus-cream text-[16px] font-semibold">Detection Report</h1>
        <p className="text-prometheus-secondary text-[12px] mt-0.5">Session summaries and upload history</p>
      </div>

      <div className="flex-1 p-6">
        {/* Current session summary */}
        {currentResults ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SessionSummary results={currentResults} />
          </motion.div>
        ) : state?.session_id ? (
          <div className="mb-8 text-prometheus-secondary text-[12px]">Loading session summary...</div>
        ) : (
          <div className="mb-8 bg-prometheus-card border border-prometheus-border rounded-lg p-4">
            <p className="text-prometheus-secondary text-[12px]">
              No active session — upload a video first or open one from the history below.
            </p>
          </div>
        )}

        {/* Upload history */}
        <h2 className="text-prometheus-cream text-[13px] font-semibold mb-3 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-prometheus-green" />
          Upload History
        </h2>

        {loadingUploads ? (
          <p className="text-prometheus-secondary text-[12px]">Loading...</p>
        ) : uploads.length === 0 ? (
          <div className="bg-prometheus-card border border-prometheus-border rounded-lg p-6 text-center">
            <p className="text-prometheus-secondary text-[12px]">No uploads yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {uploads.map((u, i) => (
              <motion.div key={u.session_id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-prometheus-card border border-prometheus-border rounded-lg px-4 py-3 flex items-center gap-4 hover:border-prometheus-green/30 transition-colors"
              >
                <Film className="w-4 h-4 text-prometheus-secondary flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-prometheus-cream text-[12px] font-medium truncate">
                    {u.filename.length > 30 ? u.filename.slice(0, 27) + '...' : u.filename}
                  </p>
                  <p className="text-prometheus-secondary text-[10px] mt-0.5">{formatDate(u.analyzed_at)}</p>
                </div>

                <div className="flex items-center gap-5 text-[11px] flex-shrink-0">
                  <div className="flex items-center gap-1 text-prometheus-red">
                    <Users className="w-3 h-3" />
                    <span>{u.max_persons} max persons</span>
                  </div>
                  <div className="flex items-center gap-1 text-prometheus-green">
                    <Dumbbell className="w-3 h-3" />
                    <span>{u.machine_count} machines</span>
                  </div>
                  <div className="flex items-center gap-1 text-prometheus-secondary">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(u.duration_s)}</span>
                  </div>
                  {u.size_mb && (
                    <span className="text-prometheus-secondary">{u.size_mb} MB</span>
                  )}
                  {flagCounts[u.session_id] > 0 && (
                    <div className="flex items-center gap-1 text-prometheus-yellow">
                      <Flag className="w-3 h-3" />
                      <span>{flagCounts[u.session_id]} flagged</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => openInPlayer(u.session_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-prometheus-elevated border border-prometheus-border text-prometheus-secondary text-[11px] font-medium hover:text-prometheus-cream hover:border-prometheus-green/40 transition-all flex-shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
