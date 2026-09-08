export function column(count: number, rowHeight = 96): number[] {
  const span = (count - 1) * rowHeight
  return Array.from({ length: count }, (_, i) => i * rowHeight - span / 2)
}
