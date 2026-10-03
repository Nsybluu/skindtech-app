import { extendTailwindMerge } from 'tailwind-merge';

import { TextVariants, kebabCase } from '@/constants/text-variants';

const textSizes = Object.keys(TextVariants).flatMap((variant) => [kebabCase(variant), `${kebabCase(variant)}-th`]);

/**
 * Tailwind decides which of two conflicting classes wins by their order in the generated CSS, not
 * by their order in `className`. `cn` removes the losing one, so a component can take a default
 * class (`bg-surface-card`) and let its caller replace it (`bg-brand-primary`).
 *
 * The project's own names are taught to tailwind-merge: without this `text-body` (a size) would
 * be taken for a colour and wipe out `text-fg-muted`.
 */
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...textSizes, 'field', 'field-multiline'] }],
      rounded: [{ rounded: ['sheet', 'pill'] }],
    },
  },
});

export type ClassValue = string | false | null | undefined;

export function cn(...inputs: ClassValue[]): string {
  return merge(inputs.filter(Boolean).join(' '));
}
