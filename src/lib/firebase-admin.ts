import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Este arquivo agora exporta apenas as instâncias, a inicialização será feita on-demand.
// Isso evita problemas de ordem de execução em ambientes serverless.

// Se precisar do adminDb em outro lugar, a inicialização terá que ser garantida lá também.
const adminDb = admin.firestore();
const adminStorage = admin.storage();

export { adminDb, adminStorage, admin };
