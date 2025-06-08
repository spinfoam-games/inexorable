import { InexorableQueueDetails } from "./types"

export const compareActions = (a: InexorableQueueDetails, b: InexorableQueueDetails) => {
  const aTime = a.time ?? 0
  const bTime = b.time ?? 0

  if (aTime === bTime) {
    return (a.sequence ?? 0) - (b.sequence ?? 0)
  }

  return aTime - bTime
}