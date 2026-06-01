const orderIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/

export const isSafeOrderId = (orderId: string) => orderIdPattern.test(orderId)
