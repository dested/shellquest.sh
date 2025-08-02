import * as React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-brand-100 text-brand-900 border border-brand-200 hover:bg-brand-200',
        secondary: 'bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200',
        destructive: 'bg-error-light/20 text-error-dark border border-error-light/30 hover:bg-error-light/30',
        outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
        success: 'bg-success-light/20 text-success-dark border border-success-light/30 hover:bg-success-light/30',
        warning: 'bg-warning-light/20 text-warning-dark border border-warning-light/30 hover:bg-warning-light/30',
        info: 'bg-info-light/20 text-info-dark border border-info-light/30 hover:bg-info-light/30',
        purple: 'bg-accents-purple-light/20 text-accents-purple-dark border border-accents-purple-light/30 hover:bg-accents-purple-light/30',
      },
      size: {
        default: 'px-3 py-1 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({className, variant, ...props}: BadgeProps) {
  return <div className={cn(badgeVariants({variant}), className)} {...props} />;
}

export {Badge, badgeVariants};
