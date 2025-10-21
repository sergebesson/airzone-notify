// @ts-check

/**
 * @typedef {{celsius: number, fah: number}} Temperature
 * @typedef { 0 | 1 | 2 | 3 | 4 | 5 } Mode // Mode : 0 Arrêt, 1 inconnu, 2 Rafraîchissement, 3 Chauffage, 4 Ventilation, 5 Déshumidification
 * @typedef { "off" | "manual" | "a"| "a_p" | "a_pp" } EcoConf
 * @typedef {{
 *   data: {
 *     label: string,
 *     title: string,
 *     body: string,
 *     read: boolean,
 *     dt: number,
 *   },
 * }} Notification
 * @typedef {{
 *   installation_id: string,
 *   name: string,
 * }} Installation
 * @typedef {{
 *   device_id: string,
 *   device_type: "az_system" | "az_zone",
 *   status: {
 *     name?: string,
 * 	 },
 * }} DeviceState
 * @typedef {{
 *   device_id: string,
 *   installation_id: string,
 *   change: {
 *     status?: {
 *       eco_conf?: EcoConf, // Global pour toutes les zones
 *       humidity?: number,
 *       local_temp?: Temperature,
 *       mode?: Mode, // Global pour toutes les zones
 *       name?: string,
 *       power?: boolean,
 *       setpoint_air_stop?: Temperature,
 *       setpoint_air_heat?: Temperature,
 *       sleep?: number,
 *     },
 *     user_conf?:{ antifreeze: boolean },
 *   }
 * }} DevicesUpdates
 */

/** @param {Mode} mode */
export function modeName(mode) {
	switch (mode) {
		case 0:
			return "Arrêt";
		case 1:
			return "Inconnu";
		case 2:
			return "Rafraîchissement";
		case 3:
			return "Chauffage";
		case 4:
			return "Ventilation";
		case 5:
			return "Déshumidification";
		default:
			return "Non défini";
	}
}

/** @param {EcoConf} ecoConf */
export function ecoConfName(ecoConf) {
	switch (ecoConf) {
		case "off":
			return "Désactivé";
		case "manual":
			return "Manuel";
		case "a":
			return "Éco A";
		case "a_p":
			return "Éco A+";
		case "a_pp":
			return "Éco A++";
		default:
			return "Non défini";
	}
}
