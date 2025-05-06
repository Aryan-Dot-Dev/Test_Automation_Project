import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"

interface ButtonVariantsProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

// Helper function to concatenate class names
function classNames(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const buttonVariants = ({ variant = 'default', size = 'default', className }: ButtonVariantsProps) => {
  const baseClasses = "btn";
  
  // Variant classes
  const variantClasses = {
    default: "btn-primary",
    destructive: "btn-destructive",
    outline: "btn-outline",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    link: "btn-link"
  };
  
  // Size classes
  const sizeClasses = {
    default: "btn-default",
    sm: "btn-sm",
    lg: "btn-lg",
    icon: "btn-icon"
  };
  
  return classNames(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
