import { motion } from 'framer-motion';
import FloorPlan from '../components/floorplan/FloorPlan';
import ConfirmPanel from '../components/confirm/ConfirmPanel';

export default function MachineConfirm() {
  return (
    <div className="h-full flex bg-prometheus-bg font-inter p-4 gap-4">
      {/* Left: Floor plan */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-[3] min-h-0"
      >
        <FloorPlan mode="confirm" />
      </motion.div>

      {/* Right: Confirm panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-[2] min-h-0"
      >
        <ConfirmPanel />
      </motion.div>
    </div>
  );
}