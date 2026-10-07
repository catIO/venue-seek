export function VenueMark({ className = "size-6" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            fill="none"
            className={`shrink-0 ${className}`}
        >
            <path
                d="M24 3.5c-9.3 0-16.8 7.5-16.8 16.8C7.2 32.5 24 45 24 45s16.8-12.5 16.8-24.7C40.8 11 33.3 3.5 24 3.5Z"
                fill="currentColor"
            />
            <g transform="translate(6 6) scale(1.5)">
                <path
                    d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                    fill="var(--md-primary-container)"
                />
            </g>
        </svg>
    );
}
