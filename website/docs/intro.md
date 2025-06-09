---
slug: /
sidebar_position: 1
---

# Overview

_Inexorable_ is a small React hook built on top of ImmerJS and use-immer which provides
state management similar to React's `useReducer` but with added support for delayed dispatching
of actions and dispatching actions from within a reducer function.

This allows you to schedule a series of actions to be dispatched at various intervals, as well
as allowing actions to be dispatched in response to asynchronous events triggered inside a reducer.

_Inexorable_ also adds an extra `context` parameter that is provided to reducer functions which
can be used to share resources and services that would be cumbersome, useless, or impossible to
store in the application state.