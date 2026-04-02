import { addService, getServices } from './api';
import { SERVICES } from '../data/services';

/**
 * Migration script to populate Firestore with initial services.
 * Can be called from a temporary button in the Admin Dashboard or run manually.
 */
export const migrateServicesToFirestore = async () => {
  try {
    const existingServices = await getServices();
    
    // Only migrate if the collection is empty (or only contains the fallback static ones)
    // We check if the ID is just '01', '02' etc which are the static IDs
    const isActuallyFirestore = existingServices.some(s => s.id && s.id.length > 5);
    
    if (isActuallyFirestore) {
      console.log("Services already exist in Firestore. Skipping migration.");
      return { success: true, message: "Already migrated" };
    }

    console.log("Starting services migration...");
    for (const service of SERVICES) {
      // Omit ID to let Firestore generate one, or keep it if you want predictable IDs
      // Here we keep them for consistency but Firestore IDs are generally better.
      // Let's let Firestore generate them and we'll update the references.
      const { id, ...serviceData } = service;
      await addService(serviceData);
    }
    
    console.log("Migration complete!");
    return { success: true, message: "Migration complete" };
  } catch (error) {
    console.error("Migration failed:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};
