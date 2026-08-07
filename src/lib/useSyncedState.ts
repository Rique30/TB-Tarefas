import { useState, type Dispatch, type SetStateAction } from "react";

/**
 * Local state seeded from a prop, kept in sync when the prop changes (e.g. a
 * Server Component re-render after revalidatePath) while still allowing
 * local optimistic updates in between. Uses React's "adjust state during
 * render" pattern instead of useEffect — see
 * https://react.dev/learn/you-might-not-need-an-effect
 */
export function useSyncedState<T>(value: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setState(value);
  }
  return [state, setState];
}
