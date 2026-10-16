import { Bird, Feather, Flag, Shield, type LucideProps } from 'lucide-react'
import type { Track } from '@/types/api'

/** Іконка треку: прихильник — щит, учасник — крило, розвідувач — орел. */
export function TrackIcon({ track, ...props }: LucideProps & { track: Track }) {
  switch (track) {
    case 'PRYKHYLNYK':
      return <Shield {...props} />
    case 'UCHASNYK':
      return <Feather {...props} />
    case 'ROZVIDUVACH':
      return <Bird {...props} />
    default:
      return <Flag {...props} />
  }
}
