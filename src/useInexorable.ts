import { useCallback, useEffect, useRef } from 'react'
import { useImmerReducer } from 'use-immer'
import { Draft } from 'immer'
import { PriorityQueue } from '@datastructures-js/priority-queue'
import { DefaultAction, InexorableContext, InexorableDelay, InexorableDispatch, InexorableOptions, InexorableQueueItem, InexorableReducer, UseInexorableReturn } from './types'
import { compareActions } from './compareActions'

/**
 * A React hook for state management with deferred dispatching capabilities.
 * Uses Immer for immutable state updates.
 * 
 * @param initialState - The initial state value
 * @returns An object containing state and dispatch functions
 */
export function useInexorable<S, A = DefaultAction, C = Record<string, unknown>>(
  reducer: InexorableReducer<S, A>,
  initialState: S,
  options?: InexorableOptions<C>
): UseInexorableReturn<S, A> {
  const context = options?.context ?? {}
  const interval = options?.interval ?? 10

  const queue = useRef(new PriorityQueue<InexorableQueueItem<A>>(compareActions))

  // Actual timestamp of our last tick
  const lastTickTime = useRef(Date.now())

  // Internal count of time passed
  const internalTime = useRef(0)

  // Sequence number for tie-breaking
  const sequenceNumber = useRef(0)

  // Time tracking for relative delays
  const previousActionTime = useRef(0)
  const lastActionTime = useRef(0)

  // Timer tracking
  const tickTimer = useRef<number | null>(null)

  const dispatchLater = (action: A, delay?: InexorableDelay) => {
    const effectiveDelay = delay ?? 0

    let time = internalTime.current

    if (typeof effectiveDelay === 'number') {
      time += effectiveDelay
    } else if ('afterPrevious' in effectiveDelay) {
      time = previousActionTime.current + effectiveDelay.afterPrevious
    } else if ('afterLast' in effectiveDelay) {
      time = lastActionTime.current + effectiveDelay.afterLast
    }

    const queueItem = {
      action,
      time,
      sequence: sequenceNumber.current
    }

    queue.current.enqueue(queueItem)

    sequenceNumber.current += 1
    previousActionTime.current = time
    lastActionTime.current = time > lastActionTime.current
      ? time
      : lastActionTime.current
  }

  // Underlying state management
  const [underlyingState, underlyingDispatch] = useImmerReducer(
    (draft: Draft<S>, action: A) => {
      const contextValue: InexorableContext<A> = {
        ...context,
        dispatch: dispatchLater
      }

      reducer(draft, action, contextValue)
    },
    initialState
  )

  // Tick function
  const tick = () => {
    internalTime.current += interval

    let nextAction = queue.current.front()

    console.log('Tick', nextAction, internalTime.current)

    while (nextAction && nextAction.time <= internalTime.current) {
      queue.current.dequeue()

      underlyingDispatch(nextAction.action)

      nextAction = queue.current.front()
    }

    internalTime.current += Math.max(0, Date.now() - lastTickTime.current - interval)
    lastTickTime.current = Date.now()
  }

  useEffect(() => {
    if (!tickTimer.current) {
      console.log('Starting tick timer', interval)
      tickTimer.current = setInterval(tick, interval)
      internalTime.current = 10
    }

    return () => {
      if (tickTimer.current !== null) {
        clearInterval(tickTimer.current)
        tickTimer.current = null
      }
    }
  }, [])

  // Public dispatch function
  const dispatch: InexorableDispatch<A> = useCallback(
    (action: A, delay?: InexorableDelay) => {
      if (!delay) {
        underlyingDispatch(action)
        return
      }

      dispatchLater(action, delay)
    },
    [underlyingDispatch, dispatchLater]
  )

  return {
    state: underlyingState,
    dispatch
  }
}
