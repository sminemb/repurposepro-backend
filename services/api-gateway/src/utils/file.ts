import { unlink } from "node:fs/promises";

export const deleteFileIfExists = async (
  filePath: string | undefined,
): Promise<void> => {
  if (filePath === undefined || filePath.trim().length === 0) {
    return;
  }

  try {
    await unlink(filePath);
  } catch {
    return;
  }
};
