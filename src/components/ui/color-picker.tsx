"use client"

import { forwardRef, useMemo, useState } from "react"
import { HexColorPicker } from "react-colorful"
import { cn } from "@/lib/utils"
import { useForwardedRef } from "@/lib/use-forwarded-ref"
import type { ButtonProps } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
}

const guildedColors = [
  "#F5C400", // Guilded yellow
  "#F47B67", // Coral
  "#3BA55C", // Green
  "#5865F2", // Blue
  "#ED4245", // Red
  "#9B59B6", // Purple
  "#E67E22", // Orange
  "#1ABC9C", // Teal
  "#95A5A6", // Gray
]

const ColorPicker = forwardRef<HTMLInputElement, Omit<ButtonProps, "value" | "onChange" | "onBlur"> & ColorPickerProps>(
  ({ disabled, value, onChange, onBlur, name, className, ...props }, forwardedRef) => {
    const ref = useForwardedRef(forwardedRef)
    const [open, setOpen] = useState(false)

    const parsedValue = useMemo(() => {
      return value || "#F5C400"
    }, [value])

    function hexToDecimal(hex: string): number {
      if (!hex.startsWith("#")) return Number.parseInt(hex, 16)
      return Number.parseInt(hex.replace("#", ""), 16)
    }

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
          <Button
            {...props}
            className={cn("block", className)}
            name={name}
            onClick={() => {
              setOpen(true)
            }}
            size="icon"
            style={{
              backgroundColor: parsedValue,
            }}
            variant="outline"
          >
            <div />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full bg-[#36353d] border-[#4a4953]">
          <div className="space-y-4">
            <HexColorPicker color={parsedValue} onChange={onChange} />

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-gray-300">Hex</Label>
                <Label className="text-gray-300">Decimal: {hexToDecimal(parsedValue)}</Label>
              </div>
              <Input
                maxLength={7}
                onChange={(e) => {
                  onChange(e?.currentTarget?.value)
                }}
                ref={ref}
                value={parsedValue}
                className="bg-[#2e2d33] border-[#4a4953] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Guilded Colors</Label>
              <div className="grid grid-cols-5 gap-2">
                {guildedColors.map((color) => (
                  <Button
                    key={color}
                    className="w-full h-8 p-0 border-2"
                    style={{
                      backgroundColor: color,
                      borderColor: parsedValue.toUpperCase() === color.toUpperCase() ? "white" : "transparent",
                    }}
                    variant="outline"
                    onClick={() => onChange(color)}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  },
)
ColorPicker.displayName = "ColorPicker"

export { ColorPicker }
