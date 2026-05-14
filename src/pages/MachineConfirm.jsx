import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import FloorPlan from '../components/floorplan/FloorPlan';
import ConfirmPanel from '../components/confirm/ConfirmPanel';

export default function MachineConfirm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const hasState = Boolean(state?.session_id && state?.machines);

  // Redirect to upload if accessed without session state
  useEffect(() => {
    if (!hasState) navigate('/', { replace: true });
  }, [hasState, navigate]);

  if (!hasState) return null;

  const { session_id, machines } = state;

  // Convert backend bbox (0-1 fractions) to percentage values for FloorPlan
  const floorMachines = machines.map((m) => ({
    id: m.machine_id,
    name: m.machine_id.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    x: m.bbox.x * 100,
    y: m.bbox.y * 100,
    w: m.bbox.w * 100,
    h: m.bbox.h * 100,
    confidence: Math.round(m.confidence * 100),
  }));

  const handleConfirmed = () => {
    navigate('/dashboard', { state: { session_id, machines: floorMachines } });
  };

  return (
    <div className="h-full flex bg-prometheus-bg font-inter p-4 gap-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-[3] min-h-0"
      >
        <FloorPlan mode="confirm" machines={floorMachines} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-[2] min-h-0"
      >
        <ConfirmPanel machines={floorMachines} onConfirmed={handleConfirmed} />
      </motion.div>
    </div>
  );
}
