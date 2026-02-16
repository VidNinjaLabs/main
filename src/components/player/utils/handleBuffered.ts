export function handleBuffered(time: number, buffered: TimeRanges): number {
  if (!buffered || buffered.length === 0) return 0;

  // Use a small tolerance for "current" buffer to handle float precision and small gaps
  // time + 0.1 allows us to pick up a segment starting just after current time
  const tolerance = 0.5;

  for (let i = 0; i < buffered.length; i += 1) {
    // Check ranges in reverse order (usually end is at the end)
    const index = buffered.length - 1 - i;
    const start = buffered.start(index);
    const end = buffered.end(index);

    // If the playhead is inside this range OR just before this range (within tolerance)
    if (start <= time + tolerance && time < end) {
      return end;
    }
  }
  return 0;
}
