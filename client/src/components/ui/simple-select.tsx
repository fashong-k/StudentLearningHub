import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
}

interface SimpleSelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function SimpleSelect({ value, onValueChange, placeholder, children, className }: SimpleSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || "")
  
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    setSelectedValue(value || "")
  }, [value])

  const handleSelect = (itemValue: string, itemChildren: React.ReactNode) => {
    setSelectedValue(itemValue)
    setIsOpen(false)
    onValueChange?.(itemValue)
  }

  const getDisplayValue = () => {
    if (!selectedValue) return placeholder
    
    // Find the selected item's children
    const items = React.Children.toArray(children)
    const selectedItem = items.find((child) => {
      if (React.isValidElement(child) && child.props.value === selectedValue) {
        return true
      }
      return false
    })
    
    if (React.isValidElement(selectedItem)) {
      return selectedItem.props.children
    }
    
    return selectedValue
  }

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn(!selectedValue && "text-muted-foreground")}>
          {getDisplayValue()}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 z-[999] min-w-[8rem] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                  onClick: () => handleSelect(child.props.value, child.props.children),
                  isSelected: child.props.value === selectedValue,
                })
              }
              return child
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function SimpleSelectItem({ value, children, className, onClick, isSelected }: SimpleSelectItemProps & { onClick?: () => void; isSelected?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}