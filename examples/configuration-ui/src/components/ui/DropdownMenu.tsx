import { useState, useRef, useEffect } from 'react'

interface DropdownMenuItem {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
}

export const DropdownMenu = ({ trigger, items }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-zinc-800/60 rounded transition-all"
      >
        {trigger}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl bg-zinc-900/95 backdrop-blur-sm border border-zinc-800/60 ring-1 ring-black/20 z-50">
          <div className="py-1.5">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick()
                  setIsOpen(false)
                }}
                className={`block w-full text-left px-4 py-2.5 text-sm transition-all ${
                  item.variant === 'danger'
                    ? 'text-red-500 hover:bg-red-500/10 hover:text-red-500'
                    : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
