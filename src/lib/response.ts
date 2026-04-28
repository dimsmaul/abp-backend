/**
 * Standard paginated response format.
 *
 * Shape:
 * {
 *   message: string,
 *   data: {
 *     meta: { page, limit, total_record, total_page },
 *     items: T[]
 *   }
 * }
 */
export function paginatedResponse<T>(
  items: T[],
  meta: { page: number; limit: number; total: number },
  message = 'Success'
) {
  return {
    message,
    data: {
      meta: {
        page: meta.page,
        limit: meta.limit,
        total_record: meta.total,
        total_page: Math.ceil(meta.total / meta.limit),
      },
      items,
    },
  }
}

/**
 * Standard single-resource / list response.
 */
export function successResponse<T>(data: T, message = 'Success') {
  return { message, data }
}

/**
 * Standard error response.
 */
export function errorResponse(code: string, message: string, details?: any) {
  return {
    message,
    error: { code, ...(details ? { details } : {}) },
  }
}
