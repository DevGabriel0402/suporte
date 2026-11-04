export const taskFields = {
  room: 'Sala / Local', date: 'Data do levantamento', category: 'Categoria',
  description: 'Descrição', materials: 'Materiais', status: 'Status',
  requested: 'Solicitação à direção', priority: 'Prioridade', notes: 'Observações',
  assignee: 'Responsável', dueDate: 'Prazo',
};
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function isOverdue(task, today = localDate()) {
  return Boolean(task.dueDate && task.dueDate < today && !['Concluído', 'Cancelado'].includes(task.status));
}
export function taskChanges(before, after) {
  return Object.keys(taskFields).filter(key => (before[key] ?? '') !== (after[key] ?? ''))
    .map(field => ({ field, before: before[field] ?? '', after: after[field] ?? '' }));
}
export function updateWithHistory(current, submitted, original, actor, at, eventId) {
  const patch = Object.fromEntries(taskChanges(original, submitted).map(change => [change.field, change.after]));
  const next = { ...current, ...patch };
  const changes = taskChanges(current, next);
  if (!changes.length) return current;
  return { ...next, history: [...(current.history || []), { id: eventId, action: 'updated', actor, at, changes }] };
}
