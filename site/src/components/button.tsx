import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cx } from "@/lib/cx.ts";

import styles from "./button.module.css";

type ButtonStyle = {
  variant?: "primary" | "tonal" | "outline" | "danger-tint";
  size?: "sm" | "lg" | "icon";
};

/** Button classes for links: Base UI gives a rendered `<a>` button semantics, so style the link instead. */
export const buttonClass = ({ variant = "primary", size = "sm" }: ButtonStyle = {}) =>
  cx(styles.button, styles[variant], styles[size]);

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: Omit<ButtonPrimitive.Props, "className"> & ButtonStyle & { className?: string }) {
  return (
    <ButtonPrimitive
      type={type}
      className={cx(buttonClass({ variant, size }), className)}
      {...props}
    />
  );
}
