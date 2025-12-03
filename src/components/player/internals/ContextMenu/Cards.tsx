export function Card(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-2 flex flex-col justify-start overflow-y-auto overflow-x-hidden pb-2 scrollbar-x">
        {props.children}
      </div>
    </div>
  );
}

export function CardWithScrollable(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col max-h-full">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-3 pt-2 shrink-0">
          {/* First child: header/non-scrollable content */}
          {Array.isArray(props.children) ? props.children[0] : null}
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2 scrollbar-x">
          {/* Second child: scrollable content */}
          {Array.isArray(props.children)
            ? props.children.slice(1)
            : props.children}
        </div>
      </div>
    </div>
  );
}
