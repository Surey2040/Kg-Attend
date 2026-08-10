import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { X, Camera, Upload, AlertTriangle, CheckCircle2, ScanFace, ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { verifyHeadcountImage } from '../services/api';

export default function YoloHeadcountModal({ isOpen, onClose, sessionId, qrCount = 0 }) {
  const [step, setStep] = useState('capture'); // 'capture', 'processing', 'result'
  const [error, setError] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const [result, setResult] = useState(null);
  
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setStep('capture');
    setError('');
    setResult(null);
  };

  const handleClose = () => {
    resetState();
    setUseCamera(false);
    onClose();
  };

  // Process the image file via API
  const processImage = async (file) => {
    try {
      setStep('processing');
      setError('');
      
      const res = await verifyHeadcountImage(sessionId, file);
      
      if (res.success) {
        setResult({
          aiHeadcount: res.aiHeadcount,
          annotatedImage: res.annotatedImage
        });
        setStep('result');
      } else {
        throw new Error(res.error || 'Failed to process image');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error communicating with AI engine. Ensure Python AI Engine is running.');
      setStep('capture');
    }
  };

  // Convert base64 from webcam to File object
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const file = dataURLtoFile(imageSrc, 'capture.jpg');
      processImage(file);
    }
  }, [webcamRef]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const renderDiscrepancy = () => {
    if (!result) return null;
    const { aiHeadcount } = result;
    
    if (aiHeadcount === qrCount) {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-emerald-400 font-bold text-sm">Perfect Match!</h4>
            <p className="text-emerald-300/80 text-xs mt-1 leading-relaxed">
              Visual headcount exactly matches the number of QR scans. No proxy attendance detected.
            </p>
          </div>
        </div>
      );
    }
    
    if (qrCount > aiHeadcount) {
      const diff = qrCount - aiHeadcount;
      return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-red-400 font-bold text-sm">🚨 DISCREPANCY DETECTED: Proxy Alert</h4>
            <p className="text-red-300/80 text-xs mt-1 leading-relaxed">
              There are {diff} extra QR scans compared to physical bodies in the room. This indicates potential proxy attendance!
            </p>
          </div>
        </div>
      );
    }
    
    if (aiHeadcount > qrCount) {
      const diff = aiHeadcount - qrCount;
      return (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-amber-400 font-bold text-sm">Missing Scans</h4>
            <p className="text-amber-300/80 text-xs mt-1 leading-relaxed">
              {diff} student(s) visible in the classroom haven't scanned the QR code yet. Remind them to mark attendance!
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#09090b] border border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <ScanFace size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">YOLOv8 Headcount Verification</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Cross-verify physical attendance with QR scans</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col">
              
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {step === 'capture' && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6">
                  
                  {useCamera ? (
                    <div className="w-full relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video flex items-center justify-center">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "environment" }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/50 rounded-2xl m-4 opacity-50 border-dashed" />
                    </div>
                  ) : (
                    <div className="w-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                      <ScanFace size={48} className="text-slate-500 mb-4 opacity-50" />
                      <p className="text-slate-400 text-sm max-w-sm text-center mb-6">
                        Capture or upload a wide photo of the classroom. Our YOLOv8 ML model will automatically detect and count all students.
                      </p>
                      <div className="flex flex-wrap gap-4 justify-center">
                        <button
                          onClick={() => setUseCamera(true)}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                        >
                          <Camera size={18} /> Open Camera
                        </button>
                        
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
                        >
                          <ImageIcon size={18} /> Upload Photo
                        </button>
                      </div>
                    </div>
                  )}

                  {useCamera && (
                    <div className="flex gap-4 w-full">
                      <button
                        onClick={() => setUseCamera(false)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold text-sm transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={capture}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                      >
                        <Camera size={18} /> Take Photo
                      </button>
                    </div>
                  )}

                </div>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center flex-1 py-20 gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-indigo-500/30 rounded-full animate-spin border-t-indigo-500" />
                    <ScanFace className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1">AI Engine Processing</h3>
                    <p className="text-sm text-slate-400">Running YOLOv8 inference to detect students...</p>
                  </div>
                </div>
              )}

              {step === 'result' && result && (
                <div className="flex flex-col gap-6">
                  
                  {/* Results Summary Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Visual Count (YOLO)</p>
                      <p className="text-4xl font-black text-indigo-400">{result.aiHeadcount}</p>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">QR Scans</p>
                      <p className="text-4xl font-black text-slate-200">{qrCount}</p>
                    </div>
                  </div>

                  {/* Discrepancy Banner */}
                  {renderDiscrepancy()}

                  {/* Annotated Image */}
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <ScanFace size={16} className="text-indigo-400" /> YOLO Bounding Boxes
                    </p>
                    <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-black">
                      <img src={result.annotatedImage} alt="YOLO Inference Result" className="w-full h-auto object-contain max-h-[300px]" />
                    </div>
                  </div>

                  <button
                    onClick={resetState}
                    className="mt-2 w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} /> Verify Again
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
