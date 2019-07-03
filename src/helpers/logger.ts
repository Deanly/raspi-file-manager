import { format, transports, createLogger } from "winston";
const { combine, timestamp, label, prettyPrint, json } = format;

export const logger = createLogger({
    format: combine(
        timestamp(),
        json()
    ),
    transports: [
      new transports.Console()
    ]
});