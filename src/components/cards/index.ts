/**
 * src/components/cards/index.ts
 * Barrel export for the card component library.
 */

// Config
export { CARD_ANIM, CARD_SIZES } from './config/animationConfig';
export type { CardSize } from './config/animationConfig';

// Primitives
export { Card }     from './primitives/Card';
export type { CardProps } from './primitives/Card';

export { CardBack } from './primitives/CardBack';
export type { CardBackProps } from './primitives/CardBack';

export { SuitSymbol, CardCorner, SUIT_COLOR, SUIT_UNICODE, IS_RED } from './primitives/CardSvgSymbols';

// Composed
export { Deck }       from './composed/Deck';
export type { DeckProps } from './composed/Deck';

export { PlayerHand } from './composed/PlayerHand';
export type { PlayerHandProps } from './composed/PlayerHand';

export { TrickArea }  from './composed/TrickArea';
export type { TrickAreaProps } from './composed/TrickArea';

// Animations
export { ShuffleAnimation }        from './animations/ShuffleAnimation';
export type { ShuffleAnimationProps } from './animations/ShuffleAnimation';

export { CardDealAnimation }       from './animations/CardDealAnimation';
export type { CardDealAnimationProps, DealInstruction } from './animations/CardDealAnimation';

export { CardCollectionAnimation } from './animations/CardCollectionAnimation';
export type { CardCollectionAnimationProps } from './animations/CardCollectionAnimation';

export { CardExchangeAnimation }   from './animations/CardExchangeAnimation';
export type { CardExchangeAnimationProps } from './animations/CardExchangeAnimation';
