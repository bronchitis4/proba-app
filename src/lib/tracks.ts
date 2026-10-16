export function fullName(m: { firstName: string; lastName: string }): string {
  return `${m.lastName} ${m.firstName}`
}

export function percent(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}
