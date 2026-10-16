// Дзеркало apps/api/src/common/api-types.ts

export const TRACKS = ['PRYKHYLNYK', 'UCHASNYK', 'ROZVIDUVACH'] as const
export type Track = (typeof TRACKS)[number]

export type Role = 'ADMIN' | 'VIEWER'

export interface UserDto {
  id: string
  email: string
  name: string
  role: Role
  createdAt: string
}

export interface Progress {
  done: number
  total: number
}

export interface BoardMember {
  id: string
  firstName: string
  lastName: string
  track: Track
  position: number
  progress: Progress
}

export interface BoardTrack {
  track: Track
  title: string
  subtitle: string
  members: BoardMember[]
}

export interface BoardResponse {
  tracks: BoardTrack[]
}

export interface MemberDto {
  id: string
  firstName: string
  lastName: string
  track: Track
  position: number
}

export interface RequirementState {
  id: string
  number: number
  text: string
  isOptional: boolean
  completed: boolean
  completedAt: string | null
  completedBy: { id: string; name: string } | null
}

export interface SectionState {
  id: string
  letter: string
  title: string
  requirements: RequirementState[]
}

export interface ProbaState {
  track: Track
  title: string
  subtitle: string
  progress: Progress
  sections: SectionState[]
}

export interface MemberProbasResponse {
  member: MemberDto
  probas: ProbaState[]
}
