/**
 * animationConfig.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all card animation timings, easings, and layout
 * constants. Tune here to adjust the feel of the entire card experience.
 */

// ── Deal animation ────────────────────────────────────────────────────────────
export const CARD_ANIM = {
  deal: {
    duration:    0.42,          // seconds per card flight
    stagger:     0.09,          // seconds between consecutive card deals
    arcHeight:   80,            // px — peak height of the arc above midpoint
    ease:        [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    landSpring:  { stiffness: 260, damping: 26 },
  },

  // ── Shuffle sequence timings (seconds) ─────────────────────────────────────
  shuffle: {
    gather:      0.38,          // halves slide to center
    compress:    0.18,          // deck squash
    expand:      0.12,          // deck unsquash
    split:       0.28,          // cut into two halves
    riffle:      0.65,          // riffle interleave phase
    close:       0.22,          // halves merge
    cut:         0.32,          // top cut lifted and dropped
    settle:      0.20,          // final tap
    cardStagger: 0.013,         // between individual cards during riffle
    total:       2.6,           // approximate total (used to schedule onComplete)
  },

  // ── Card play (hand → trick center) ────────────────────────────────────────
  play: {
    liftDuration:   0.14,
    flyDuration:    0.32,
    ease:           [0.4, 0, 0.2, 1] as [number, number, number, number],
    impactScale:    0.96,       // brief scale dip on landing
    impactDuration: 0.10,
  },

  // ── Trick collection (cards → winner pile) ──────────────────────────────────
  collect: {
    highlightDuration: 0.35,   // winner card gold flash
    slideDelay:        0.45,   // pause before loser cards slide
    slideDuration:     0.38,   // loser cards move toward winner
    flyDuration:       0.42,   // all cards fly to winner pile
    stagger:           0.055,
    ease:              [0.4, 0, 1, 1] as [number, number, number, number],
  },

  // ── Hand interaction ────────────────────────────────────────────────────────
  hover: {
    lift:     -14,              // px — card rises on hover
    scale:    1.05,
    duration: 0.16,
  },
  selected: {
    lift:  -22,                 // px — selected card rises higher
    scale: 1.07,
  },

  // ── Hand fan layout ─────────────────────────────────────────────────────────
  fan: {
    overlap:  36,               // px horizontal overlap between adjacent cards
    maxAngle: 5,                // degrees — applied to outermost cards
    arcLift:  8,                // px — center cards are lifted in a natural arc
  },

  // ── Card exchange (full court) ──────────────────────────────────────────────
  exchange: {
    duration: 0.50,
    stagger:  0.12,
    ease:     [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
} as const;

// ── Card physical dimensions ──────────────────────────────────────────────────
export const CARD_SIZES = {
  lg: { width: 80,  height: 112 }, // local player hand (face-up)
  md: { width: 62,  height: 87  }, // trick area played cards
  sm: { width: 48,  height: 67  }, // opponent face-down hands
  xs: { width: 34,  height: 48  }, // deck stack layers
} as const;

export type CardSize = keyof typeof CARD_SIZES;

// ── Reduced-motion fallback durations ─────────────────────────────────────────
// When prefers-reduced-motion is active, use these instant values.
export const REDUCED_MOTION_ANIM = {
  duration: 0,
  stagger:  0,
} as const;
