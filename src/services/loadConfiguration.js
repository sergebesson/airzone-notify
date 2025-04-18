// @ts-check

import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigLoader } from "@sbesson/configuration-loader";

/** @type {ConfigLoader?} */
let configLoader = null;

export async function getConfigLoader() {
	if (!configLoader) {
		configLoader = await loadConfiguration();
	}
	return configLoader;
}

export async function loadConfiguration() {
	const configLoader = new ConfigLoader({});
	await configLoader.load([
		{
			type: "file",
			file: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "configuration.json"),
		},
	]);
	if (configLoader.hasLayersInError()) {
		throw new Error("Impossible de charger la configuration", { cause: configLoader.getLayersInError() });
	}

	return configLoader;
}
