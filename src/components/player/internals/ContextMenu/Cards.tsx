export function Card(props: { children: React.ReactNode }) {
  return (
    <div className="max-h-full flex flex-col">
      <div className="px-6 flex flex-col justify-start overflow-y-auto overflow-x-hidden pb-2 scrollbar-none">
        {props.children}
      </div>
    </div>
  );
}

export function CardWithScrollable(props: { children: React.ReactNode }) {
  return (
    <div className="[&>*]:px-6 h-full grid grid-rows-[auto,1fr] [&>*:nth-child(2)]:overflow-y-auto [&>*:nth-child(2)]:overflow-x-hidden">
      {props.children}
    </div>
  );
}
