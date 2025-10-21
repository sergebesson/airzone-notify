// @ts-check

import { createLogger, format, transports } from "winston";
import { getConfigLoader } from "./loadConfiguration.js";

const configLoader = await getConfigLoader();

/** @type {import("winston").Logger?} */
let logger = null;

export function getLogger() {
	if (!logger) {
		logger = initLogger();
	}
	return logger;
}

export function initLogger() {
	/**
	 * @type {{
	 *   file: string,
	 *   max_size: number,
	 *   max_files: number,
	 *   level: string,
	 * }}
	 */
	const loggerConfig = configLoader.getValue("logger", {
		file: "data/airzone-notify.log",
		max_size: 102400,
		max_files: 5,
		level: "debug",
	});

	const myFormat = format.printf(({ timestamp, level, message, ...otherInfo }) => {
		return `${timestamp} [${level}] ${message} ${
			Object.keys(otherInfo).length > 0 ? JSON.stringify(otherInfo) : ""
		}`;
	});

	const logger = createLogger({
		level: loggerConfig.level,
		format: format.combine(format.errors({ stack: true }), format.timestamp(), myFormat),
		transports: [
			new transports.File({
				filename: loggerConfig.file,
				maxsize: loggerConfig.max_size,
				maxFiles: loggerConfig.max_files,
			}),
		],
	});

	logger.verbose("Logger initialized");
	const cfg = /** @type {{airzone:object}} */ (configLoader.config);
	logger.verbose("configuration", { ...cfg, airzone: { ...cfg.airzone, password: "********" } });

	return logger;
}
