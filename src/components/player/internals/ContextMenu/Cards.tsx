export function Card(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 flex flex-col justify-start overflow-y-auto overflow-x-hidden">
        {props.children}
      </div>
    </div>
  );
}

export function CardWithScrollable(props: { children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 py-2">
        {props.children}
      </div>
    </div>
  );
}
