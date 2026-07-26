export default function enumKeys<T extends object>(e: T) {
  const keys = Object.keys(e)
  const isStringEnum = isNaN(Number(keys[0]))
  return isStringEnum ? keys : keys.slice(keys.length / 2)
}