/**
 * Timestamp grouping utility for CometChatNotificationFeed.
 * Groups NotificationFeedItems by sentAt into sections for SectionList.
 *
 * Groups: "Today", "Yesterday", day name (Mon–Sun) for this week, localized date for older.
 * Items within each group ordered newest-first.
 * Groups ordered newest-first.
 * Total count invariant: no items lost or duplicated.
 */

/** Represents a single timestamp group (section) for SectionList */
export interface TimestampGroup<T> {
  title: string;
  data: T[];
}

/** Day names for "this week" grouping */
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Returns the start of a given day (midnight) for comparison purposes.
 */
const getStartOfDay = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Determines the group label for a given timestamp.
 *
 * @param sentAt - Unix timestamp in seconds
 * @param now - Current Date (injected for testability)
 * @returns Group label string
 */
const getGroupLabel = (sentAt: number, now: Date): string => {
  const itemDate = new Date(sentAt * 1000);
  const todayStart = getStartOfDay(now);
  const itemDayStart = getStartOfDay(itemDate);

  const diffMs = todayStart - itemDayStart;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  // Within this week (2-6 days ago) — show day name
  if (diffDays >= 2 && diffDays <= 6) {
    return DAY_NAMES[itemDate.getDay()];
  }
  // Older — show localized date
  return itemDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Groups feed items by their sentAt timestamp into sections.
 *
 * Pure function — no side effects, memoizable.
 * Correctness guarantee: total items across all groups === input count.
 *
 * @param items - Array of objects with a getSentAt() method returning unix timestamp (seconds)
 * @param now - Optional current date (defaults to new Date(), injectable for testing)
 * @returns Array of TimestampGroup sections, ordered newest-first
 */
export const groupFeedItemsByTimestamp = <T extends { sentAt: number }>(
  items: T[],
  now: Date = new Date()
): TimestampGroup<T>[] => {
  if (items.length === 0) return [];

  // Group items by label, preserving insertion order (newest-first assumed from input)
  const groupMap = new Map<string, T[]>();
  // Track group order by the max sentAt in each group (for sorting)
  const groupMaxTimestamp = new Map<string, number>();

  for (const item of items) {
    const sentAt = item.sentAt;
    const label = getGroupLabel(sentAt, now);

    const existing = groupMap.get(label);
    if (existing) {
      existing.push(item);
    } else {
      groupMap.set(label, [item]);
    }

    const currentMax = groupMaxTimestamp.get(label) ?? 0;
    if (sentAt > currentMax) {
      groupMaxTimestamp.set(label, sentAt);
    }
  }

  // Convert to array and sort groups newest-first
  const groups: TimestampGroup<T>[] = [];
  for (const [title, data] of groupMap) {
    // Sort items within group newest-first
    data.sort((a, b) => b.sentAt - a.sentAt);
    groups.push({ title, data });
  }

  // Sort groups by their newest item (descending)
  groups.sort((a, b) => {
    const aMax = groupMaxTimestamp.get(a.title) ?? 0;
    const bMax = groupMaxTimestamp.get(b.title) ?? 0;
    return bMax - aMax;
  });

  return groups;
};
