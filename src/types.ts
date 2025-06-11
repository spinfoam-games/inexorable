import { Draft } from "immer"

export type DefaultAction = {
  type: string
  payload: Record<string, unknown>
}

export type InexorableDispatch<A> = (action: A, delay?: InexorableDelay) => void

export type InexorableContext<A> = {
  dispatch: InexorableDispatch<A>
}

export type InexorableReducer<S, A> = (
  draft: Draft<S>,
  action: A,
  context: InexorableContext<A>
) => void

export type InexorableDelay =
  | number
  | { afterPrevious: number }
  | { afterLast: number }

export interface UseInexorableReturn<S, A> {
  state: S
  dispatch: (action: A, delay?: InexorableDelay) => void
}

export type InexorableOptions<C> = {
  context: C
  interval?: number
}

export type InexorableQueueDetails = {
  time: number
  sequence: number
}

export type InexorableQueueItem<A> = InexorableQueueDetails & {
  action: A
}