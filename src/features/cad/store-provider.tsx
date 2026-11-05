import { useState, type ReactNode } from 'react'
import { CadStoreContext, createCadStore, type CadState } from './store'

export function CadStoreProvider({
  children,
  initial,
}: {
  children: ReactNode
  initial?: Partial<CadState>
}) {
  const [store] = useState(() => createCadStore(initial))
  return (
    <CadStoreContext.Provider value={store}>
      {children}
    </CadStoreContext.Provider>
  )
}
