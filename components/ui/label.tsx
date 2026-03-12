"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Render a styled label that wraps Radix UI's LabelPrimitive.Root.
 *
 * @param className - Additional CSS class names appended to the component's default label styles
 * @param props - All other props are forwarded to `LabelPrimitive.Root`
 * @returns A `LabelPrimitive.Root` element with the component's default styling and `data-slot="label"`
 */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
