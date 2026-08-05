export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class AuthenticationError extends DomainError {
  constructor() {
    super("UNAUTHENTICATED", "Debes iniciar sesión para continuar.");
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends DomainError {
  constructor() {
    super("FORBIDDEN", "No tienes permisos para realizar esta operación.");
    this.name = "AuthorizationError";
  }
}
