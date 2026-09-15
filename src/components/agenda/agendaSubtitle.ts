export function agendaSubtitle(inMonth: number, total: number) {
  if (total === inMonth) return `${inMonth} rendez-vous ce mois`;
  return `${inMonth} ce mois / ${total} au total`;
}
