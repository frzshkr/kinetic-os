import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Sparkles, CheckCircle2, ArrowRight, RefreshCw, Zap, Beef, Wheat, Droplets } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';

interface FoodScanResult {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  confidence: string;
  summary: string;
}

interface FoodScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogMeal: (data: { protein: number; calories: number; carbs: number; fat: number; name: string }) => void;
  geminiApiKey?: string;
}

export const FoodScannerModal: React.FC<FoodScannerModalProps> = ({
  isOpen,
  onClose,
  onLogMeal,
  geminiApiKey,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file.');
      return;
    }

    setErrorMessage(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      sound.playClick();
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    sound.playStart();

    try {
      const res = await fetch('/api/ai/food-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          context: { userSettings: { geminiApiKey } },
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setResult(data.analysis);
        sound.playCelebration();
      } else {
        setErrorMessage(data.error || 'Failed to extract nutritional data.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Vision network request failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmLog = () => {
    if (!result) return;
    onLogMeal({
      protein: result.protein,
      calories: result.calories,
      carbs: result.carbs,
      fat: result.fat,
      name: result.mealName,
    });
    confetti({
      particleCount: 50,
      spread: 60,
      colors: ['#E8F84A', '#10B981', '#000000'],
    });
    sound.playMilestone();
    onClose();
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        
        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-black/[0.08] my-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-black text-[#E8F84A] flex items-center justify-center font-black shadow-xs">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-950 font-['Outfit'] uppercase">
                    AI Food Vision
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#E8F84A] text-slate-950 text-[9px] font-mono font-black border border-black/10">
                    CALORIE & MACRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Snap or upload your meal to extract nutrition
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Main Area: Image capture / Preview */}
          {!selectedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-black/15 rounded-3xl bg-[#FAF8F5] hover:bg-[#F5F2EB] transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-2xl bg-black text-[#E8F84A] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                Snap or Upload Meal Photo
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Tap to use phone camera or choose a photo from your gallery
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-black/[0.08] text-xs font-bold text-slate-800 shadow-xs">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Select Photo</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Photo Preview Container */}
              <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-black/10 shadow-inner">
                <img
                  src={selectedImage}
                  alt="Meal Preview"
                  className="w-full h-full object-cover"
                />

                {/* Laser Scanning Animation Bar */}
                {isAnalyzing && (
                  <motion.div
                    animate={{ y: [-110, 110, -110] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#E8F84A] to-transparent shadow-[0_0_15px_#E8F84A]"
                  />
                )}

                {/* Reset button badge */}
                {!isAnalyzing && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute top-3 right-3 px-2.5 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-[11px] font-bold backdrop-blur-md transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retake</span>
                  </button>
                )}
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Action Button: Analyze */}
              {!result && (
                <motion.button
                  type="button"
                  disabled={isAnalyzing}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  className="w-full py-3.5 rounded-2xl bg-black text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-md disabled:opacity-70"
                >
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 text-[#E8F84A] animate-spin" />
                      <span>Scanning Nutrition & Macros...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#E8F84A]" />
                      <span>Analyze Meal Nutrition</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              )}

              {/* Nutritional Results Card */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.08] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        DETECTED MEAL
                      </span>
                      <h4 className="text-base font-black text-slate-950 font-['Outfit']">
                        {result.mealName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {result.portion}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        CALORIES
                      </span>
                      <p className="text-xl font-black font-mono text-slate-950">
                        {result.calories} <span className="text-xs text-rose-600 font-bold">KCAL</span>
                      </p>
                    </div>
                  </div>

                  {/* 3 Macro Badges */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-white border border-black/[0.05] text-center shadow-2xs">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 mb-0.5">
                        <Beef className="w-3 h-3 text-emerald-600" />
                        <span>PROTEIN</span>
                      </div>
                      <p className="text-sm font-black font-mono text-emerald-600">
                        {result.protein}g
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-black/[0.05] text-center shadow-2xs">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 mb-0.5">
                        <Wheat className="w-3 h-3 text-amber-600" />
                        <span>CARBS</span>
                      </div>
                      <p className="text-sm font-black font-mono text-amber-600">
                        {result.carbs}g
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-black/[0.05] text-center shadow-2xs">
                      <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 mb-0.5">
                        <Droplets className="w-3 h-3 text-rose-500" />
                        <span>FAT</span>
                      </div>
                      <p className="text-sm font-black font-mono text-rose-600">
                        {result.fat}g
                      </p>
                    </div>
                  </div>

                  {/* Sports Nutrition Summary */}
                  {result.summary && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-black/[0.04] leading-relaxed">
                      💡 {result.summary}
                    </p>
                  )}

                  {/* Confirm & Log Button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmLog}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-950 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#E8F84A]" />
                    <span>Log to Fuel Tracker (+{result.protein}g Protein)</span>
                  </motion.button>
                </motion.div>
              )}
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
