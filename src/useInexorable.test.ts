import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInexorable } from './useInexorable'
import { InexorableContext } from './types'

type TestState = {
  count: number
  log: string[]
}

type TestAction =
  | { type: 'enqueueIncrement'; delay: number }
  | { type: 'enqueueMany'; delay: number }
  | { type: 'enqueueNow' }
  | { type: 'increment' }
  | { type: 'log'; message: string }

// Example reducer for testing
const testReducer = (state: TestState, action: TestAction, context: InexorableContext<TestAction>) => {
  switch (action.type) {
    case 'increment':
      state.count += 1
      break
    case 'enqueueNow':
      context.dispatch({ type: 'increment' })
      break
    case 'enqueueIncrement':
      context.dispatch({ type: 'increment' }, action.delay)
      break
    case 'log':
      state.log.push(action.message)
      break
    case 'enqueueMany':
      context.dispatch({ type: 'increment' }, action.delay)
      break
    default:
      break
  }
}

const initialState = {
  count: 0,
  log: []
}

describe('useInexorable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with initial state', () => {
    const { result } = renderHook(() =>
      useInexorable(testReducer, { count: 0, log: [] })
    )
    expect(result.current.state.count).toBe(0)
  })

  it('should handle immediate dispatch', () => {
    const { result } = renderHook(() =>
      useInexorable(testReducer, { count: 0, log: [] })
    )
    act(() => {
      result.current.dispatch({ type: 'increment' })
    })
    expect(result.current.state.count).toBe(1)
  })

  it('should handle immediate dispatch from within a reducer', () => {
    const { result } = renderHook(() =>
      useInexorable(testReducer, { count: 0, log: [] })
    )
    act(() => {
      result.current.dispatch({ type: 'enqueueNow' })
    })
    act(() => vi.advanceTimersByTime(10))

    expect(result.current.state.count).toBe(1)
  })

  it('should handle delayed actions via external dispatch', () => {
    const { result } = renderHook(() =>
      useInexorable(testReducer, { count: 0, log: [] })
    )
    act(() => {
      result.current.dispatch({ type: 'increment' }, 101)
    })
    expect(result.current.state.count).toBe(0)

    act(() => vi.advanceTimersByTime(100))
    expect(result.current.state.count).toBe(0)

    act(() => vi.advanceTimersByTime(10))
    expect(result.current.state.count).toBe(1)
  })

  it('should handle delayed actions from within a reducer', () => {
    const { result } = renderHook(() =>
      useInexorable(testReducer, { count: 0, log: [] })
    )
    act(() => {
      result.current.dispatch({ type: 'enqueueIncrement', delay: 101 })
    })
    expect(result.current.state.count).toBe(0)

    act(() => vi.advanceTimersByTime(100))
    expect(result.current.state.count).toBe(0)

    act(() => vi.advanceTimersByTime(10))
    expect(result.current.state.count).toBe(1)
  })

  it('should execute actions in order as their delay time is reached', () => {
    const { result } = renderHook(() =>
      useInexorable(testReducer, { ...initialState })
    )
    act(() => {
      result.current.dispatch({ type: 'log', message: 'alpha' }, 100)
      result.current.dispatch({ type: 'log', message: 'beta' }, 10)
    })
    expect(result.current.state.log).toEqual([])

    act(() => vi.advanceTimersByTime(110))
    expect(result.current.state.log).toEqual(['beta', 'alpha'])
  })

  it('should execute actions in dispatch order if they have the same delay', () => {
    const { result } = renderHook(() =>
      useInexorable(testReducer, { ...initialState })
    )
    act(() => {
      result.current.dispatch({ type: 'log', message: 'first' }, 100)
      result.current.dispatch({ type: 'log', message: 'second' }, 100)
    })
    expect(result.current.state.log).toEqual([])

    act(() => vi.advanceTimersByTime(110))
    expect(result.current.state.log).toEqual(['first', 'second'])
  })

  it('should be able to schedule actions from the point in time of the previously scheduled action', () => {
    const { result } = renderHook(() =>
      useInexorable(testReducer, { ...initialState })
    )
    act(() => {
      result.current.dispatch({ type: 'log', message: 'first' }, 300)
      result.current.dispatch({ type: 'log', message: 'second' }, { afterPrevious: 50 })
    })
    expect(result.current.state.log).toEqual([])

    act(() => vi.advanceTimersByTime(300))
    expect(result.current.state.log).toEqual(['first'])

    act(() => vi.advanceTimersByTime(40))
    expect(result.current.state.log).toEqual(['first'])

    act(() => vi.advanceTimersByTime(10))
    expect(result.current.state.log).toEqual(['first', 'second'])
  })

  it('should be able to schedule actions from the point in time of the last action', () => {
    const { result } = renderHook(() =>
      useInexorable(testReducer, { ...initialState })
    )
    act(() => {
      result.current.dispatch({ type: 'log', message: 'third' }, 600)
      result.current.dispatch({ type: 'log', message: 'second' }, 500)
      result.current.dispatch({ type: 'log', message: 'fourth' }, { afterLast: 50 })
      result.current.dispatch({ type: 'log', message: 'first' }, 300)
    })
    expect(result.current.state.log).toEqual([])

    act(() => vi.advanceTimersByTime(300))
    expect(result.current.state.log).toEqual(['first'])

    act(() => vi.advanceTimersByTime(200))
    expect(result.current.state.log).toEqual(['first', 'second'])

    act(() => vi.advanceTimersByTime(100))
    expect(result.current.state.log).toEqual(['first', 'second', 'third'])

    act(() => vi.advanceTimersByTime(50))
    expect(result.current.state.log).toEqual(['first', 'second', 'third', 'fourth'])
  })
})