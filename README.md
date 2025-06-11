# Inexorable

Inexorable is a React hook for state management built on top of ImmerJS.

Its key feature is support for delaying actions until some future time and (as a side effect, really) allowing actions to be dispatched from within reducer functions.

## useInexorable

The `useInexorable` hook requires two or three parameters: a reducer function, an initial state, and an optional context object (see below for details on the options object).

It returns an object containing two properties: `state` and `dispatch`.

In the simplest case these can be used in much the same was as the values returned from React's `useReducer`:

```jsx
const initialState = { count: 0 }

// Note that the state will be an Immer draft,
// so you can mutate it directly and should not
// return it from the reducer.
const reducer = (state, action) => {
  if (action.type === 'COUNT') {
    state.count++
  }
}

const ExampleComponent = () => {
  const { state, dispatch } = useInexorable(reducer, initialState)

  return (
    <div>
      <div>{state.count}</div>
      <button onClick={() => dispatch({ type: 'COUNT' })}>Increment</button>
    </div>
  )
}
```

You may, however, choose to delay the action by an arbitrary number of milliseconds by passing a second parameter to the `dispatch` function:

```jsx
<button onClick={() => dispatch({ type: 'COUNT' }, 1000)}>
  Increment after one second
</button>
```

The reducer function will also receive a third argument -- `context` -- which includes a `dispatch` function which can be used within the reducer.

Actions dispatched this way will be executed as soon as possible _after_ the reducer completes; the current exection of the reducer will not be interrupted.

```jsx
const reducer = (state, action, context) => {
  // ...
  context.dispatch({ type: 'SOME_FOLLOW_UP_ACTION' })
  // ...
}
```

Actions dispatched this way may also be delayed:

```jsx
const reducer = (state, action, context) => {
  // ...
  context.dispatch({ type: 'SOME_ACTION_IN_ONE_SECOND' }, 1000)
  // ...
}
```

They may also be dispatched in response to asynchronous activities:

```jsx
const reducer = (state, action, context) => {
  // ...
  fetch('https://www.example.com')
    .then(response => response.json())
    .then(json => context.dispatch({
      type: 'USE_THE_JSON',
      payload: { json }
    }))
  // ...
}
```

**NOTE:** While it is safe to dispatch an action inside a `then`, it **is not** safe to attempt to modify the `state` (the Immer draft will have been discarded by that point).

## Other Delay Mechanisms

The second argument (the `delay` argument) to the `dispatch` function can take several forms:

**Immediate Dispatch**

If the `delay` argument is absent the action will be dispatched as soon as possible. In most situations this will be immediate, but if the dispatch originates inside the reducer it will be delayed until the reducer has completed execution (and, specifically, until the next tick of Inexorable's clock).

**Simple Delays**

If the `delay` argument is a number it will be treated as a number of milliseconds from _the current time_ to delay the action.

If multiple actions are set to dispatch at the same time they will be executed in the order they were dispatched.

**Relative Delay from Previous Dispatch**

If you are stringing together several delayed dispatches it can be cumbersome to keep track of a cumulative delay for them, especially if they may be conditional or are spread across multiple functions that comprise the reducer.

To simplify this case you may pass an object of the following form for the `delay` argument:
```javascript
{ afterPrevious: 1000 }
```

This will dispatch the action some number of milliseconds after the time set for the previous dispatch.

For example:
```javascript
context.dispatch({ type: 'ACTION' }, 0)
context.dispatch({ type: 'ACTION' }, { afterPrevious: 1000 })
context.dispatch({ type: 'ACTION' }, { afterPrevious: 1000 })
context.dispatch({ type: 'ACTION' }, { afterPrevious: 1000 })
```

This will cause `ACTION` to be dispatched as soon as possible, then again after 1 second, a third time 1 second after that, and a fourth and final time 1 second after that.

In total it will take approximately 4 seconds for all of these actions to be dispatched.

**Relative Delay from Last Action**

If you know you would like a particular action to be dispatched after all the other actions currently scheduled you may provide a `delay` in the following format:

```javascript
{ afterLast: 1000 }
```

This will cause the dispatch to be delayed until 1 second _after the last dispatch currently scheduled_.

## Options

The third argument to the `useInexorable` hook allows you to configure Inexorable. This is pretty minimal at the moment, but the options supported are:

| Option   | Default | Purpose                                                                            |
|----------|--------:|------------------------------------------------------------------------------------|
| interval | 10      | Specify the target update rate for Inexorable.                                     |
| context  | {}      | Provide a context object for use in your reducers. See below for more information. |

## Context Object

Inexorable always provides a `context` argument to the reducer in order to contain the `dispatch` function, but you may also attach additional information to the context by providing it to the `useInexorable` hook in the third argument.

```javascript
const { state, dispatch } = useInexorable(
  reducer,
  initialState,
  {
    context: {
      getRandomId: () => { /*... maybe call nanoid ...*/ },
      getRandomInteger: () => { /*... something, something, Math.random() ...*/ }
    }
  }
)
```

This can be useful if you have services that require a bit of up-front configuration that you would like to make available to the reducer. It can also provide a helpful hook for injecting mocked services for testing purposes.

## Operational Notes

Inexorable works by wrapping a `useImmerReducer` hook and providing a `dispatch` function that _either_ calls the underlying dispatch from `useImmerReducer` (in the case of dispatches that require no delay) _or_ adds the requested action to a priority queue.

To process the queue Inexorable relies on a `setInterval` call which runs it's own internal `tick` function as quickly as the JS runtime will allow. (By default it requests a 10ms interval, but in practice this will more likely be on the order of 100ms.)

Each tick updates Inexorables internal clock and then dispatches all the actions in the queue that have a scheduled dispatch time that is in the past (or exactly now).

The queue is sorted primarily by scheduled dispatch time, with a sequential index being used to break any ties (and ensure that, in the case of a tie, actions are dispatched in the same order that they were queued).