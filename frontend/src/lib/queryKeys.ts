/**
 * Standard React Query Keys
 * Unified query key factory to ensure consistent cache invalidation and query fetching
 */

export const queryKeys = {
  dashboard: () => ['dashboard'] as const,
  players: (filters?: Record<string, any>) => (filters ? ['players', filters] as const : ['players'] as const),
  player: (id: string) => ['players', id] as const,
  playerReturns: (playerId?: string) => ['player-returns', playerId || 'all'] as const,
  tournaments: () => ['tournaments'] as const,
  tournament: (id: string) => ['tournaments', id] as const,
  teams: () => ['teams'] as const,
  team: (id: string) => ['teams', id] as const,
  matches: (filters?: Record<string, any>) => (filters ? ['matches', filters] as const : ['matches'] as const),
  match: (id: string) => ['matches', id] as const,
  sponsors: () => ['sponsors'] as const,
  sponsor: (id: string) => ['sponsors', id] as const,
  finances: () => ['finances'] as const,
};
