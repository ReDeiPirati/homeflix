import path from "path";

/**
 * Validates and resolves a user-provided path against a root directory.
 * Prevents path traversal attacks by ensuring the resolved path stays within root.
 *
 * @param userPath - The user-provided path (may be URL-encoded)
 * @param root - The root directory to validate against
 * @returns The resolved absolute path if valid, null if path traversal detected
 */
export function validatePath(userPath: string, root: string): string | null {
  // URL-decode the path
  const decodedPath = decodeURIComponent(userPath);

  // Resolve the full path
  const resolvedRoot = path.resolve(root);
  const resolvedPath = path.resolve(resolvedRoot, decodedPath);

  // Ensure the resolved path starts with the root directory
  if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot) {
    return null;
  }

  return resolvedPath;
}
