type AfterTask = (() => unknown) | Promise<unknown>

const queued: AfterTask[] = []

export function queueAfterTask(task: AfterTask) {
  queued.push(task)
}

export async function flushAfterTasks() {
  while (queued.length > 0) {
    const task = queued.shift()
    await (typeof task === 'function' ? task() : task)
  }
}

export function pendingAfterTasks() {
  return queued.length
}
