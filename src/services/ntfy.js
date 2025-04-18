// @ts-check

import { getConfigLoader } from "./loadConfiguration.js";

export class NtfyService {
	/**
	 * @typedef {{
	 *   url: string,
	 *   token: string,
	 *   topic: string,
	 *   default_priority: number,
	 *   icon?: string,
	 * }} Config
	 *
	 * @type {Config?} */
	#config = null;

	/**
	 * @returns {Promise<Config>}
	 */
	async #getConfig() {
		if (!this.#config) {
			this.#config = /** @type {Config} */ ((await getConfigLoader()).getValue("ntfy", {}));
		}
		return this.#config ?? {};
	}

	/**
	 * @param {{ title: string, message: string, tags?: string[], priority?: number }} options
	 * @returns {Promise<void>}
	 */
	async sendNotification({ title, message, tags = [], priority }) {
		const { url, token, topic, default_priority, icon } = await this.#getConfig();

		const headers = new Headers();
		headers.append("Content-Type", "application/json");
		headers.append("Authorization", `Bearer ${token}`);

		const body = JSON.stringify({
			topic,
			markdown: true,
			title,
			message: `---\n${message}`,
			tags,
			priority: priority ?? default_priority,
			icon,
		});

		const response = await fetch(url, { headers, method: "POST", body });

		if (!response.ok) {
			throw new Error(`Erreur HTTP lors de l'envoi de la notification: ${response.status}`);
		}
	}
}
