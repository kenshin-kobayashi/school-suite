export type ScheduleCellPosition = {
  columnId: string;
  periodId: string;
};

export function createScheduleCellKey(
  position: ScheduleCellPosition,
): string {
  return `${position.columnId}-${position.periodId}`;
}