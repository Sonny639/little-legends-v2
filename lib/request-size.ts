export const getRequestContentLength = (request: Request) => {
  const contentLength = Number(request.headers.get("content-length") || 0)
  return Number.isFinite(contentLength) && contentLength > 0 ? contentLength : 0
}

export const isRequestTooLarge = (request: Request, maxBytes: number) => {
  const contentLength = getRequestContentLength(request)
  return contentLength > maxBytes
}
