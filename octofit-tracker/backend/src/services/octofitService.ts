import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw badRequest('Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw badRequest('Valid userId and teamId are required');
  }
  if (typeof type !== 'string' || type.trim().length === 0) {
    throw badRequest('Activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw badRequest('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id team'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) throw badRequest('User and team must exist');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw badRequest('Team details are required');
  const { name, mascot, members = [] } = input;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw badRequest('Team name is required');
  }
  if (typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw badRequest('Team mascot is required');
  }
  if (!Array.isArray(members) || !members.every(isObjectId)) {
    throw badRequest('Team members must be valid user IDs');
  }

  const memberIds = members as string[];
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== new Set(memberIds).size) {
      throw badRequest('Team members must exist');
    }
  }
  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function focusForActivity(type: string) {
  const normalizedType = type.toLowerCase();
  if (normalizedType === 'strength') return 'strength';
  if (['run', 'walk', 'cycle', 'swim'].includes(normalizedType)) return 'endurance';
  return normalizedType;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('fitnessGoal');
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  const activityFocus = activities[0] ? focusForActivity(activities[0].type) : undefined;
  const preferredFocus = workouts.some((workout) => workout.focus.toLowerCase() === goalFocus)
    ? goalFocus
    : activityFocus;
  const orderedWorkouts = [...workouts].sort((left, right) => {
    const leftMatches = preferredFocus !== undefined && left.focus.toLowerCase() === preferredFocus;
    const rightMatches = preferredFocus !== undefined && right.focus.toLowerCase() === preferredFocus;
    return Number(rightMatches) - Number(leftMatches) || left.title.localeCompare(right.title);
  });

  return orderedWorkouts.map((workout) => {
    const matchesGoal = workout.focus.toLowerCase() === goalFocus;
    const matchesActivity = activityFocus !== undefined && workout.focus.toLowerCase() === activityFocus;
    const reason = matchesGoal
      ? `Matches your ${user.fitnessGoal} fitness goal.`
      : matchesActivity
        ? `Builds on your recent ${activities[0].type} activity.`
        : 'A suggested workout to support your fitness routine.';
    return { ...workout, reason };
  });
}

export { User };
