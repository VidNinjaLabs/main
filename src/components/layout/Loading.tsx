import { Spinner } from "./Spinner";

export interface LoadingProps {
  text?: string;
  className?: string;
}

export function Loading(props: LoadingProps) {
  return (
    <div className={props.className}>
      <div className="flex flex-col items-center justify-center">
        <Spinner />
        {props.text && props.text.length ? (
          <p className="mt-3 max-w-xs text-sm opacity-75">{props.text}</p>
        ) : null}
      </div>
    </div>
  );
}
