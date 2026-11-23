import { useApiResource } from '../api/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: Entry[] };

export default function Leaderboard() {
  const { data, loading, error } = useApiResource<LeaderboardResponse>('/api/leaderboard');
  const entries = data?.leaderboard ?? [];
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      empty={!loading && !error && entries.length === 0}
      emptyMessage="No leaderboard rankings yet."
    >
      <ol className="list-group list-group-numbered">
        {entries.map((entry) => (
          <li className="list-group-item" key={`${entry.rank}-${entry.teamName}`}>
            {entry.teamName} · {entry.totalPoints} points
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
