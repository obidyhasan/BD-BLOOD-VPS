export type IOptions = {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: string;
};

export type IOptionsResult = {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const calculatePagination = (options: IOptions): IOptionsResult => {
  const page: number = toPositiveInt(options.page, 1);
  // Clamp limit so an unbounded/adversarial `?limit=` can't force the server
  // to fetch and serialize an unbounded result set.
  const limit: number = Math.min(
    toPositiveInt(options.limit, DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const skip: number = (page - 1) * limit;

  const sortBy: string = options.sortBy || "createdAt";
  const sortOrder: string =
    options.sortOrder === "asc" || options.sortOrder === "desc"
      ? options.sortOrder
      : "desc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export const paginationHelper = {
  calculatePagination,
};
