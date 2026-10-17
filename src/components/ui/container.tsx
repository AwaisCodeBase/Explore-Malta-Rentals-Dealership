import type { JSX, ReactNode } from "react";

type ContainerProps = Readonly<{
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}>;

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Container({
  children,
  className,
  as: Component = "div",
}: ContainerProps) {
  return (
    <Component
      className={joinClasses(
        "mx-auto w-full max-w-7xl min-w-0 px-5 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </Component>
  );
}
