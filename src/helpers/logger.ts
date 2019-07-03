import { format, transports, createLogger } from "winston";
const { combine, timestamp, label, prettyPrint } = format;

export const logger = createLogger({
    format: combine(
        timestamp(),
        prettyPrint()
    ),
    transports: [
      new transports.Console()
    ]
});