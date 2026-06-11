const formatMessage = (level: string, message: string): string =>
  `${new Date().toISOString()} [${level}] ${message}`;

const getErrorName = (error: unknown): string => {
  if (error instanceof Error) {
    return error.name;
  }

  return error === undefined ? "" : "UnknownError";
};

export const logger = {
  info(message: string): void {
    console.info(formatMessage("INFO", message));
  },
  error(message: string, error?: unknown): void {
    console.error(formatMessage("ERROR", message), getErrorName(error));
  },
};
