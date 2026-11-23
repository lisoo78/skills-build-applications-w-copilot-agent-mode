import { useApiResource } from '../api/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const { data, loading, error } = useApiResource<TeamResponse>('/api/teams');
  const teams = data?.teams ?? [];
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      empty={!loading && !error && teams.length === 0}
      emptyMessage="No teams yet."
    >
      <ul className="list-group">
        {teams.map((team, index) => (
          <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
            <strong>{team.name}</strong> · {team.mascot} · {team.members.length} members
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
