import { EyeOff, LucideIcon as LucideIconType } from "lucide-react";

import { Icon, Icons } from "@/components/Icon";
import { LucideIcon } from "@/components/LucideIcon";

export function Title(props: {
  children: React.ReactNode;
  rightSide?: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-medium text-white/70 text-xs uppercase tracking-wider px-4 py-2.5 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center space-x-3">{props.children}</div>
        <div>{props.rightSide}</div>
      </h3>
    </div>
  );
}

export function IconButton(props: {
  icon: Icons | LucideIconType;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={props.onClick}>
      {typeof props.icon === "string" ? (
        <Icon className="text-xl" icon={props.icon as Icons} />
      ) : (
        <LucideIcon className="text-xl" icon={props.icon as LucideIconType} />
      )}
    </button>
  );
}

export function Divider() {
  return (
    <hr className="!my-3.5 border-0 w-full h-px bg-video-context-border" />
  );
}

export function Anchor(props: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <a
      type="button"
      className="text-video-context-type-accent cursor-pointer"
      onClick={props.onClick}
    >
      {props.children}
    </a>
  );
}

export function FieldTitle(props: { children: React.ReactNode }) {
  return <p className="font-medium">{props.children}</p>;
}

export function Paragraph(props: {
  children: React.ReactNode;
  marginClass?: string;
}) {
  return <p className={props.marginClass ?? "my-3"}>{props.children}</p>;
}

export function Highlight(props: { children?: React.ReactNode }) {
  return <span className="text-white">{props.children}</span>;
}

export function TextDisplay(props: {
  children: React.ReactNode;
  title?: string;
  noIcon?: boolean;
}) {
  return (
    <div className="w-full h-full flex justify-center items-center text-center">
      <div className="flex items-center gap-4 flex-col">
        {props.noIcon ? null : (
          <div className="w-16 h-10 border border-video-context-border rounded-lg flex justify-center items-center">
            <LucideIcon className="text-xl" icon={EyeOff} />
          </div>
        )}
        {props.title ? (
          <h2 className="text-white text-lg font-bold">{props.title}</h2>
        ) : null}
        <div>{props.children}</div>
      </div>
    </div>
  );
}
