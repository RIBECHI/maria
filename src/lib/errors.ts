
import { EventEmitter } from 'events';

export interface SecurityRuleContext {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    auth?: { uid: string } | null;
    resource?: any;
}

export class FirestorePermissionError extends Error {
    context: SecurityRuleContext;
    
    constructor(context: SecurityRuleContext) {
        const message = `Firestore Permission Denied: Cannot ${context.operation} on /${context.path}.`;
        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;
        Object.setPrototypeOf(this, FirestorePermissionError.prototype);
    }
}

// Create a single, shared event emitter instance.
export const errorEmitter = new EventEmitter();
