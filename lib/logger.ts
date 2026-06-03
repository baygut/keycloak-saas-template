import { __DEV__ } from "@/lib/dev";
import { persistLogEntry } from "@/lib/log-store";

type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

export type LogMeta = Record<string, unknown> | undefined;

type Transport = (entry: {
  ts: string;
  level: LogLevel;
  service?: string;
  prefix?: string;
  msg: string;
  meta?: LogMeta;
}) => void | Promise<void>;

function readEnvLevel(value: string | undefined, fallback: LogLevel): LogLevel {
  if (value && value in LEVELS) {
    return value as LogLevel;
  }

  return fallback;
}

class Logger {
  private consoleLevel = LEVELS.info;
  private json = false;
  private service?: string;
  private transport: Transport | null = null;

  constructor() {
    try {
      const env =
        typeof process !== "undefined"
          ? (process.env as NodeJS.ProcessEnv)
          : undefined;

      this.consoleLevel = LEVELS[readEnvLevel(env?.CONSOLE_LOG_LEVEL, "info")];
      if (env?.LOG_JSON === "true") {
        this.json = true;
      }
      if (env?.SERVICE_NAME) {
        this.service = env.SERVICE_NAME;
      }
    } catch {
      // ignore env/bootstrap errors in edge cases
    }
  }

  setConsoleLevel(level: LogLevel) {
    this.consoleLevel = LEVELS[level];
  }

  setJSON(enabled: boolean) {
    this.json = enabled;
  }

  setService(name?: string) {
    this.service = name;
  }

  setTransport(t: Transport | null) {
    this.transport = t;
  }

  private shouldLogToConsole(level: LogLevel) {
    if (!__DEV__) {
      return false;
    }

    return (
      LEVELS[level] >= this.consoleLevel && this.consoleLevel !== LEVELS.silent
    );
  }

  private normalize(args: unknown[]) {
    const strings: string[] = [];
    const metas: unknown[] = [];
    for (const a of args) {
      if (typeof a === "string") {
        strings.push(a);
      } else {
        metas.push(a);
      }
    }
    const msg = strings.length
      ? strings.join(" ")
      : metas.length
        ? JSON.stringify(metas.length === 1 ? metas[0] : metas)
        : "";
    const meta: LogMeta =
      metas.length === 0
        ? undefined
        : metas.length === 1
          ? (metas[0] as LogMeta)
          : { values: metas };
    return { msg, meta } as { msg: string; meta?: LogMeta };
  }

  private async emit(
    level: LogLevel,
    prefix: string | undefined,
    ...args: unknown[]
  ) {
    if (level === "silent") {
      return;
    }

    const { msg, meta } = this.normalize(args);
    const entry = {
      ts: new Date().toISOString(),
      level,
      service: this.service,
      prefix,
      msg,
      meta,
    };

    try {
      if (this.transport) {
        await this.transport(entry);
      }
    } catch {
      // swallow transport errors
    }

    if (!this.shouldLogToConsole(level)) {
      return;
    }

    if (this.json) {
      try {
        const out = JSON.stringify(entry);
        if (level === "error") {
          console.error(out);
        } else {
          console.log(out);
        }
      } catch {
        console.log(
          entry.ts,
          level.toUpperCase(),
          prefix ?? "",
          msg,
          meta ?? "",
        );
      }
      return;
    }

    const header = `${entry.ts} ${level.toUpperCase()}${entry.service ? " " + entry.service : ""}${prefix ? " [" + prefix + "]" : ""}`;
    if (level === "error") {
      console.error(header, msg, meta ?? "");
    } else if (level === "warn") {
      console.warn(header, msg, meta ?? "");
    } else if (level === "info") {
      console.info(header, msg, meta ?? "");
    } else {
      console.debug(header, msg, meta ?? "");
    }
  }

  debug(prefixOrArg?: string, ...rest: unknown[]) {
    const [prefix, args] =
      typeof prefixOrArg === "string"
        ? [prefixOrArg, rest]
        : [undefined, prefixOrArg ? [prefixOrArg, ...rest] : rest];
    return this.emit("debug", prefix, ...args);
  }

  info(prefixOrArg?: string, ...rest: unknown[]) {
    const [prefix, args] =
      typeof prefixOrArg === "string"
        ? [prefixOrArg, rest]
        : [undefined, prefixOrArg ? [prefixOrArg, ...rest] : rest];
    return this.emit("info", prefix, ...args);
  }

  warn(prefixOrArg?: string, ...rest: unknown[]) {
    const [prefix, args] =
      typeof prefixOrArg === "string"
        ? [prefixOrArg, rest]
        : [undefined, prefixOrArg ? [prefixOrArg, ...rest] : rest];
    return this.emit("warn", prefix, ...args);
  }

  error(prefixOrArg?: string, ...rest: unknown[]) {
    const [prefix, args] =
      typeof prefixOrArg === "string"
        ? [prefixOrArg, rest]
        : [undefined, prefixOrArg ? [prefixOrArg, ...rest] : rest];
    return this.emit("error", prefix, ...args);
  }

  child(prefix: string) {
    return {
      debug: (...a: unknown[]) => this.debug(prefix, ...a),
      info: (...a: unknown[]) => this.info(prefix, ...a),
      warn: (...a: unknown[]) => this.warn(prefix, ...a),
      error: (...a: unknown[]) => this.error(prefix, ...a),
      setConsoleLevel: (l: LogLevel) => this.setConsoleLevel(l),
      setJSON: (b: boolean) => this.setJSON(b),
    } as const;
  }
}

declare global {
  var __NEXT_LOGGER_SINGLETON__: Logger | undefined;
}

const GLOBAL_KEY = "__NEXT_LOGGER_SINGLETON__";
const logger: Logger =
  globalThis[GLOBAL_KEY] ?? (globalThis[GLOBAL_KEY] = new Logger());

export default logger;

export function registerTransport(t: Transport | null) {
  logger.setTransport(t);
}

let dbTransportRegistered = false;

function registerDbTransport() {
  if (dbTransportRegistered) {
    return;
  }

  dbTransportRegistered = true;

  registerTransport(async (entry) => {
    await persistLogEntry({
      ts: entry.ts,
      level: entry.level,
      service: entry.service,
      prefix: entry.prefix,
      msg: entry.msg,
      meta: entry.meta,
    });
  });
}

registerDbTransport();

export type { LogLevel };
