import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TopBar from '../components/dashboard/TopBar';
import FloorPlan from '../components/floorplan/FloorPlan';
import MachineCardList from '../components/dashboard/MachineCardList';
import { openOccupancySocket } from '../api/prometheus';

export default function LiveDashboard() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [machines, setMachines] = useState(() =>
    (state?.machines ?? []).map((m) => ({ ...m, status: 'free', time: '—' }))
  );
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!state?.session_id) {
      navigate('/', { replace: true });
      return;
    }

    const ws = openOccupancySocket(state.session_id);
    socketRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      // msg.machines: [{machine_id, status, confidence}]
      setMachines((prev) =>
        prev.map((m) => {
          const update = msg.machines.find((u) => u.machine_id === m.id);
          if (!update) return m;
          return {
            ...m,
            status: update.status,
            confidence: Math.round(update.confidence * 100),
          };
        })
      );
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    return () => ws.close();
  }, [state?.session_id, navigate]);

  const freeCount = machines.filter((m) => m.status === 'free').length;

  return (
    <div className="h-full flex flex-col bg-prometheus-bg font-inter">
      <TopBar freeCount={freeCount} totalCount={machines.length} connected={connected} />

      <div className="flex-1 flex p-4 gap-4 min-h-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-[55] min-h-0"
        >
          <FloorPlan mode="live" machines={machines} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex-[45] min-h-0"
        >
          <MachineCardList machines={machines} />
        </motion.div>
      </div>
    </div>
  );
}
