import { cn } from 'cn'

import { buttonVariants } from '@/shared/ui'

// The default hold fill is the accent itself: on the accent background it must be dark.
export const HOLD_CTA = cn(buttonVariants({ size: 'cta' }), '[&>span:first-child]:bg-on-accent/25')
