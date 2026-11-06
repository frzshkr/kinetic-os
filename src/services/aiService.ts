import { ChatMessage, FastingState, BriskwalkSession, UserSettings } from '../types';
import { getCurrentStage } from '../utils/metabolic';
import { formatPace, formatDistanceKm } from '../utils/geo';

export interface AIContextSnapshot {
  userSettings: UserSettings;
  fastingState: FastingState;
  recentWalks: BriskwalkSession[];
  activeWalk?: BriskwalkSession | null;
}

export const aiService = {
  buildSystemContext(ctx: AIContextSnapshot): string {
    const { userSettings, fastingState, recentWalks, activeWalk } = ctx;
    
    let fastingContext = 'Fasting: No active fast.';
    if (fastingState.isActive && fastingState.currentFast) {
      const elapsedHours = (Date.now() - fastingState.currentFast.startTime) / (1000 * 3600);
      const stage = getCurrentStage(elapsedHours);
      fastingContext = `Active Fast: ${elapsedHours.toFixed(1)}h / ${fastingState.currentFast.targetDurationHours}h target. Current metabolic stage: ${stage.name}. Hydration: ${fastingState.waterIntakeTodayMl}ml / ${fastingState.waterGoalMl}ml.`;
    }

    let walkContext = 'Walk: Idle.';
    if (activeWalk) {
      walkContext = `Active Walk: ${formatDistanceKm(activeWalk.distanceMeters)} km, pace ${formatPace(activeWalk.currentPaceSecondsPerKm)}/km, ${activeWalk.caloriesBurned} kcal burned.`;
    } else if (recentWalks.length > 0) {
      const last = recentWalks[0];
      walkContext = `Last Session: ${formatDistanceKm(last.distanceMeters)} km @ ${formatPace(last.avgPaceSecondsPerKm)}/km (${last.caloriesBurned} kcal).`;
    }

    return `You are STRIDE Coach, an elite personal health and performance advisor for Farris (${userSettings.weightKg}kg, ${userSettings.heightCm}cm, target pace ${userSettings.targetPaceMinPerKm} min/km).
Rules:
- Be concise, direct, and scientifically precise.
- No boilerplate greetings, no robotic filler, no fluff.
- Focus on actionable bioenergetics: glycogen depletion, Zone 2 aerobic pacing, autophagy timing, electrolytes, and route optimization.
User Telemetry: ${fastingContext} | ${walkContext}`;
  },

  async sendMessage(
    userText: string,
    history: ChatMessage[],
    contextSnapshot: AIContextSnapshot
  ): Promise<{ response: string; suggestions?: string[] }> {
    const systemPrompt = this.buildSystemContext(contextSnapshot);
    const apiKey = contextSnapshot.userSettings.geminiApiKey?.trim();

    if (apiKey) {
      try {
        return await this.callGeminiAPI(userText, history, systemPrompt, apiKey);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local engine:', err);
      }
    }

    try {
      const backendRes = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, history, context: contextSnapshot }),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data.response) {
          return {
            response: data.response,
            suggestions: data.suggestions || ['When does peak autophagy start?', 'Zone 2 briskwalk pace tips'],
          };
        }
      }
    } catch {}

    return this.generateAutonomousResponse(userText, contextSnapshot);
  },

  async callGeminiAPI(
    prompt: string,
    history: ChatMessage[],
    systemPrompt: string,
    apiKey: string
  ): Promise<{ response: string; suggestions?: string[] }> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

    const formattedContents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Ready. Direct, performance-focused feedback only.' }] },
      ...history.slice(-6).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      { role: 'user', parts: [{ text: prompt }] },
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: formattedContents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
      }),
    });

    if (!res.ok) throw new Error('Gemini upstream failed');
    const json = await res.json();
    const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error('No candidate');

    return {
      response: candidate,
      suggestions: ['Analyze my pacing zone', 'Electrolyte timing during fast', 'Optimize fasting window'],
    };
  },

  generateAutonomousResponse(
    prompt: string,
    ctx: AIContextSnapshot
  ): { response: string; suggestions: string[] } {
    const text = prompt.toLowerCase();
    const { fastingState, activeWalk, recentWalks, userSettings } = ctx;

    let elapsedHours = 0;
    if (fastingState.isActive && fastingState.currentFast) {
      elapsedHours = (Date.now() - fastingState.currentFast.startTime) / (1000 * 3600);
    }

    if (text.includes('fast') || text.includes('autophagy') || text.includes('ketosis') || text.includes('hunger')) {
      if (fastingState.isActive) {
        const stage = getCurrentStage(elapsedHours);
        const remHours = Math.max(0, (fastingState.currentFast?.targetDurationHours || 16) - elapsedHours);

        return {
          response: `**Current Status: ${elapsedHours.toFixed(1)}h Fasted**
You are in **${stage.name}**.

- **Mechanism:** ${stage.scientificBenefit}
- **Remaining Target:** ${remHours.toFixed(1)} hours to reach your ${fastingState.selectedProtocol} goal.
- **Hydration:** ${fastingState.waterIntakeTodayMl}ml / ${fastingState.waterGoalMl}ml.

> **Tactical Protocol:** If a ghrelin hunger wave hits, drink 300ml cold water with a pinch of mineral pink salt. This suppresses peptide YY signals and stabilizes electrolyte balance without breaking ketosis.`,
          suggestions: [
            'How to break fast without insulin spike',
            'Can I briskwalk in a fasted state?',
            'When does deep autophagy peak?',
          ],
        };
      }

      return {
        response: `**Fasting Window Inactive**
Your default protocol is **16:8 LeanGains** (${userSettings.weightKg}kg baseline):
- **16h Fasting:** Clears liver glycogen stores and activates AMPK signaling.
- **8h Feeding:** High protein (1.6g-2.0g per kg bodyweight) to preserve lean mass.

Hit **"Start Fast"** when your last meal is done.`,
        suggestions: ['Start 16:8 protocol now', 'Autophagy timeline breakdown', 'Pre-fasting meal strategy'],
      };
    }

    if (text.includes('walk') || text.includes('pace') || text.includes('calorie') || text.includes('km') || text.includes('speed')) {
      if (activeWalk) {
        return {
          response: `**Active Telemetry**
- **Distance:** ${formatDistanceKm(activeWalk.distanceMeters)} km
- **Current Pace:** ${formatPace(activeWalk.currentPaceSecondsPerKm)} /km (Target: ${userSettings.targetPaceMinPerKm}m/km)
- **Burn:** ${activeWalk.caloriesBurned} kcal

**Biomechanics Check:** Keep elbows pinned at 90°, strike with heel and roll through the ball of your foot for maximum forward momentum.`,
          suggestions: ['How to sustain 7:00/km pace', 'Zone 2 cardio fat burn formula', 'Post-walk stretching protocol'],
        };
      }

      const last = recentWalks[0];
      return {
        response: `**Brisk Walking Optimization (Zone 2 Cardio)**
At your weight of **${userSettings.weightKg} kg**:
- **Burn Rate:** ~65–70 kcal per kilometer walked at 6.8–7.5 min/km pace.
- **Lipolysis Rate:** In Zone 2 (60–70% max heart rate), over 80% of energetic substrate comes directly from fatty acid oxidation.

${last ? `> **Last session:** ${formatDistanceKm(last.distanceMeters)} km @ ${formatPace(last.avgPaceSecondsPerKm)}/km (${last.caloriesBurned} kcal).` : ''}

**Tip:** Fasted brisk walking stimulates lipolysis 20% faster than fed walking.`,
        suggestions: ['Brisk walk vs jogging for fat loss', 'Target cadence for brisk walking', 'Weekly walking volume plan'],
      };
    }

    if (text.includes('waze') || text.includes('nav') || text.includes('route') || text.includes('direction') || text.includes('traffic')) {
      return {
        response: `**Navigation & Tactical Radar**
- **Turn-by-Turn Audio HUD:** Instant distance countdown and voice prompts.
- **Speedometer HUD:** Real-time satellite speed with speed limit indicators.
- **Hazard Reporting:** Real-time road alerts for speed traps, police checks, traffic jams, and hazards.
- **Mode Toggle:** Switch between Driving (Waze HUD) and Walking mode for pedestrian park routes.`,
        suggestions: ['Find park walking routes', 'How to enable voice navigation', 'Walking routes near me'],
      };
    }

    return {
      response: `**STRIDE OS Active**
Tracking **${userSettings.userName}** (${userSettings.weightKg}kg • Pace Target: ${userSettings.targetPaceMinPerKm} min/km).

Select an area to optimize:
1. **Fasting:** Autophagy stages, metabolic timer, hydration tracking.
2. **Brisk Walk:** GPS telemetry, live pace /km, caloric burn calculation.
3. **Directions:** Waze-style radar navigation with live audio alerts.

What do you want to analyze right now?`,
      suggestions: [
        'Check fasting metabolic stage',
        'Analyze my brisk walk pace target',
        'How many calories for 5km walk?',
        'Optimal post-fast meal setup',
      ],
    };
  },
};
