//@ts-check

/**
 * Application qui se connecte à Airzone Cloud et log tous les événements arrivant sur le WebSocket
 */
import { getLogger } from "./services/logger.js";
import { login } from "./login.js";
import { getNotifications } from "./notification.js";
import { connectWebSocket } from "./websocket.js";
import { getInstallation } from "./installations.js";

const log = getLogger();

/**
 * Fonction principale qui orchestre les différentes étapes
 */
async function main() {
	try {
		// Étape 1: Connexion à Airzone Cloud
		const token = await login();

		// Étape 2: Récupération des notifications
		await getNotifications(token);

		// Étape 3 Récupération de l'ID de l'installation
		const installation = await getInstallation(token);

		// Étape 4: Connexion au WebSocket
		connectWebSocket(token, installation);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorCause = error instanceof Error ? error.cause : undefined;
		const errorStack = error instanceof Error ? error.stack : undefined;
		const errorDetails = error && typeof error === "object" && "details" in error ? error.details : undefined;

		log.error("Erreur générale", {
			message: errorMessage,
			cause: errorCause,
			details: errorDetails,
			stack: errorStack,
		});
		console.error("Erreur générale:", errorMessage, errorCause, errorDetails);
		console.error("Stack:", errorStack);
	}
}

// Lancement de l'application
main();
