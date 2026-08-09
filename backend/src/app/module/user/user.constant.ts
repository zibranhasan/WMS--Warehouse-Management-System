export const userSearchableFields: string[] = ["name", "email"];

export const userFilterableFields: string[] = [
    "searchTerm",
    "role",
    "status",
    "isDeleted",
    "emailVerified",
    "needPasswordChange",
    "createdAt",
    "updatedAt",
    "id",
    "email",
    "name",
];

export const userPaginationOptionsFields: string[] = [
    "page",
    "limit",
    "sortBy",
    "sortOrder",
];

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const DEFAULT_SORT_BY = "createdAt";
export const DEFAULT_SORT_ORDER = "desc";
