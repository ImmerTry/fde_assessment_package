"use client"

import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export function Metric({
    label,
    value,
    highlight,
    danger,
}: {
    label: string
    value: number
    highlight?: boolean
    danger?: boolean
}) {
    const isActive = highlight || danger

    return (
        <motion.div
            className={cn(
                "relative flex flex-col overflow-hidden rounded-lg border bg-card px-3 py-2",
                highlight && "border-blue-200/70 dark:border-blue-400/25",
                danger &&
                    value > 0 &&
                    "border-red-300/80 dark:border-red-400/30",
                danger && value === 0 && "border-border",
                !highlight && !danger && "border-border",
            )}
            animate={
                isActive && value > 0
                    ? {
                          boxShadow: danger
                              ? [
                                    "0 0 0 0 rgba(239,68,68,0)",
                                    "0 0 0 4px rgba(239,68,68,0.12)",
                                    "0 0 0 0 rgba(239,68,68,0)",
                                ]
                              : [
                                    "0 0 0 0 rgba(59,130,246,0)",
                                    "0 0 0 4px rgba(59,130,246,0.12)",
                                    "0 0 0 0 rgba(59,130,246,0)",
                                ],
                      }
                    : { boxShadow: "0 0 0 0 transparent" }
            }
            transition={
                isActive && value > 0
                    ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.3 }
            }
        >
            {/* active indicator bar at top */}
            {isActive && value > 0 && (
                <motion.div
                    className={cn(
                        "absolute inset-x-0 top-0 h-0.5",
                        danger ? "bg-red-500" : "bg-blue-500",
                    )}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            )}
            <span className="text-sm leading-4 text-muted-foreground">
                {label}
            </span>
            <span
                className={cn(
                    "mt-1 text-2xl font-bold tracking-tight tabular-nums",
                    highlight && "text-blue-600 dark:text-blue-300",
                    danger && value > 0 && "text-red-600 dark:text-red-300",
                    danger && value === 0 && "text-muted-foreground",
                )}
            >
                <AnimatedNumber value={value} />
            </span>
        </motion.div>
    )
}

function AnimatedNumber({ value }: { value: number }) {
    const motionValue = useMotionValue(value)
    const spring = useSpring(motionValue, {
        stiffness: 80,
        damping: 32,
        mass: 0.4,
    })
    const rounded = useTransform(spring, (v: number) => Math.round(v))
    const [display, setDisplay] = useState(value)
    const prevValue = useRef(value)

    useEffect(() => {
        if (prevValue.current !== value) {
            motionValue.set(value)
            prevValue.current = value
        }
    }, [value, motionValue])

    useEffect(() => {
        const unsub = rounded.on("change", (v: number) => setDisplay(v))
        return () => unsub()
    }, [rounded])

    return <>{display}</>
}
