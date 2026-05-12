import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';

import AppLayout from './components/layout/AppLayout';
import VideoUpload from './pages/VideoUpload';
import MachineConfirm from './pages/MachineConfirm';
import LiveDashboard from './pages/LiveDashboard';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<VideoUpload />} />
              <Route path="/confirm" element={<MachineConfirm />} />
              <Route path="/dashboard" element={<LiveDashboard />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
