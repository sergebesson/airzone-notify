// @ts-check

import { LOGIN_URL } from "./services/ApiConfiguration.js";
import { getConfigLoader } from "./services/loadConfiguration.js";
import { getLogger } from "./services/logger.js";

const log = getLogger();

export async function login() {
	/** @type {{ email: string, password: string }} */
	const { email, password } = (await getConfigLoader()).getValue("airzone", {});

	log.verbose(`Connexion à Airzone Cloud avec l'email ${email}...`);

	const response = await fetch(LOGIN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});

	if (!response.ok) {
		throw new Error(`Erreur HTTP: ${response.status}`);
	}

	/**
	 * @type {{
	 *   _id: string,
	 *   email: string,
	 *   data: {
	 *     name: string,
	 *     lastName: string,
	 *     commercial: boolean,
	 *     toc: boolean,
	 *   },
	 *   config: {
	 *     lang: string,
	 *     ampm: boolean,
	 *     units: number,
	 *     noHaptic: boolean,
	 *     sundayFirst: boolean,
	 *     notification: boolean,
	 *   },
	 *   token: string,
	 *   refreshToken: string,
	 * }}
	 */
	const data = await response.json();
	log.info("Connexion à Airzone Cloud réussie", {
		email: data.email,
		name: data.data.name,
		lastName: data.data.lastName,
	});
	return data.token;
}
