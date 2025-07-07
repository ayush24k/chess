export default function Button({ onClick, children, ...otherProps }: {
    onClick: () => void,
    children: React.ReactNode,
}) {
    return (
        <button
            className="bg-green-400 text-neutral-900 w-full rounded-sm py-2"
            onClick={onClick}
            {...otherProps}
        >
            {children}
        </button>
    )
}