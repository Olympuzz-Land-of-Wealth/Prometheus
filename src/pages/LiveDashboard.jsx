import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TopBar from '../components/dashboard/TopBar';
import FloorPlan from '../components/floorplan/FloorPlan';
import MachineCardList from '../components/dashboard/MachineCardList';

const LIVE_MACHINES = [
  { id: 1, name: 'Treadmill 01', x: 8, y: 10, w: 18, h: 22, status: 'free', time: '1m 10s', confidence: 94, camera: 'Camera A — North' },
  { id: 2, name: 'Treadmill 02', x: 30, y: 10, w: 18, h: 22, status: 'occupied', time: '4m 32s', confidence: 91, camera: 'Camera A — North' },
  { id: 3, name: 'Leg Press 01', x: 55, y: 8, w: 20, h: 18, status: 'free', time: '8m 05s', confidence: 78, camera: 'Camera B — East' },
  { id: 4, name: 'Bench Press 01', x: 8, y: 48, w: 22, h: 20, status: 'occupied', time: '12m 17s', confidence: 96, camera: 'Camera A — North' },
  { id: 5, name: 'Cable Machine 01', x: 55, y: 42, w: 22, h: 24, status: 'occupied', time: '2m 45s', confidence: 87, camera: 'Camera C — South' },
  { id: 6, name: 'Rowing Machine 01', x: 30, y: 55, w: 20, h: 22, status: 'free', time: '5m 22s', confidence: 88, camera: 'Camera B — East' },
  { id: 7, name: 'Smith Machine 01', x: 80, y: 10, w: 16, h: 20, status: 'occupied', time: '7m 03s', confidence: 92, camera: 'Camera D — West' },
  { id: 8, name: 'Lat Pulldown 01', x: 80, y: 42, w: 16, h: 18, status: 'free', time: '0m 45s', confidence: 85, camera: 'Camera D — West' },
  { id: 9, name: 'Hack Squat 01', x: 8, y: 76, w: 18, h: 18, status: 'occupied', time: '15m 40s', confidence: 93, camera: 'Camera C — South' },
  { id: 10, name: 'Preacher Curl 01', x: 30, y: 80, w: 16, h: 14, status: 'free', time: '3m 18s', confidence: 79, camera: 'Camera C — South' },
  { id: 11, name: 'Chest Fly 01', x: 55, y: 72, w: 20, h: 18, status: 'occupied', time: '6m 55s', confidence: 90, camera: 'Camera B — East' },
  { id: 12, name: 'Leg Curl 01', x: 80, y: 68, w: 16, h: 16, status: 'free', time: '2m 00s', confidence: 82, camera: 'Camera D — West' },
];

export default function LiveDashboard() {
  const [machines, setMachines] = useState(LIVE_MACHINES);
  const freeCount = machines.filter((m) => m.status === 'free').length;
  const totalCount = machines.length;

  // Simulate live status toggling
  useEffect(() => {
    const interval = setInterval(() => {
      setMachines((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        return prev.map((m, i) =>
          i === idx
            ? {
                ...m,
                status: m.status === 'free' ? 'occupied' : 'free',
                time: '0m 01s',
              }
            : m
        );
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-prometheus-bg font-inter">
      <TopBar freeCount={freeCount} totalCount={totalCount} />

      <div className="flex-1 flex p-4 gap-4 min-h-0">
        {/* Floor plan */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-[55] min-h-0"
        >
          <FloorPlan mode="live" machines={machines} />
        </motion.div>

        {/* Machine list */}
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