// @ts-check

import { NOTIFICATIONS_URL } from "./services/ApiConfiguration.js";
import { getLogger } from "./services/logger.js";

const log = getLogger();

/** @param {string} token */
export async function getNotifications(token) {
	log.verbose("Récupération des dernières notifications...");

	const url = new URL(NOTIFICATIONS_URL.trim());
	url.searchParams.set("lang", "fr");
	url.searchParams.set("page", "0");
	url.searchParams.set("items", "1");
	url.searchParams.set("order", "desc");
	url.searchParams.set("sort", "dt");
	url.searchParams.set("platform", "web");

	const response = await fetch(url, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Erreur HTTP: ${response.status}`);
	}

	/** @type {{ notifications: import("./types/airzone.js").Notification[] }} */
	const { notifications } = await response.json();
	const unreadNotifications = notifications.filter(({ data }) => !data.read);
	if (unreadNotifications.length !== 0) {
		log.info("Dernière notification:");
		unreadNotifications.forEach(({ data }) => log.info(`* [${data.dt}] ${data.title}`));
	}
}
