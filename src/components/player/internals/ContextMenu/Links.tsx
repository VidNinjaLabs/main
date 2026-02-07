import classNames from "classnames";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { ReactNode } from "react";

import { Spinner } from "@/components/layout/Spinner";
import { LucideIcon } from "@/components/LucideIcon";
import { Title } from "@/components/player/internals/ContextMenu/Misc";

export function Chevron(props: { children?: React.ReactNode }) {
  return (
    <span className="text-white/70 flex items-center text-sm">
      {props.children}
      <LucideIcon className="w-4 h-4 ml-1 -mr-1" icon={ChevronRight} />
    </span>
  );
}

export function LinkTitle(props: {
  children: React.ReactNode;
  textClass?: string;
  box?: boolean;
}) {
  return (
    <span
      className={classNames([
        "text-sm text-left",
        props.box
          ? "flex flex-col items-center justify-center h-full gap-1 text-center"
          : "",
        props.textClass || "text-white/90",
      ])}
    >
      {props.children}
    </span>
  );
}

export function BackLink(props: {
  onClick?: () => void;
  children: React.ReactNode;
  rightSide?: React.ReactNode;
  side?: "left" | "right";
}) {
  const { side = "left" } = props;

  if (side === "right") {
    return (
      <Title
        rightSide={
          <button
            type="button"
            className="p-1.5 rounded tabbable hover:bg-white/10 transition-colors"
            onClick={props.onClick}
          >
            <LucideIcon className="w-4 h-4 text-white/70" icon={ArrowRight} />
          </button>
        }
      >
        <button type="button" onClick={props.onClick}>
          <span className="line-clamp-1 break-all">{props.children}</span>
        </button>
      </Title>
    );
  }
  return (
    <Title rightSide={props.rightSide}>
      <button
        type="button"
        className="-ml-2 p-1.5 rounded tabbable hover:bg-white/10 transition-colors"
        onClick={props.onClick}
      >
        <LucideIcon className="w-4 h-4 text-white/70" icon={ArrowLeft} />
      </button>
      <span className="line-clamp-1 break-all">{props.children}</span>
    </Title>
  );
}

export function Link(props: {
  rightSide?: ReactNode;
  clickable?: boolean;
  active?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  children?: ReactNode;
  className?: string;
  box?: boolean;
  disabled?: boolean;
}) {
  const classes = classNames(
    "flex items-center px-4 py-2 rounded-lg transition-colors duration-150", // Smooth hover transition
    props.box ? "bg-white/5 h-20" : "", // Box mode styling
    {
      "cursor-default": !props.clickable,
      "hover:bg-white/10 cursor-pointer tabbable": props.clickable,
      "bg-white/10": props.active,
      "w-full": !props.box,
      "opacity-50 pointer-events-none": props.disabled,
    },
  );
  const styles = {};

  const content = (
    <div
      className={classNames("flex items-center flex-1 h-full", props.className)}
    >
      <div className="flex-1 text-left flex items-center">{props.children}</div>
      <div className="flex items-center">{props.rightSide}</div>
    </div>
  );

  if (!props.onClick) {
    return (
      <div
        className={classes}
        style={styles}
        data-active-link={props.active ? true : undefined}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      style={props.box ? {} : styles}
      onClick={props.onClick}
      onDoubleClick={props.onDoubleClick}
      data-active-link={props.active ? true : undefined}
      disabled={props.disabled}
    >
      {content}
    </button>
  );
}

export function ChevronLink(props: {
  rightText?: string;
  onClick?: () => void;
  children?: ReactNode;
  active?: boolean;
  box?: boolean;
  disabled?: boolean;
}) {
  const rightContent = <Chevron>{props.rightText}</Chevron>;
  return (
    <Link
      onClick={props.onClick}
      active={props.active}
      clickable
      rightSide={props.box ? null : rightContent}
      className={props.box ? "flex flex-col items-center justify-center" : ""}
      box={props.box}
      disabled={props.disabled}
    >
      <LinkTitle box={props.box}>{props.children}</LinkTitle>
    </Link>
  );
}

export function SelectableLink(props: {
  selected?: boolean;
  loading?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  children?: ReactNode;
  disabled?: boolean;
  error?: ReactNode;
  box?: boolean;
}) {
  let rightContent;
  if (props.selected) {
    rightContent = (
      <LucideIcon icon={CheckCircle} className="w-4 h-4 text-white" />
    );
  }
  if (props.error)
    rightContent = (
      <span className="flex items-center text-red-400">
        <LucideIcon className="w-4 h-4 ml-2" icon={AlertTriangle} />
      </span>
    );
  if (props.loading) rightContent = <Spinner className="text-lg" size={20} />; // should override selected and error

  return (
    <Link
      onClick={props.onClick}
      onDoubleClick={props.onDoubleClick}
      clickable={!props.disabled}
      rightSide={rightContent}
      box={props.box}
    >
      <LinkTitle
        textClass={classNames({
          "text-white": props.selected,
          "text-white/40": props.disabled,
        })}
      >
        {props.children}
      </LinkTitle>
    </Link>
  );
}
