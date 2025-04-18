// @ts-check

import { getLogger } from "./services/logger.js";
import { NtfyService } from "./services/ntfy.js";
import { ecoConfName, modeName } from "./types/airzone.js";

/**
 * @typedef {import("./types/airzone.js").DeviceState} DeviceState
 * @typedef {import("./types/airzone.js").DevicesUpdates} DevicesUpdates
 * @typedef {import("./types/airzone.js").Installation} Installation
 * @typedef {import("./types/airzone.js").EcoConf} EcoConf
 */

export class WebsocketMessage {
	#log = getLogger();

	/** @type {Installation} */
	#installation;

	/** @type {Map<string, string>} */
	#devicesName = new Map();

	/** @type {number?} */
	#currentMode;

	/** @type {EcoConf?} */
	#currentEcoConf;

	/** @type {NtfyService} */
	#ntfyService;

	/** @param {Installation} installation */
	constructor(installation) {
		this.#installation = installation;
		this.#currentMode = null;
		this.#currentEcoConf = null;
		this.#ntfyService = new NtfyService();
	}

	/**
	 * @param {{
	 *   messageName: string,
	 *   metadata: DeviceState | DevicesUpdates,
	 * }} params
	 */
	run({ messageName, metadata }) {
		switch (messageName.split(".")[0]) {
			case "DEVICE_STATE":
				this.#messageNameDeviceState(/** @type {DeviceState} */ (metadata));
				break;
			case "DEVICE_STATE_END":
				this.#log.info("Liste des zones", Object.fromEntries(this.#devicesName));
				break;
			case "DEVICES_UPDATES":
				this.#messageNameDevicesUpdates(/** @type {DevicesUpdates} */ (metadata));
				break;
			default:
				// Handle other message types
				this.#log.verbose("Message WebSocket reçu", { messageName, metadata });
				break;
		}
	}

	/**
	 * @param {DeviceState} metadata
	 */
	#messageNameDeviceState({ device_id, device_type, status: { name } }) {
		if (device_type !== "az_zone") {
			return;
		}

		this.#devicesName.set(`${device_id}`, name ?? "Zone sans nom");
	}

	/**
	 * @param {DevicesUpdates} metadata
	 */
	#messageNameDevicesUpdates({ device_id, change, change: { status, user_conf } }) {
		const deviceName = this.#devicesName.get(device_id) ?? device_id;
		const installationName = this.#installation.name;
		let sendNotification = false;

		if (status?.setpoint_air_stop !== undefined) {
			this.#log.info(
				`Mise à jour de la consigne pour l'installation "${installationName}" la zone "${deviceName}"`,
				{ degrés: status.setpoint_air_stop.celsius }
			);
			this.#ntfyService.sendNotification({
				title: `${installationName} - Consigne mise à jour`,
				message: `La consigne a été mise à jour à **${status.setpoint_air_stop.celsius}°C** dans la zone **${deviceName}**.`,
			});
			sendNotification = true;
		}

		if (status?.power !== undefined) {
			this.#log.info(
				`Mise à jour de l'état d'alimentation pour l'installation "${installationName}" la zone "${deviceName}"`,
				{ power: status.power }
			);
			this.#ntfyService.sendNotification({
				title: `${installationName} - Alimentation ${status.power ? "activée" : "désactivée"}`,
				message: `L'alimentation a été **${
					status.power ? "activée" : "désactivée"
				}** dans la zone **${deviceName}**.`,
			});
			sendNotification = true;
		}

		if (status?.mode !== undefined) {
			if (status.mode !== this.#currentMode) {
				this.#currentMode = status.mode;
				this.#log.info(
					`Mise à jour du mode pour l'installation "${installationName}" la zone "${deviceName}"`,
					{ mode: modeName(status.mode) }
				);
				this.#ntfyService.sendNotification({
					title: `${installationName} - Mode changé`,
					message: `Le mode a été changé à **${modeName(status.mode)}**.`,
				});
			}
			sendNotification = true;
		}

		if (status?.eco_conf !== undefined) {
			if (status.eco_conf !== this.#currentEcoConf) {
				this.#currentEcoConf = status.eco_conf;
				this.#log.info(
					`Mise à jour du mode éco pour l'installation "${installationName}" la zone "${deviceName}"`,
					{ eco_conf: ecoConfName(status.eco_conf) }
				);
				this.#ntfyService.sendNotification({
					title: `${installationName} - Mode éco changé`,
					message: `Le mode éco a été changé à **${ecoConfName(status.eco_conf)}**.`,
				});
			}
			sendNotification = true;
		}

		if (status?.sleep !== undefined) {
			this.#log.info(
				`Mise à jour du mode sommeil pour l'installation "${installationName}" la zone "${deviceName}"`,
				{ sleep: status.sleep }
			);
			this.#ntfyService.sendNotification({
				title: `${installationName} - Mode sommeil mis à jour`,
				message: `Le mode sommeil a été mis à jour à **${status.sleep} heures** dans la zone **${deviceName}**.`,
			});
			sendNotification = true;
		}

		if (user_conf?.antifreeze !== undefined) {
			this.#log.info(
				`Mise à jour de la configuration anti-gel pour l'installation "${installationName}" la zone "${deviceName}"`,
				{ antifreeze: user_conf.antifreeze }
			);
			this.#ntfyService.sendNotification({
				title: `${installationName} - Configuration anti-gel mise à jour`,
				message: `La configuration anti-gel a été **${
					user_conf.antifreeze ? "activée" : "désactivée"
				}** dans la zone **${deviceName}**.`,
			});
			sendNotification = true;
		}

		if (status?.name !== undefined) {
			this.#log.info(
				`Mise à jour du nom de l'appareil pour l'installation "${installationName}" la zone "${deviceName}"`,
				{ newName: status.name }
			);
			this.#ntfyService.sendNotification({
				title: `${installationName} - Nom de la zone mis à jour`,
				message: `Le nom de la zone **${deviceName}** a été changé à **${status.name}**.`,
			});
			this.#devicesName.set(device_id, status.name);
			sendNotification = true;
		}

		if (!sendNotification) {
			this.#log.verbose("Mise à jour reçue sans notification", { deviceName, installationName, change });
		}
	}
}
