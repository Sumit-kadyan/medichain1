// src/firebase/errors.ts

/**
 * Defines the shape of the context for a Firestore security rule denial.
 */
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

/**
 * A custom error class for Firestore permission errors that includes
 * detailed context about the failed operation. This is used to provide
 * rich, actionable error messages in the development overlay.
 */
export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const operation = context.operation.toUpperCase();
    const formattedContext = JSON.stringify(context, null, 2);

    const message = `
FirestoreError: Missing or insufficient permissions.
The following ${operation} request on path '${context.path}' was denied by Firestore Security Rules.

Review your security rules and the request context below to fix the issue.

${formattedContext}
`;

    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is necessary for custom errors in TypeScript when targeting ES5
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
