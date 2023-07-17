export function deepClone<T extends object = any>(
  obj: T,
  visited = new WeakMap(),
): T {
  // Handle non-object types or primitives
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle circular references to prevent infinite loops
  if (visited.has(obj)) {
    return visited.get(obj);
  }

  let clonedObject: object;

  // Handle special cases for some types
  if (obj instanceof Date) {
    clonedObject = new Date(obj);
  } else if (obj instanceof RegExp) {
    clonedObject = new RegExp(obj);
  } else {
    // Get the prototype of the object
    const prototype = Object.getPrototypeOf(obj);

    // Create a new object with the same prototype
    clonedObject = Object.create(prototype);

    // Save the cloned object in the visited map to handle circular references
    visited.set(obj, clonedObject);

    // Clone the properties of the object
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObject[key as string] = deepClone(obj[key] as T, visited);
      }
    }
  }

  return clonedObject as T;
}
