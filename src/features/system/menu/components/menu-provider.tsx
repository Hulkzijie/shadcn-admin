import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type SysMenuVo } from '../api'

export type MenuDialogType = 'add' | 'edit' | 'delete'

type MenuContextType = {
  open: MenuDialogType | null
  setOpen: (str: MenuDialogType | null) => void
  currentRow: SysMenuVo | null
  setCurrentRow: React.Dispatch<React.SetStateAction<SysMenuVo | null>>
}

const MenuContext = React.createContext<MenuContextType | null>(null)

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<MenuDialogType>(null)
  const [currentRow, setCurrentRow] = useState<SysMenuVo | null>(null)

  return (
    <MenuContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </MenuContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useMenu = () => {
  const ctx = React.useContext(MenuContext)
  if (!ctx) {
    throw new Error('useMenu has to be used within <MenuProvider>')
  }
  return ctx
}
