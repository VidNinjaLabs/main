import classNames from "classnames";

import { Transition } from "@/components/utils/Transition";

export function CenterMobileControls(props: {
  children: React.ReactNode;
  show: boolean;
  className?: string;
}) {
  return (
    <Transition
      animation="fade"
      show={props.show}
      className="pointer-events-none"
    >
      <div
        className={classNames([
          "absolute inset-0 flex justify-center gap-12 items-center px-12 lg:px-48 pointer-events-none [&>*]:pointer-events-auto",
          props.className,
        ])}
      >
        {props.children}
      </div>
    </Transition>
  );
}
