export interface APIResponse<T> {
  success: boolean,
  data: T,
  error?: Error
}

export class ApiError extends Error {

  public toJSON () {
    return {
      message: this.message,
      cause: this.cause,
    }
  }
}

export function makeApiHttpResponse<T> (success: boolean, data?: T, error?: ApiError, init?: ResponseInit): Response {
  return new Response(JSON.stringify(makeApiResponse(success, data, error)), init)
}

export function makeApiResponse<T> (success: boolean, data?: T, error?: ApiError): APIResponse<T> {
  return {
    success,
    data: data as T,
    error
  }
}

export function makeApiFailResponse<T> (error?: ApiError): APIResponse<T> {
  return makeApiResponse<T>(false, undefined, error)
}

export function makeApiSuccessResponse<T> (data?: T): APIResponse<T> {
  return makeApiResponse(true, data)
}