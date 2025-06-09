---
slug: /usage
---
# Usage

## Installation

**Yarn**
```
yarn add @spinfoam/inexorable
```

**NPM**
```
npm install @spinfoam/inexorable
```

## Basic Usage Example

In the simplest case `useInexorable` functions very much like React's standard `useReducer`,
except that the state passed to the reducer function will be an Immer draft, so you can
modify it directly (no need to clone it) and you do not need to return anything from
the reducer.

```jsx
const initialState = {
  counter: 0
}

const reducer = (state, action) => {
  if (action.type === 'COUNT') {
    state.counter++
  }
}

const CounterComponent = () => {
  const { state, dispatch } = useInexorable(reducer, initialState)

  return (
    <div>
      <div>{state.counter}</div>
      <div>
        <button onClick={() => dispatch({ type: 'COUNT' })}>Count</button>
      </div>
    </div>
  )
}
```

## Delayed Dispatching

```jsx
const initialState = {
  log: []
}

const reducer = (state, action) => {
  if (action.type === 'ADD_LOG') {
    state.log.push(action.payload.message)
  } else if (action.type === 'CLEAR_LOG') {
    state.log = []
  }
}

const LogComponent = () => {
  const { state, dispatch } = useInexorable(reducer, initialState)

  const sendLogMessages = useCallback(
    () => {
      dispatch({ type: 'CLEAR_LOG' })

      [
        'A Laggy Slime draws near!',
        'The Laggy Slime just sat there.',
        'Command?',
        'Inexorable attacks!',
        'Excellent move!',
        'Thou hast done well in defeating the Laggy Slime.'
      ].forEach(message => {
        dispatch(
          { type: 'ADD_LOG', payload: { message } },
          { afterPrevious: 1000 }
        )
      })
    },
    [dispatch]
  )

  return (
    <div>
      <button onClick={sendLogMessages}>Go!</button>
      <ul>
        {state.log.map((log, idx) => <li key={idx}>{log}</li>)}
      </ul>
    </div>
  )
}
```