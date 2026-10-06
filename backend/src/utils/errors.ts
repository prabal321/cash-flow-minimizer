import { GraphQLError } from 'graphql'

export function requireAuth(user: unknown): asserts user is { id: string; email: string } {
  if (!user) {
    throw new GraphQLError('You must be logged in', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }
}

export function notFound(entity: string): never {
  throw new GraphQLError(`${entity} not found`, {
    extensions: { code: 'NOT_FOUND' },
  })
}

export function forbidden(): never {
  throw new GraphQLError('You do not have permission to perform this action', {
    extensions: { code: 'FORBIDDEN' },
  })
}

export function badRequest(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: 'BAD_REQUEST' },
  })
}

export function dbError(error: { message: string }): never {
  throw new GraphQLError(`Database error: ${error.message}`, {
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  })
}
