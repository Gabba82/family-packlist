export function itemAssigneeLabel(
  targetType: 'FAMILY' | 'PERSON',
  personName: string | null | undefined
) {
  return targetType === 'FAMILY' ? 'Toda la familia' : personName || 'Sin asignar';
}

export function listProgress(total: number, completed: number) {
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, pending, percentage };
}
