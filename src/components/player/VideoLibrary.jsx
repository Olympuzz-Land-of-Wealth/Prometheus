import { FileVideo, Users, Dumbbell, Clock, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoLibrary({ uploads, onSelect }) {
  // uploads === null means still loading (parent hasn't fetched yet)
  if (uploads === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-prometheus-green"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </div>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-prometheus-secondary">
        <FolderOpen className="w-10 h-10 opacity-30" />
        <p className="text-[13px]">No analyzed videos yet — upload one first</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <p className="text-prometheus-secondary text-[11px] uppercase tracking-widest mb-4">
        {uploads.length} analyzed video{uploads.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 gap-3">
        {uploads.map((u, i) => (
          <motion.div
            key={u.session_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-prometheus-card border border-prometheus-border rounded-lg p-4 flex items-center gap-4 hover:border-prometheus-green/40 transition-colors cursor-pointer group"
            onClick={() => onSelect(u.session_id)}
          >
            <div className="w-10 h-10 rounded-lg bg-prometheus-elevated flex items-center justify-center flex-shrink-0">
              <FileVideo className="w-5 h-5 text-prometheus-secondary group-hover:text-prometheus-green transition-colors" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-prometheus-cream text-[13px] font-semibold truncate">
                {u.filename.length > 30 ? u.filename.slice(0, 27) + '...' : u.filename}
              </p>
              <p className="text-prometheus-secondary text-[10px] mt-0.5">{formatDate(u.analyzed_at)}</p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 text-[11px]">
              <div className="flex items-center gap-1 text-prometheus-red">
                <Users className="w-3.5 h-3.5" />
                <span>{u.max_persons} max</span>
              </div>
              <div className="flex items-center gap-1 text-prometheus-green">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>{u.machine_count}</span>
              </div>
              <div className="flex items-center gap-1 text-prometheus-secondary">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(u.duration_s)}</span>
              </div>
              {u.size_mb && (
                <span className="text-prometheus-secondary">{u.size_mb} MB</span>
              )}
            </div>

            <div className="w-20 text-right flex-shrink-0">
              <span className="text-[11px] font-semibold text-prometheus-green opacity-0 group-hover:opacity-100 transition-opacity">
                Open →
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
