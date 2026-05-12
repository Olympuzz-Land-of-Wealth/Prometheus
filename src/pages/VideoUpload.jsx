import { useState, useCallback } from 'react';
import { Upload, FileVideo, CheckCircle2 } from 'lucide-react';
import ProgressPipeline from '../components/upload/ProgressPipeline';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_MESSAGES = {
  1: 'Waiting for video upload...',
  2: 'Step 2: Blurring faces for privacy...',
  3: 'Step 3: Running machine detection model...',
  4: 'Step 4: Awaiting owner confirmation...',
  5: 'All done — your gym is live!',
};

export default function VideoUpload() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);

  const simulateUpload = useCallback((name) => {
    setFileName(name);
    setCurrentStep(2);
    setTimeout(() => setCurrentStep(3), 2500);
    setTimeout(() => setCurrentStep(4), 5000);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) simulateUpload(file.name);
  }, [simulateUpload]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) simulateUpload(file.name);
  }, [simulateUpload]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-prometheus-bg font-inter">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Upload card */}
        <div className="bg-prometheus-card border border-prometheus-border rounded-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-prometheus-cream text-xl font-semibold">Upload Gym Footage</h2>
            <p className="text-prometheus-secondary text-[13px] mt-1">
              Upload a video file to begin AI-powered machine detection
            </p>
          </div>

          {/* Drop zone */}
          <label
            className={`block cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200 p-12 text-center ${
              isDragging
                ? 'border-prometheus-green bg-prometheus-green/[0.03]'
                : fileName
                ? 'border-prometheus-green/30 bg-prometheus-green/[0.02]'
                : 'border-prometheus-border hover:border-prometheus-hover'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <AnimatePresence mode="wait">
              {!fileName ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-prometheus-elevated flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-prometheus-secondary" />
                  </div>
                  <p className="text-prometheus-cream text-[14px] font-medium">
                    Drop video file or click to browse
                  </p>
                  <p className="text-prometheus-secondary text-[12px] mt-1">
                    Supports MP4, MOV, AVI up to 2GB
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="uploaded"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-prometheus-green/10 flex items-center justify-center mb-4">
                    <FileVideo className="w-6 h-6 text-prometheus-green" />
                  </div>
                  <p className="text-prometheus-cream text-[14px] font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-prometheus-green" />
                    {fileName}
                  </p>
                  <p className="text-prometheus-secondary text-[12px] mt-1">Processing in progress...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </label>
        </div>

        {/* Pipeline */}
        <div className="mt-8">
          <ProgressPipeline currentStep={currentStep} />
        </div>

        {/* Status message */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 text-center"
        >
          <p className="text-prometheus-secondary text-[13px]">
            {STATUS_MESSAGES[currentStep]}
          </p>
          {currentStep > 1 && currentStep < 5 && (
            <div className="mt-3 flex justify-center">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-prometheus-green"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}