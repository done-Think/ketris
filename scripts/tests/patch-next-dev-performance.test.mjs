import assert from 'node:assert/strict'
import { test } from 'node:test'
import vm from 'node:vm'

import { patchFlightPerformanceSource } from '../patch-next-dev-performance.mjs'

const source = `
  if (supportsUserTiming) {
    performance.measure('errored', { start: 0, end: childrenEndTime$jscomp$1, });
  }
  if (supportsUserTiming) {
    performance.measure('aborted', { start: 0, end: childrenEndTime$jscomp$3, });
  }
`

function run(code, first, second) {
  const entries = []
  vm.runInNewContext(code, {
    supportsUserTiming: true,
    childrenEndTime$jscomp$1: first,
    childrenEndTime$jscomp$3: second,
    performance: {
      measure(name, value) {
        if (value.end < 0) throw new TypeError('negative time stamp')
        entries.push([name, value.end])
      },
    },
  })
  return entries
}

test('avoids the actual browser failure on negative error/abort timing values', () => {
  assert.throws(() => run(source, -Infinity, -12), /negative time stamp/)
  assert.deepEqual(run(patchFlightPerformanceSource(source), -Infinity, -12), [])
})
test('preserves valid development performance measurements, including zero', () => {
  assert.deepEqual(run(patchFlightPerformanceSource(source), 0, 12), [
    ['errored', 0],
    ['aborted', 12],
  ])
})
test('is idempotent and refuses an unexpected bundled source', () => {
  const patched = patchFlightPerformanceSource(source)
  assert.equal(patchFlightPerformanceSource(patched), patched)
  assert.throws(() => patchFlightPerformanceSource('new bundle format'), /Formato inesperado/)
})
