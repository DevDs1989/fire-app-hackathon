'use client'
import * as React from 'react'
import { useTheme } from 'next-themes'
import { Switch } from '@/components/ui/switch'
import { Sun, Moon } from 'lucide-react'

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // Avoid hydration mismatch

  const isDark = theme === 'dark'

  return (
    <Switch
      checked={isDark}
      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      className="bg-muted-foreground data-[state=checked]:bg-primary"
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-gray-200" />
      ) : (
        <Sun className="h-4 w-4 text-yellow-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Switch>
  )
}
