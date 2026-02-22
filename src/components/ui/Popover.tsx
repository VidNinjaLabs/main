import * as PopoverPrimitive from "@radix-ui/react-popover";
import { forwardRef } from "react";
import classNames from "classnames";

// Popover Root - wraps the entire popover
const PopoverRoot = (
  props: React.ComponentProps<typeof PopoverPrimitive.Root>,
) => <PopoverPrimitive.Root modal={false} {...props} />;

// Popover Trigger - the element that opens the popover
const PopoverTrigger = PopoverPrimitive.Trigger;

// Popover Portal - renders content in a portal
const PopoverPortal = PopoverPrimitive.Portal;

// Popover Close - closes the popover
const PopoverClose = PopoverPrimitive.Close;

// Popover Arrow
const PopoverArrow = forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Arrow
    ref={ref}
    className={classNames("fill-video-context-background/95", className)}
    {...props}
  />
));
PopoverArrow.displayName = "PopoverArrow";

// Popover Content - the actual popover panel
const PopoverContent = forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    showArrow?: boolean;
    container?: HTMLElement | null;
  }
>(
  (
    {
      className,
      align = "center",
      sideOffset = 8,
      showArrow = false,
      container,
      children,
      ...props
    },
    ref,
  ) => {
    const portalContainer =
      container ||
      document.getElementById("vidninja-portal-mount") ||
      document.getElementById("vidninja-player-container") ||
      document.body;

    return (
      <PopoverPrimitive.Portal container={portalContainer}>
        <PopoverPrimitive.Content
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          className={classNames(
            // Base styles
            "z-[100] rounded-2xl overflow-hidden pointer-events-auto",
            // Background with blur
            "bg-[#1a1a1a]/95 backdrop-blur-xl",
            // Shadow
            "shadow-2xl shadow-black/50",
            // Animation
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2",
            className,
          )}
          {...props}
        >
          {children}
          {showArrow && <PopoverArrow />}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    );
  },
);
PopoverContent.displayName = "PopoverContent";

// Export all parts
export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Portal: PopoverPortal,
  Content: PopoverContent,
  Close: PopoverClose,
  Arrow: PopoverArrow,
};

export {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverClose,
  PopoverArrow,
};
