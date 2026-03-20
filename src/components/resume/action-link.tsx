import type { VariantProps } from 'class-variance-authority';
import type { AnchorHTMLAttributes } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ActionLink({
	className,
	variant,
	size,
	...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & VariantProps<typeof buttonVariants>) {
	return <a className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
