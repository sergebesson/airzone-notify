// @ts-check

import { WEBSOCKET_URL } from "./services/ApiConfiguration.js";
import { getLogger } from "./services/logger.js";
import { WebsocketMessage } from "./websocket-message.js";

const log = getLogger();

const CODE_CONNECT = "0";
const CODE_PING = "2";
const CODE_PONG = "3";
const CODE_MESSAGE = "4";

const TYPE_OPEN = "0";
const TYPE_INFO_OR_REQUEST = "2";
const TYPE_RESPONSE = "3";

/** @type {WebSocket?} */
let ws = null;

/** @type {boolean} */
let isStopping = false;

process.on("SIGINT", handleExitSignal);
process.on("SIGTERM", handleExitSignal);

function handleExitSignal() {
	if (isStopping) {
		log.verbose("Connexion WebSocket est en cours d'arrêt");
		return;
	}
	isStopping = true;
	log.verbose("Fermeture de la connexion WebSocket...");
	ws?.close();
	ws = null;
}

/**
 * @param {string} token
 * @param {import("./types/airzone.js").Installation} installation
 */
export function connectWebSocket(token, installation) {
	log.verbose("Connexion au WebSocket Airzone...");

	const websocketMessage = new WebsocketMessage(installation);

	const wsUrl = `${WEBSOCKET_URL}?jwt=${token}&EIO=4&transport=websocket`;
	ws = new WebSocket(wsUrl);

	ws.addEventListener("open", () => {
		log.verbose("Connexion WebSocket établie");
		log.verbose("En attente d'événements...");
		ws?.send(`${CODE_MESSAGE}${TYPE_OPEN}`);
	});

	ws.addEventListener("message", (/** @type {{ data: string}} */ { data }) => {
		const { messageCode, messageType, messageId, info } = parseMessage(data);
		switch (messageCode) {
			case CODE_CONNECT:
				log.verbose("Message de connexion reçu", info);
				break;
			case CODE_PING:
				log.debug("Message de ping reçu");
				ws?.send(CODE_PONG);
				log.debug("Message de pong envoyé");
				break;
			case CODE_MESSAGE:
				log.http("message reçu", { data });
				switch (messageType) {
					case TYPE_OPEN:
						break;
					case TYPE_INFO_OR_REQUEST:
						const [messageName, metadata] = info ?? [];
						switch (messageName) {
							case "ready":
								send(ws, ["clear_listeners"], () => {
									log.verbose(
										`Écoute des événements pour l'installation '${installation.name}}' (${installation.installation_id}) ...`
									);
									send(ws, ["listen_installation", installation.installation_id]);
								});
								break;
							case "auth":
								if (!messageId) {
									log.warn("Message d'auth sans messageId");
									break;
								}
								replyAuth(ws, messageId, token);
								break;
							default:
								log.verbose("Message de type info ou request reçu", { messageName, metadata });
								if (messageName) {
									websocketMessage.run({ messageName, metadata });
								}
								break;
						}
						break;
					case TYPE_RESPONSE:
						if (responseListens.has(messageId)) {
							const responseListen = responseListens.get(messageId);
							responseListens.delete(messageId);
							responseListen(messageType, info);
						}
						break;
					default:
						log.warn("Type de message inconnu:", messageType);
				}
				break;
			default:
				log.warn("Unknown message code:", { messageCode });
				break;
		}
	});

	ws.addEventListener("close", () => {
		log.verbose("Connexion WebSocket fermée");
		ws = null;
		if (!isStopping) {
			log.verbose("Tentative de reconnexion dans 5 secondes...");
			setTimeout(() => {
				connectWebSocket(token, installation);
			}, 5000);
		}
	});
	ws.addEventListener("error", () => {
		log.error("Erreur WebSocket");
	});
}

/**
 * Parses a message received from the WebSocket.
 * @param {string} message - The message to parse.
 * @returns {{messageCode: string, messageType?: string, messageId?: number, info?: [string, any] }} - The parsed message.
 */
function parseMessage(message) {
	const messageCode = message[0];

	switch (messageCode) {
		case CODE_CONNECT:
			return { messageCode, ...getIdAndInfoFromMessage(message.substring(1)) };
		case CODE_MESSAGE:
			return { messageCode, messageType: message[1], ...getIdAndInfoFromMessage(message.substring(2)) };
		default:
			return { messageCode };
	}
}

/**
 *
 * @param {string} message
 * @returns {{messageId?: number, info: any}}
 */
function getIdAndInfoFromMessage(message) {
	const jsonStartIndex = message.search(/[\[\{]/);
	if (jsonStartIndex === -1) {
		log.warn("Message sans JSON:", message);
		const messageId = parseInt(message.substring(0, jsonStartIndex));
		return { messageId, info: [] };
	}
	// Extract the number prefix and JSON part
	if (jsonStartIndex === 0) {
		return { info: JSON.parse(message) };
	}
	const messageId = parseInt(message.substring(0, jsonStartIndex));
	return { messageId, info: JSON.parse(message.substring(jsonStartIndex)) };
}

/**
 * Sends a reply to auth request.
 * @param {WebSocket?} ws - The WebSocket instance.
 * @param {number} messageId - The ID of the message to reply to.
 * @param {string} token - The data to send in the reply.
 */
function replyAuth(ws, messageId, token) {
	const message = `${CODE_MESSAGE}${TYPE_RESPONSE}${messageId}["${token}"]`;
	log.http("message envoyé", { data: `${CODE_MESSAGE}${TYPE_RESPONSE}${messageId}[****]` });
	ws?.send(message);
}

let messageSendId = 0;
const responseListens = new Map();
/**
 * Sends a message to the WebSocket.
 * @param {WebSocket?} ws - The WebSocket instance.
 * @param {any} data - The data to send.
 * @param {(messageType: string, info: any) => void} [responseListen] - The function to call when a response is received.
 */
function send(ws, data, responseListen) {
	const message = `${CODE_MESSAGE}${TYPE_INFO_OR_REQUEST}${messageSendId}${JSON.stringify(data)}`;
	log.http("message envoyé", { data: message });
	ws?.send(message);
	if (responseListen) {
		responseListens.set(messageSendId, responseListen);
	}
	messageSendId++;
}
