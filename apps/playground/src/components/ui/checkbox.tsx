"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import {useControl} from "@repo/jscform";

// @ts-ignore
const Checkbox = React.forwardRef<HTMLInputElement>(({name = '', title, className, ...props}, ref) => {
    const {value = false, onChange} = useControl(name);
    return (
        <div className="flex flex-row space-x-2 align-middle">
            <input
                type="checkbox"
                ref={ref}
                name={name}
                className={cn(
                    "my-auto peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                    className
                )}
                checked={value}
                id={name}
                onChange={(e) => onChange(!value)}
            />
            <label className="Label" htmlFor="c1">
                {title}
            </label>
        </div>

    )
})

Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
