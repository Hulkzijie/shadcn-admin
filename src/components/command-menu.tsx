import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Laptop, Moon, Sun } from 'lucide-react'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useMenuNav } from './layout/data/use-menu-nav'
import type { NavItem } from './layout/types'
import { ScrollArea } from './ui/scroll-area'

/** 把任意层级的菜单拍平成可搜索的链接，标题用「父 / 子」区分 */
function flattenLinks(
  items: NavItem[],
  prefix?: string
): { title: string; url: string }[] {
  return items.flatMap((item) => {
    const title = prefix ? `${prefix} / ${item.title}` : item.title
    if (item.items) return flattenLinks(item.items, title)
    return [{ title, url: item.url as string }]
  })
}

export function CommandMenu() {
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()
  const { navGroups } = useMenuNav()

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder='Type a command or search...' />
      <CommandList>
        <ScrollArea type='hover' className='h-72 pe-1'>
          <CommandEmpty>No results found.</CommandEmpty>
          {navGroups.map((group, groupIndex) => (
            <CommandGroup
              key={`${group.title}-${groupIndex}`}
              heading={group.title || undefined}
            >
              {flattenLinks(group.items).map((navItem, i) => (
                <CommandItem
                  key={`${navItem.url}-${i}`}
                  value={navItem.title}
                  onSelect={() => {
                    runCommand(() => navigate({ to: navItem.url }))
                  }}
                >
                  <div className='flex size-4 items-center justify-center'>
                    <ArrowRight className='size-2 text-muted-foreground/80' />
                  </div>
                  {navItem.title}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading='Theme'>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun /> <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='scale-90' />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
