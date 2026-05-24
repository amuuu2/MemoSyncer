import { addDays } from "date-fns";

export interface SM2State {
  easiness_factor: number;
  interval: number;
  repetitions: number;
  next_review: Date;
}

export interface SM2Input {
  quality: number; // 0-5
  easiness_factor: number;
  interval: number;
  repetitions: number;
}

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * quality: 0-5
 *   5 = perfect recall
 *   4 = correct after hesitation
 *   3 = correct with difficulty
 *   2 = incorrect but close
 *   1 = incorrect
 *   0 = complete blackout
 */
export function calculateSM2(input: SM2Input): SM2State {
  const { quality } = input;
  let ef = input.easiness_factor;
  let inter = input.interval;
  let rep = input.repetitions;

  if (quality >= 3) {
    if (rep === 0) {
      inter = 1;
    } else if (rep === 1) {
      inter = 6;
    } else {
      inter = Math.round(inter * ef);
    }
    rep += 1;
  } else {
    rep = 0;
    inter = 1;
  }

  ef = Math.max(
    1.3,
    ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return {
    easiness_factor: Math.round(ef * 100) / 100,
    interval: inter,
    repetitions: rep,
    next_review: addDays(new Date(), inter),
  };
}

export const DEFAULT_SM2: Omit<SM2Input, "quality"> = {
  easiness_factor: 2.5,
  interval: 0,
  repetitions: 0,
};
