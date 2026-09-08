import { describe, expect, it } from 'vitest'
import { column } from '../../graph/layout'

describe('column layout', () => {
  it('puts a single row on the centre line', () => {
    expect(column(1)).toEqual([0])
  })

  it('splits two rows either side of the centre line', () => {
    expect(column(2)).toEqual([-48, 48])
  })

  it('returns nothing for an empty group', () => {
    expect(column(0)).toEqual([])
  })

  it('stays symmetric about zero for any count', () => {
    for (const count of [1, 2, 3, 4, 11, 21]) {
      const ys = column(count)
      expect(ys).toHaveLength(count)
      const sum = ys.reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(0)
      for (let i = 0; i < ys.length; i++) {
        expect(ys[i]).toBeCloseTo(-ys[ys.length - 1 - i])
      }
    }
  })

  it('spaces rows by rowHeight', () => {
    expect(column(3, 100)).toEqual([-100, 0, 100])
  })
})
