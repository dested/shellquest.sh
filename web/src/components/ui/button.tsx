import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-brand-500 text-neutral-900 shadow-button hover:bg-brand-600 hover:shadow-button-hover hover:-translate-y-0.5 active:translate-y-0',
        destructive: 'bg-error text-white shadow-button hover:bg-error-dark hover:shadow-button-hover hover:-translate-y-0.5 active:translate-y-0',
        outline:
          'border-2 border-neutral-300 bg-white shadow-sm hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-md',
        secondary: 'bg-neutral-100 text-neutral-900 shadow-sm hover:bg-neutral-200 hover:shadow-md',
        ghost: 'hover:bg-neutral-100 hover:text-neutral-900',
        link: 'text-brand-600 underline-offset-4 hover:underline hover:text-brand-700',
        brand: 'bg-gradient-to-r from-brand-500 to-brand-600 text-neutral-900 shadow-button hover:shadow-glow-sm hover:-translate-y-0.5 active:translate-y-0',
        success: 'bg-success text-white shadow-button hover:bg-success-dark hover:shadow-button-hover hover:-translate-y-0.5 active:translate-y-0',
      },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({className, variant, size, asChild = false, ...props}, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({variant, size, className}))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export {Button, buttonVariants};
