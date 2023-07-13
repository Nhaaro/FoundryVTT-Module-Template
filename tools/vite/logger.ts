// Adapted from https://gitlab.com/foundryvtt_pathfinder1e/foundryvtt-pathfinder1/-/blob/master/tools/vite-logger.mjs

import * as vite from "vite";
import chalk from "chalk";

/**
 * A utility class wrapping a {@link import("vite").Logger} instance to provide uniform log formatting
 */
export default class Logger implements vite.Logger {
  logger: vite.Logger;
  hasWarned: boolean;

  constructor(logger: vite.Logger) {
    this.logger = logger;
    this.hasWarned = logger.hasWarned;
  }

  /** Common prefix for all log messages */
  static prefixBase = chalk.bold("[Module]");

  static getTime() {
    return `${chalk.dim.gray(new Date().toLocaleTimeString())}`;
  }

  /**
   * Returns the common prefix for all log messages, optionally colored to signal the severity
   */
  static prefix(color = chalk.blue) {
    return `${chalk.dim(this.getTime())} ${color(this.prefixBase)}`;
  }

  info(msg: string, options?: vite.LogOptions | undefined): void {
    return this.logger.info(`${Logger.prefix()} ${msg}`, options);
  }

  warn(msg: string, options?: vite.LogOptions | undefined): void {
    return this.logger.warn(`${Logger.prefix(chalk.yellow)} ${msg}`, options);
  }

  error(msg: string, options?: vite.LogErrorOptions | undefined): void {
    return this.logger.error(`${Logger.prefix(chalk.red)} ${msg}`, options);
  }

  warnOnce(msg: string, options?: vite.LogOptions | undefined): void {
    return this.logger.warnOnce(
      `${Logger.prefix(chalk.yellow)} ${msg}`,
      options
    );
  }

  clearScreen(type: vite.LogType): void {
    return this.logger.clearScreen(type);
  }

  hasErrorLogged(error: Error | vite.Rollup.RollupError): boolean {
    return this.hasErrorLogged(error);
  }
}
