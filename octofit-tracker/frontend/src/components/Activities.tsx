import { useApiResource } from '../api/useApiResource.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const { data, loading, error } = useApiResource<ActivityResponse>('/api/activities');
  const activities = data?.activities ?? [];
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      error={error}
      empty={!loading && !error && activities.length === 0}
      emptyMessage="No activities yet."
    >
      <ul className="list-group">
        {activities.map((activity, index) => (
          <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
            {activity.type} · {activity.minutes} minutes · {activity.points} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
