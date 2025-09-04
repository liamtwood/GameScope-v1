import { useQuery } from '@tanstack/react-query';
import type { Team, Player, Fixture } from '@shared/schema';

export function useTeam(teamId: string) {
  return useQuery({
    queryKey: ['/api/teams', teamId],
    enabled: !!teamId
  });
}

export function useTeams() {
  return useQuery({
    queryKey: ['/api/teams']
  });
}

export function usePlayers(teamId: string) {
  return useQuery<any[]>({
    queryKey: ['/api/team', teamId, 'users'],
    enabled: !!teamId
  });
}

export function useFixtures(teamId: string) {
  return useQuery<Fixture[]>({
    queryKey: ['/api/teams', teamId, 'fixtures'],
    enabled: !!teamId
  });
}

export function usePlayer(playerId: string) {
  return useQuery({
    queryKey: ['/api/players', playerId],
    enabled: !!playerId
  });
}

export function useFixture(fixtureId: string) {
  return useQuery({
    queryKey: ['/api/fixtures', fixtureId],
    enabled: !!fixtureId
  });
}
