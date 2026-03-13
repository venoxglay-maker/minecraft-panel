/** Simple class name helper – no external dependency */
export function cn(...args: (string | boolean | undefined | null)[]): string {
  return args.filter(Boolean).join(' ');
}
