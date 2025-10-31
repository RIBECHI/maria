
export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};

const DENIED_MESSAGE_LEADER = 'FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:';

/**
 * A custom error class for Firestore permission errors that includes rich
 * context about the request that was denied. This is used to provide a better
 * debugging experience in the Next.js development error overlay.
 */
export class FirestorePermissionError extends Error {
    public readonly context: SecurityRuleContext;

    constructor(context: SecurityRuleContext) {
        // Construct the detailed error message for the Next.js overlay
        const message = [
            DENIED_MESSAGE_LEADER,
            JSON.stringify(
                {
                    // This is a placeholder for the auth object, which will be filled in
                    // by the Firebase security rules emulator when it catches the error.
                    auth: { uid: 'some-user-id', token: { /* decoded token claims */ } },
                    method: context.operation,
                    path: `/databases/(default)/documents/${context.path}`,
                    ...(context.requestResourceData && { resource: { data: context.requestResourceData } }),
                },
                null,
                2
            ),
        ].join('\n');
        
        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;
        
        // This is necessary for Error subclasses in TypeScript.
        Object.setPrototypeOf(this, FirestorePermissionError.prototype);
    }
}
