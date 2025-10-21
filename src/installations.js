// @ts-check

import { INSTALLATIONS_URL } from "./services/ApiConfiguration.js";
import { getLogger } from "./services/logger.js";
import { getConfigLoader } from "./services/loadConfiguration.js";

const log = getLogger();

/** @param {string} token */
export async function getInstallation(token) {
	log.verbose("Récupération des installations...");

	const installationName = (await getConfigLoader()).getValue("airzone.installation", "");
	if (!installationName) {
		throw new Error("Le nom de l'installation n'est pas configuré.");
	}
	log.verbose(`Installation configurée: '${installationName}'`);

	const response = await fetch(INSTALLATIONS_URL.trim(), {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Erreur HTTP: ${response.status}`);
	}

	/** @type {{ installations: import("./types/airzone.js").Installation[] }} */
	const { installations } = await response.json();
	log.debug(`Nombre d'installations récupérées: ${installations.length}`);

	const installation = installations.find((installation) => installation.name === installationName);
	if (!installation) {
		throw new Error(`Installation nommée '${installationName}' non trouvée.`);
	}

	log.verbose(`Installation sélectionnée: '${installation.name}' (ID: ${installation.installation_id})`);
	return installation;
}
