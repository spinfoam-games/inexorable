import Layout from "@theme/Layout"

import { useInexorable } from "../../../src/useInexorable"
import { useEffect } from "react"

const initialState = {
  recipeIndex: 0,
}

const reducer = (state, action, context) => {
  switch (action.type) {
    case 'GET_RECIPE':
      const loadingDelay = Math.floor(Math.random() * 5000)

      context.dispatch({ type: 'SET_LOADING', payload: true })

      fetch(`https://dummyjson.com/recipes/${state.recipeIndex + 1}?delay=${loadingDelay}`)
        .then(res => res.json())
        .then(json => {
          context.dispatch({ type: 'SET_LOADING', payload: false })

          context.dispatch({
            type: 'SET_RECIPE_NAME',
            payload: json.name
          })

          context.dispatch({ type: 'CLEAR_DETAILS' })

          json.ingredients.forEach(ingredient => {
            context.dispatch({
              type: 'ADD_INGREDIENT',
              payload: ingredient
            }, { afterPrevious: 1000 })
          })

          json.instructions.forEach((instruction, idx) => {
            context.dispatch({
              type: 'ADD_INSTRUCTION',
              payload: instruction
            },
              idx === 0
                ? 1500
                : { afterPrevious: 1000 }
            )
          })

          context.dispatch({ type: 'NEXT_RECIPE' }, { afterLast: 10000 })
        })
      break
    case 'SET_LOADING':
      state.isLoading = action.payload
      break
    case 'SET_RECIPE_NAME':
      state.recipeName = action.payload
      break
    case 'ADD_INGREDIENT':
      if (!state.ingredients) state.ingredients = []

      state.ingredients.push(action.payload)
      break
    case 'ADD_INSTRUCTION':
      if (!state.instructions) state.instructions = []

      state.instructions.push(action.payload)
      break
    case 'NEXT_RECIPE':
      state.recipeIndex = (state.recipeIndex + 1) % 10
      context.dispatch({ type: 'GET_RECIPE' })

      break
    case 'CLEAR_DETAILS':
      state.instructions = []
      state.ingredients = []

      break
    default:
      return state
  }
}

const Example = () => {
  const { state, dispatch } = useInexorable(reducer, initialState)

  useEffect(() => {
    dispatch({ type: 'GET_RECIPE' })
  }, [])

  return (
    <Layout title='Example'>
      <div style={{ padding: '2rem' }}>
        <h1>Recipe Loader</h1>
        <p>
          This page loads a series of recipes from <a href='https://dummyjson.com/'>DummyJSON</a> and displays
          the ingredients and instructions for each, one item at a time, with a delay between each item.
        </p>
        <p>
          The implementation of this example uses both absolute and relative delays as well as dispatching actions
          from within a reducer in response to an ansynchronous operation (the fetch request).
        </p>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 0, flexShrink: 0, width: 450 }}>
            {state.isLoading ? (
              <div>Loading...</div>
            ) : (
              <div>Waiting...</div>
            )}
            <pre>{JSON.stringify(state, null, 2)}</pre>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: 'calc(100% - 450px - 2rem)' }}>
            <h2>Recipe: {state.recipeName}</h2>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
              <div style={{ width: '40%' }}>
                <h3>Ingredients</h3>
                <ul>
                  {state.ingredients && state.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Instructions</h3>
                <ol>
                  {state.instructions && state.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Example