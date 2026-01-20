interface SpinnerProps {
  className?: string;
  /** Fixed size in pixels. If not provided, uses responsive default (96px) */
  size?: number;
}

// Standard size: 96px everywhere for consistency
const DEFAULT_SIZE = 96;

export function Spinner(props: SpinnerProps) {
  const size = props.size || DEFAULT_SIZE;

  return (
    <div
      className={`inline-flex ${props.className || ""}`}
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Simple CSS spinner */}
      <div
        className="border-8 border-white/20 border-t-white rounded-full animate-spin"
        style={{
          width: size,
          height: size,
        }}
      />
    </div>
  );
}
