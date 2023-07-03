export function template(
  target: string,
  ...args: ({ toString(): string } | string)[]
) {
  let result = target;
  for (let i = 0; i < args.length; i++) {
    result = result.replace(`{${i + 1}}`, args[i].toString());
  }

  return result;
}
