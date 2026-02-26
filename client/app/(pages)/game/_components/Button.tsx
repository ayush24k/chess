import { cn } from "@/lib/utils";

export default function Button({ onClick, children, className, disabled, ...otherProps }: {
    onClick: () => void,
    children: React.ReactNode,
    className?: string,
    disabled?: boolean
}) {
    return (
        <button
            className={cn("bg-green-400 text-neutral-900 w-full rounded-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all", className)}
            onClick={onClick}
            disabled={disabled}
            {...otherProps}
        >
            {children}
        </button>
    )
}