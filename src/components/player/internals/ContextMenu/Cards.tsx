export function Card(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-auto max-h-full">
      <div className="px-4 py-3 flex flex-col justify-start overflow-y-auto overflow-x-hidden scrollbar-hide">
        {props.children}
      </div>
    </div>
  );
}

export function CardWithScrollable(props: { children: React.ReactNode }) {
  return (
    <div className="h-auto max-h-full flex flex-col">
      <div className="overflow-y-auto overflow-x-hidden px-3 py-3 scrollbar-hide">
        {props.children}
      </div>
    </div>
  );
}
