import { Operation } from "fast-json-patch";

// Trust ChatGPT :>
export function reversePatch(original: any, patch: Operation[]): Operation[] {
  const reversedPatch: Operation[] = [];

  // Iterate through the patch in reverse order
  for (let i = patch.length - 1; i >= 0; i--) {
    const op = patch[i];

    switch (op.op) {
      case "add":
        // Reverse "add" by "remove"
        reversedPatch.push({ op: "remove", path: op.path });
        break;

      case "remove":
        // Reverse "remove" by "add", with the value restored
        const removedValue = getValueByPath(original, op.path);
        reversedPatch.push({ op: "add", path: op.path, value: removedValue });
        break;

      case "replace":
        // Reverse "replace" by restoring the original value
        const replacedValue = getValueByPath(original, op.path);
        reversedPatch.push({
          op: "replace",
          path: op.path,
          value: replacedValue,
        });
        break;

      case "move":
        // Reverse "move" by swapping source and destination
        reversedPatch.push({ op: "move", from: op.path, path: op.from! });
        break;

      case "copy":
        // Optionally reverse "copy" by "remove"
        reversedPatch.push({ op: "remove", path: op.path });
        break;

      default:
        throw new Error(`Unsupported operation: ${op.op}`);
    }
  }

  return reversedPatch;
}

// Helper to get a value by path in a JSON object
function getValueByPath(obj: any, path: string): any {
  const keys = path.split("/").slice(1); // Split and remove the leading slash
  return keys.reduce((acc, key) => acc?.[key], obj);
}
