import { useState } from "react";

/**
 * Closes a modal once a useActionState result flips to success, without
 * calling setState from inside a useEffect (React's "adjust state during
 * render" pattern — see https://react.dev/learn/you-might-not-need-an-effect).
 */
export function useCloseOnActionSuccess(state: { success?: boolean }, setOpen: (open: boolean) => void) {
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) setOpen(false);
  }
}
