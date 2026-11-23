import { useApiResource } from '../api/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const userEmail = 'mona@example.com';
  const path = `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`;
  const { data, loading, error } = useApiResource<WorkoutResponse>(path);
  const suggestions = data?.suggestions ?? [];
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      empty={!loading && !error && suggestions.length === 0}
      emptyMessage="No workout suggestions yet."
    >
      <ul className="list-group">
        {suggestions.map((workout, index) => (
          <li className="list-group-item" key={workout._id ?? `${workout.title}-${index}`}>
            <strong>{workout.title}</strong> · {workout.focus} · {workout.minutes} minutes · {workout.difficulty}
            <p className="mb-0">{workout.reason}</p>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
