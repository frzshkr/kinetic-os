import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ActiveTab,
  FastingState,
  UserSettings,
  BriskwalkSession,
  GeoPoint,
  DailyHealthLog,
  AuthUser,
  ActivityType,
  WorkoutGoal,
} from './types';
import { storage, DEFAULT_SETTINGS, DEFAULT_FASTING_STATE } from './utils/storage';
import { dbService } from './services/dbService';
import { authService } from './services/authService';
import { sound } from './utils/audio';
import { voice } from './utils/speech';
import {
  calculateHaversineDistance,
  calculateWalkCalories,
  estimateSteps,
  formatPace,
  formatDuration,
  formatDistanceKm,
} from './utils/geo';
import { Play, Footprints } from 'lucide-react';

// Components
import { Header } from './components/common/Header';
import { NavigationBar } from './components/common/NavigationBar';
import { AuthView } from './components/auth/AuthView';
import { FastingRing } from './components/fasting/FastingRing';
import { FastingStages } from './components/fasting/FastingStages';
import { FastingControls } from './components/fasting/FastingControls';
import { WaterTracker } from './components/fasting/WaterTracker';
import { FastingHistory } from './components/fasting/FastingHistory';

import { BriskwalkHUD } from './components/briskwalk/BriskwalkHUD';
import { LiveTrackerMap } from './components/briskwalk/LiveTrackerMap';
import { WorkoutControls } from './components/briskwalk/WorkoutControls';
import { WorkoutHistory } from './components/briskwalk/WorkoutHistory';
import { ActivityTypeSelector } from './components/briskwalk/ActivityTypeSelector';
import { WorkoutSetupForm } from './components/briskwalk/WorkoutSetupForm';

import { ReadinessView } from './components/health/ReadinessView';
import { SummaryView } from './components/analytics/SummaryView';
import { AICoachChat } from './components/assistant/AICoachChat';
import { SettingsModal } from './components/settings/SettingsModal';
import { BiometricConsultationModal } from './components/consultation/BiometricConsultationModal';

const DEFAULT_HEALTH_LOG: DailyHealthLog = {
  date: new Date().toISOString().slice(0, 10),
  sleepHours: 7.0,
  sleepQuality: 80,
  readinessScore: 78,
  weightKg: 70.0,
  waterMl: 0,
  proteinGrams: 0,
  proteinTargetGrams: 140,
  carbsGrams: 0,
  fatGrams: 0,
  habits: {
    morningSun: false,
    electrolytes: false,
    stepsTarget: false,
    preBedBuffer: false,
  },
};

export const App: React.FC = () => {
  // Navigation & User Auth State
  const [activeTab, setActiveTab] = useState<ActiveTab>('fasting');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !authService.isAuthenticated());

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);

  // Fasting State
  const [fastingState, setFastingState] = useState<FastingState>(DEFAULT_FASTING_STATE);

  // Briskwalk State
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('brisk_walk');
  const [isWalkTracking, setIsWalkTracking] = useState<boolean>(false);
  const [isWalkPaused, setIsWalkPaused] = useState<boolean>(false);
  const [activeWalkSession, setActiveWalkSession] = useState<BriskwalkSession | null>(null);
  const [walkHistory, setWalkHistory] = useState<BriskwalkSession[]>([]);
  const [moveSubTab, setMoveSubTab] = useState<'cockpit' | 'history'>('cockpit');
  const [inWorkoutViewMode, setInWorkoutViewMode] = useState<'hud' | 'map' | 'split'>('hud');

  // Daily Health & Readiness State
  const [healthLog, setHealthLog] = useState<DailyHealthLog>(DEFAULT_HEALTH_LOG);

  // Watch Position Ref
  const geoWatchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<GeoPoint | null>(null);

  // Helper to load user telemetry from SQLite
  const loadUserTelemetry = (user: AuthUser | null) => {
    dbService.fetchAllData().then((dbData) => {
      if (dbData) {
        if (dbData.settings) {
          setSettings((prev) => ({
            ...prev,
            ...dbData.settings,
            userName: user?.displayName || user?.username || dbData.settings?.userName || prev.userName,
          }));
        } else if (user) {
          setSettings((prev) => ({
            ...prev,
            userName: user.displayName || user.username,
          }));
        }
        setFastingState((prev) => ({ ...prev, history: dbData.fasts || [] }));
        setWalkHistory(dbData.walks || []);
        if (dbData.healthLogs && dbData.healthLogs.length > 0) {
          setHealthLog(dbData.healthLogs[0]);
        }
      }
    });
  };

  const handleAuthSuccess = (user: AuthUser, isNewRegistration?: boolean) => {
    setCurrentUser(user);
    loadUserTelemetry(user);
    if (isNewRegistration) {
      setIsConsultationOpen(true);
    }
  };

  const handleApplyConsultationPlan = (plan: {
    weightKg: number;
    heightCm: number;
    goal: any;
    idealWeightMinKg: number;
    idealWeightMaxKg: number;
    targetProteinGrams: number;
    targetWaterMl: number;
    targetCaloriesKcal: number;
    targetPaceMinPerKm: number;
    recommendedProtocol: string;
  }) => {
    const updatedSettings: UserSettings = {
      ...settings,
      weightKg: plan.weightKg,
      heightCm: plan.heightCm,
      targetPaceMinPerKm: plan.targetPaceMinPerKm,
      preferredFastingProtocol: (plan.recommendedProtocol as any) || settings.preferredFastingProtocol,
    };
    setSettings(updatedSettings);
    storage.saveSettings(updatedSettings);
    dbService.saveSettings(updatedSettings);

    const updatedHealth: DailyHealthLog = {
      ...healthLog,
      weightKg: plan.weightKg,
      proteinTargetGrams: plan.targetProteinGrams,
    };
    setHealthLog(updatedHealth);
    dbService.saveHealthLog(updatedHealth);

    const updatedFasting: FastingState = {
      ...fastingState,
      waterGoalMl: plan.targetWaterMl,
      selectedProtocol: (plan.recommendedProtocol as any) || fastingState.selectedProtocol,
    };
    setFastingState(updatedFasting);
    storage.saveFastingState(updatedFasting);

    sound.playCelebration();
    setIsConsultationOpen(false);
  };

  const handleGuestExplore = () => {
    const guestUser: AuthUser = {
      id: 'guest_user',
      username: 'guest',
      displayName: 'Guest User',
    };
    setCurrentUser(guestUser);
    sound.playClick();
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setFastingState(DEFAULT_FASTING_STATE);
    setWalkHistory([]);
    setHealthLog(DEFAULT_HEALTH_LOG);
  };

  // 1. Initial Load from SQLite Database & LocalStorage fallback
  useEffect(() => {
    // Local storage fallback first
    const loadedSettings = storage.getSettings();
    if (currentUser) {
      loadedSettings.userName = currentUser.displayName || currentUser.username;
    }
    setSettings(loadedSettings);
    sound.setMuted(!loadedSettings.soundEnabled);
    voice.setEnabled(loadedSettings.voiceGuidanceEnabled);
    voice.setLanguage(loadedSettings.voiceLanguage || 'en-US');

    const loadedFasting = storage.getFastingState();
    setFastingState(loadedFasting);

    const loadedWalkHistory = storage.getWalkHistory();
    setWalkHistory(loadedWalkHistory);

    // Fetch live from SQLite Database for this user
    loadUserTelemetry(currentUser);

    // Verify token validity with backend if logged in
    if (currentUser) {
      authService.fetchCurrentUser().then((freshUser) => {
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      });
    }
  }, []);

  // 2. Global GPS Watcher
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GeoPoint = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        };

        setCurrentLocation(point);
        lastLocationRef.current = point;
      },
      (err) => {
        console.warn('GPS location tracking error:', err.message);
        if (!currentLocation) {
          setCurrentLocation({
            latitude: 3.1578,
            longitude: 101.7119,
            accuracy: 10,
            timestamp: Date.now(),
          });
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, []);

  // 3. Briskwalk GPS Tracking & Telemetry Accumulator
  useEffect(() => {
    if (!isWalkTracking || isWalkPaused || !currentLocation) return;

    setActiveWalkSession((prev) => {
      if (!prev) return null;

      const path = [...prev.path];
      const lastPoint = path[path.length - 1];

      let addedDistance = 0;
      let newPace = prev.currentPaceSecondsPerKm;
      let newSpeed = prev.currentSpeedKmh;

      if (lastPoint) {
        const delta = calculateHaversineDistance(
          lastPoint.latitude,
          lastPoint.longitude,
          currentLocation.latitude,
          currentLocation.longitude
        );

        if (delta >= 3 && currentLocation.accuracy <= 35) {
          addedDistance = delta;
          path.push(currentLocation);

          const timeDeltaSecs = Math.max(1, (currentLocation.timestamp - lastPoint.timestamp) / 1000);
          newSpeed = (delta / timeDeltaSecs) * 3.6;

          if (delta > 0 && timeDeltaSecs > 0) {
            newPace = (timeDeltaSecs / delta) * 1000;
          }
        }
      } else {
        path.push(currentLocation);
      }

      const totalDistance = prev.distanceMeters + addedDistance;
      const totalDuration = prev.durationSeconds + 1;
      const avgPace = totalDistance > 20 ? (totalDuration / totalDistance) * 1000 : 0;
      const calories = calculateWalkCalories(settings.weightKg, totalDuration, totalDistance, prev.activityType || selectedActivity);
      const steps = estimateSteps(totalDistance, prev.activityType || selectedActivity);

      const splits = [...prev.splits];
      const currentKmMark = Math.floor(totalDistance / 1000);
      if (currentKmMark > splits.length && currentKmMark > 0) {
        sound.playMilestone();
        voice.speak(`Kilometer ${currentKmMark} complete!`);
        splits.push({
          kilometer: currentKmMark,
          durationSeconds: totalDuration,
          paceSecondsPerKm: avgPace,
        });
      }

      return {
        ...prev,
        durationSeconds: totalDuration,
        distanceMeters: totalDistance,
        currentPaceSecondsPerKm: newPace,
        avgPaceSecondsPerKm: avgPace,
        currentSpeedKmh: newSpeed,
        caloriesBurned: calories,
        estimatedSteps: steps,
        path,
        splits,
      };
    });
  }, [currentLocation]);

  // Briskwalk second ticker
  useEffect(() => {
    let timer: any = null;
    if (isWalkTracking && !isWalkPaused) {
      timer = setInterval(() => {
        setActiveWalkSession((prev) => {
          if (!prev) return null;
          const totalDuration = prev.durationSeconds + 1;
          const calories = calculateWalkCalories(
            settings.weightKg,
            totalDuration,
            prev.distanceMeters,
            prev.activityType || selectedActivity
          );
          return {
            ...prev,
            durationSeconds: totalDuration,
            caloriesBurned: calories,
          };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isWalkTracking, isWalkPaused, settings.weightKg]);

  // Fasting Handlers
  const handleStartFast = () => {
    const targetHours =
      fastingState.selectedProtocol === 'custom'
        ? fastingState.customHours
        : parseInt(fastingState.selectedProtocol.split('-')[0]) || 16;

    const newFast = {
      id: `fast_${Date.now()}`,
      startTime: Date.now(),
      targetDurationHours: targetHours,
      protocolId: fastingState.selectedProtocol,
      completed: false,
      waterIntakeMl: 0,
    };

    const updated: FastingState = {
      ...fastingState,
      isActive: true,
      currentFast: newFast,
    };

    setFastingState(updated);
    storage.saveFastingState(updated);
    dbService.syncFast(newFast);
  };

  const handleEndFast = (mood: 'great' | 'good' | 'neutral' | 'struggling') => {
    if (!fastingState.currentFast) return;

    const elapsedHours = (Date.now() - fastingState.currentFast.startTime) / (1000 * 3600);
    const completed = elapsedHours >= fastingState.currentFast.targetDurationHours;

    const finishedRecord = {
      ...fastingState.currentFast,
      endTime: Date.now(),
      completed,
      mood,
    };

    const history = [finishedRecord, ...fastingState.history];
    const updated: FastingState = {
      ...fastingState,
      isActive: false,
      currentFast: null,
      history,
    };

    setFastingState(updated);
    storage.saveFastingState(updated);
    dbService.syncFast(finishedRecord);
  };

  const handleAdjustStartTime = (newStartTime: number) => {
    if (!fastingState.currentFast) return;
    const updated: FastingState = {
      ...fastingState,
      currentFast: {
        ...fastingState.currentFast,
        startTime: newStartTime,
      },
    };
    setFastingState(updated);
    storage.saveFastingState(updated);
  };

  const handleWaterUpdate = (amount: number) => {
    const newAmount = Math.max(0, fastingState.waterIntakeTodayMl + amount);
    const updated: FastingState = {
      ...fastingState,
      waterIntakeTodayMl: newAmount,
    };
    setFastingState(updated);
    storage.saveFastingState(updated);
  };

  const handleWaterReset = () => {
    const updated: FastingState = {
      ...fastingState,
      waterIntakeTodayMl: 0,
    };
    setFastingState(updated);
    storage.saveFastingState(updated);
  };

  // Briskwalk Handlers
  const handleStartWalk = (goal?: WorkoutGoal) => {
    const newSession: BriskwalkSession = {
      id: `walk_${Date.now()}`,
      activityType: selectedActivity,
      targetGoal: goal,
      startTime: Date.now(),
      durationSeconds: 0,
      distanceMeters: 0,
      avgPaceSecondsPerKm: 0,
      currentPaceSecondsPerKm: 0,
      currentSpeedKmh: 0,
      maxSpeedKmh: 0,
      caloriesBurned: 0,
      estimatedSteps: 0,
      path: currentLocation ? [currentLocation] : [],
      splits: [],
      isPaused: false,
    };

    setActiveWalkSession(newSession);
    setIsWalkTracking(true);
    setIsWalkPaused(false);
    setMoveSubTab('cockpit');
  };

  const handlePauseWalk = () => {
    setIsWalkPaused(true);
  };

  const handleResumeWalk = () => {
    setIsWalkPaused(false);
  };

  const handleStopWalk = () => {
    if (activeWalkSession && activeWalkSession.distanceMeters > 30) {
      const finished = { ...activeWalkSession, endTime: Date.now() };
      storage.addWalkSession(finished);
      setWalkHistory(storage.getWalkHistory());
      dbService.syncWalk(finished);
    }
    setIsWalkTracking(false);
    setIsWalkPaused(false);
  };

  // Health & Readiness Handler
  const handleUpdateHealthLog = (updated: DailyHealthLog) => {
    setHealthLog(updated);
    dbService.syncHealthLog(updated);
  };

  const handleSaveSettings = (updated: UserSettings) => {
    setSettings(updated);
    storage.saveSettings(updated);
    dbService.syncSettings(updated);
    sound.setMuted(!updated.soundEnabled);
    voice.setEnabled(updated.voiceGuidanceEnabled);
    voice.setLanguage(updated.voiceLanguage);
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    handleSaveSettings(updated);
  };

  const fastingElapsedHours =
    fastingState.isActive && fastingState.currentFast
      ? (Date.now() - fastingState.currentFast.startTime) / (1000 * 3600)
      : 0;

  const currentFastingTargetHours =
    fastingState.selectedProtocol === 'custom'
      ? fastingState.customHours
      : parseInt(fastingState.selectedProtocol.split('-')[0]) || 16;

  // If user is not authenticated, render luxury full-page editorial auth experience
  if (!currentUser) {
    return (
      <AuthView
        onSuccess={handleAuthSuccess}
        onGuestExplore={handleGuestExplore}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-slate-900 flex flex-col font-['Outfit'] pb-28 selection:bg-[#E8F84A] selection:text-black">
      {/* Dynamic Island Header */}
      <Header
        fastingState={fastingState}
        userSettings={settings}
        activeTab={activeTab}
        isWalkActive={isWalkTracking && !isWalkPaused}
        currentUser={currentUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSound={handleToggleSound}
        onOpenAuth={handleLogout}
        onLogout={handleLogout}
        onOpenConsultation={() => setIsConsultationOpen(true)}
      />

      {/* Guest Mode Distinction Banner */}
      {currentUser.id === 'guest_user' && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-mono font-bold flex items-center justify-between shadow-xs sticky top-16 z-30">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-black animate-ping shrink-0" />
            <span className="truncate">⚡ GUEST PREVIEW • Records are temporary. Create your vault to save your PRs.</span>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-black text-[#E8F84A] text-[11px] font-black uppercase hover:bg-slate-900 transition-colors ml-2"
          >
            Create Vault
          </button>
        </div>
      )}

      {/* Main Viewport with Page Transitions */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pt-5 pb-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: FASTING */}
          {activeTab === 'fasting' && (
            <motion.div
              key="fasting-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="space-y-4"
            >
              <FastingRing
                currentFast={fastingState.currentFast}
                targetHours={currentFastingTargetHours}
              />

              <FastingControls
                isActive={fastingState.isActive}
                selectedProtocol={fastingState.selectedProtocol}
                targetHours={currentFastingTargetHours}
                onSelectProtocol={(protoId) => {
                  const updated: FastingState = { ...fastingState, selectedProtocol: protoId };
                  setFastingState(updated);
                  storage.saveFastingState(updated);
                }}
                onStartFast={handleStartFast}
                onEndFast={handleEndFast}
                onAdjustStartTime={handleAdjustStartTime}
                currentStartTime={fastingState.currentFast?.startTime}
              />

              <WaterTracker
                currentMl={fastingState.waterIntakeTodayMl}
                goalMl={fastingState.waterGoalMl}
                onUpdate={handleWaterUpdate}
                onReset={handleWaterReset}
              />

              <FastingStages elapsedHours={fastingElapsedHours} />

              <FastingHistory history={fastingState.history} />
            </motion.div>
          )}

          {/* TAB 2: MOVE (RUNNING, BRISK WALK & WORKOUT COCKPIT) */}
          {activeTab === 'briskwalk' && (
            <motion.div
              key="briskwalk-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="space-y-4 font-['Outfit']"
            >
              {/* Layer Header Sub-navigation: Cockpit vs History */}
              <div className="flex items-center justify-between p-1 rounded-2xl bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-2xs">
                <button
                  onClick={() => {
                    sound.playClick();
                    setMoveSubTab('cockpit');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
                    moveSubTab === 'cockpit'
                      ? 'bg-black text-[#E8F84A] shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isWalkTracking ? 'Active Cockpit' : 'Workout Setup'}</span>
                  {isWalkTracking && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setMoveSubTab('history');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
                    moveSubTab === 'history'
                      ? 'bg-black text-[#E8F84A] shadow-xs'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>History ({walkHistory.length})</span>
                </button>
              </div>

              {/* LAYER CONTENT */}
              <AnimatePresence mode="wait">
                {moveSubTab === 'history' ? (
                  <motion.div
                    key="history-layer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WorkoutHistory history={walkHistory} />
                  </motion.div>
                ) : !isWalkTracking ? (
                  /* LAYER 1: PRE-WORKOUT SETUP FORM */
                  <motion.div
                    key="setup-layer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WorkoutSetupForm
                      selectedActivity={selectedActivity}
                      onSelectActivity={(act) => setSelectedActivity(act)}
                      userSettings={settings}
                      currentLocation={currentLocation}
                      onStartWorkout={handleStartWalk}
                      lastSessionSummary={
                        walkHistory.length > 0
                          ? {
                              distanceKm: formatDistanceKm(walkHistory[0].distanceMeters),
                              paceStr: formatPace(walkHistory[0].avgPaceSecondsPerKm),
                              durationStr: formatDuration(walkHistory[0].durationSeconds),
                            }
                          : null
                      }
                    />
                  </motion.div>
                ) : (
                  /* LAYER 2: IN-WORKOUT LIVE COCKPIT */
                  <motion.div
                    key="live-cockpit-layer"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3.5"
                  >
                    {/* View Switcher: HUD vs Map vs Split */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-xs font-mono font-black text-slate-800 uppercase">
                          {selectedActivity.replace('_', ' ')} • LIVE GPS
                        </span>
                      </div>

                      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/80 border border-black/[0.06]">
                        <button
                          onClick={() => {
                            sound.playClick();
                            setInWorkoutViewMode('hud');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                            inWorkoutViewMode === 'hud'
                              ? 'bg-black text-[#E8F84A]'
                              : 'text-slate-600 hover:text-black'
                          }`}
                        >
                          HUD
                        </button>
                        <button
                          onClick={() => {
                            sound.playClick();
                            setInWorkoutViewMode('map');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                            inWorkoutViewMode === 'map'
                              ? 'bg-black text-[#E8F84A]'
                              : 'text-slate-600 hover:text-black'
                          }`}
                        >
                          Map
                        </button>
                        <button
                          onClick={() => {
                            sound.playClick();
                            setInWorkoutViewMode('split');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                            inWorkoutViewMode === 'split'
                              ? 'bg-black text-[#E8F84A]'
                              : 'text-slate-600 hover:text-black'
                          }`}
                        >
                          Split
                        </button>
                      </div>
                    </div>

                    {/* HUD Telemetry View */}
                    {(inWorkoutViewMode === 'hud' || inWorkoutViewMode === 'split') && (
                      <BriskwalkHUD
                        session={activeWalkSession}
                        userSettings={settings}
                        activityType={selectedActivity}
                      />
                    )}

                    {/* Radar Map View */}
                    {(inWorkoutViewMode === 'map' || inWorkoutViewMode === 'split') && (
                      <LiveTrackerMap
                        currentLocation={currentLocation}
                        path={activeWalkSession?.path || []}
                        isTracking={isWalkTracking && !isWalkPaused}
                        onCenterMap={() => {}}
                      />
                    )}

                    {/* Workout Action Controls */}
                    <WorkoutControls
                      isTracking={isWalkTracking}
                      isPaused={isWalkPaused}
                      activeSession={activeWalkSession}
                      athleteName={currentUser.displayName || currentUser.username}
                      activityType={selectedActivity}
                      onStart={() => handleStartWalk()}
                      onPause={handlePauseWalk}
                      onResume={handleResumeWalk}
                      onStop={handleStopWalk}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* TAB 3: BIO-RECOVERY & NUTRITION (Replaces Waze) */}
          {activeTab === 'health' && (
            <motion.div
              key="health-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            >
              <ReadinessView
                healthLog={healthLog}
                userSettings={settings}
                fastingState={fastingState}
                recentWalks={walkHistory}
                onUpdateHealthLog={handleUpdateHealthLog}
                onOpenConsultation={() => setIsConsultationOpen(true)}
              />
            </motion.div>
          )}

          {/* TAB 4: STATS / SUMMARY (DAY, MONTH, YEAR) */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            >
              <SummaryView
                walkHistory={walkHistory}
                fastHistory={fastingState.history}
                waterTodayMl={fastingState.waterIntakeTodayMl}
                userSettings={settings}
              />
            </motion.div>
          )}

          {/* TAB 5: COACH */}
          {activeTab === 'assistant' && (
            <motion.div
              key="assistant-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            >
              <AICoachChat
                userSettings={settings}
                fastingState={fastingState}
                recentWalks={walkHistory}
                activeWalk={isWalkTracking ? activeWalkSession : null}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Navigation Bar Dock */}
      <NavigationBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isFastingActive={fastingState.isActive}
        isWalkActive={isWalkTracking && !isWalkPaused}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      {/* Biometric Sports-Science Consultation Modal */}
      <BiometricConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        onApplyPlan={handleApplyConsultationPlan}
        initialWeightKg={settings.weightKg || 67}
        initialHeightCm={settings.heightCm || 166}
      />
    </div>
  );
};

export default App;
