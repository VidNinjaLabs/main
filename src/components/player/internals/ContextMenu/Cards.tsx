export function Card(props: { children: React.ReactNode }) {
  return (
    <div className="flex-col h-full">
      <div className="px-3 pt-2 flex flex-col justify-start overflow-y-auto overflow-x-hidden pb-2 scrollbar-x">
        {props.children}
      </div>
    </div>
  );
}

export function CardWithScrollable(props: { children: React.ReactNode }) {
  return (
    <div className="h-full grid grid-rows-[auto,1fr] [&>*]:px-3 [&>*:first-child]:pt-2 [&>*:nth-child(2)]:overflow-y-auto [&>*:nth-child(2)]:overflow-x-hidden">
      {props.children}
    </div>
  );
}
