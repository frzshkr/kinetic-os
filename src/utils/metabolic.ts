import { FastingProtocol, FastingStage } from '../types';

export const FASTING_PROTOCOLS: FastingProtocol[] = [
  {
    id: '16-8',
    name: '16:8 LeanGains',
    fastHours: 16,
    eatHours: 8,
    description: 'Gold standard daily protocol. 16h fast, 8h feeding window. Ideal for fat burn & steady metabolic energy.',
    difficulty: 'Intermediate',
  },
  {
    id: '14-10',
    name: '14:10 Circadian',
    fastHours: 14,
    eatHours: 10,
    description: 'Gentle starter protocol aligned with natural circadian rhythm. Great for routine reset.',
    difficulty: 'Beginner',
  },
  {
    id: '18-6',
    name: '18:6 Deep Burn',
    fastHours: 18,
    eatHours: 6,
    description: 'Extended fat oxidation phase with early cellular autophagy initiation.',
    difficulty: 'Intermediate',
  },
  {
    id: '20-4',
    name: '20:4 Warrior',
    fastHours: 20,
    eatHours: 4,
    description: 'Intense 20h fast with a condensed 4h nutritional window.',
    difficulty: 'Advanced',
  },
  {
    id: '24-0',
    name: '24:0 OMAD',
    fastHours: 24,
    eatHours: 1,
    description: 'One meal a day. Maximum autophagy, immune renewal, and systemic insulin reset.',
    difficulty: 'Expert',
  },
  {
    id: 'custom',
    name: 'Custom Target',
    fastHours: 16,
    eatHours: 8,
    description: 'Set your own custom fasting target to fit your daily schedule.',
    difficulty: 'Intermediate',
  },
];

export const METABOLIC_STAGES: FastingStage[] = [
  {
    name: 'Anabolic Phase',
    startHour: 0,
    endHour: 4,
    description: 'Digesting last meal. Blood glucose and insulin levels peak and begin tapering.',
    scientificBenefit: 'Nutrients absorbed into cells; glycogen stored in liver and muscle tissue.',
    color: '#3b82f6',
    icon: 'Apple',
  },
  {
    name: 'Insulin Normalization',
    startHour: 4,
    endHour: 8,
    description: 'Digestion complete. Insulin returns to baseline; digestive tract enters rest state.',
    scientificBenefit: 'Cells recover insulin sensitivity; systemic inflammation decreases.',
    color: '#06b6d4',
    icon: 'Activity',
  },
  {
    name: 'Fat Oxidation',
    startHour: 8,
    endHour: 12,
    description: 'Liver glycogen depletes. Body transitions primary fuel source to free fatty acids.',
    scientificBenefit: 'Lipolysis begins; steady clean energy with zero sugar spikes or crashes.',
    color: '#10b981',
    icon: 'Flame',
  },
  {
    name: 'Active Ketosis',
    startHour: 12,
    endHour: 16,
    description: 'Liver converts fatty acids into ketones (beta-hydroxybutyrate). Peak fat burning.',
    scientificBenefit: 'Ketones cross blood-brain barrier, providing sustained mental clarity.',
    color: '#f59e0b',
    icon: 'Zap',
  },
  {
    name: 'Cellular Autophagy',
    startHour: 16,
    endHour: 24,
    description: 'Cellular recycling: damaged mitochondria and misfolded proteins are cleared.',
    scientificBenefit: 'Nobel-winning mechanism: deep cellular rejuvenation and anti-aging benefits.',
    color: '#8b5cf6',
    icon: 'Sparkles',
  },
  {
    name: 'Deep Ketosis & HGH Surge',
    startHour: 24,
    endHour: 72,
    description: 'Human Growth Hormone surges up to 5x to preserve muscle while burning fat.',
    scientificBenefit: 'Immune system renewal and maximum metabolic flexibility.',
    color: '#ec4899',
    icon: 'ShieldCheck',
  },
];

export function getCurrentStage(elapsedHours: number): FastingStage {
  for (let i = METABOLIC_STAGES.length - 1; i >= 0; i--) {
    if (elapsedHours >= METABOLIC_STAGES[i].startHour) {
      return METABOLIC_STAGES[i];
    }
  }
  return METABOLIC_STAGES[0];
}

export function getStageProgress(elapsedHours: number, stage: FastingStage): number {
  const span = stage.endHour - stage.startHour;
  if (span <= 0) return 100;
  const progress = ((elapsedHours - stage.startHour) / span) * 100;
  return Math.min(100, Math.max(0, progress));
}
