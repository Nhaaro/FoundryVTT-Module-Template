import { ChildProcess, spawn } from "child_process";
import chalk from "chalk";

//TODO: merge with vite Logger util
const prefixBase = chalk.bold("[ChildProcess]");
const prefix = (color = chalk.green) => `${color(prefixBase)}`;
const logger = {
  log: (message?: any, ...optionalParams: any[]) =>
    console.log(`${prefix()} ${message}`, ...optionalParams),
  info: (message?: any, ...optionalParams: any[]) =>
    console.info(`${prefix(chalk.white)} ${message}`, ...optionalParams),
  error: (message?: any, ...optionalParams: any[]) =>
    console.error(`${prefix(chalk.red)} ${message}`, ...optionalParams),
};

const spawnedProcesses: [string, ChildProcess][] = [];
export function registerSIGINT() {
  process.on("SIGINT", function () {
    spawnedProcesses.forEach(([, child]) => {
      child.kill("SIGKILL");
    });
    process.exit(129);
  });
}

function promiseFromChildProcess(child: ChildProcess) {
  return new Promise<number | null>((resolve, reject) => {
    child.addListener("error", reject);
    child.addListener("exit", resolve);
  });
}
export async function run(
  [command, ...args]: string[],
  opts: {
    onSpawn?: () => void;
    stdout?: (stdout: ChildProcess["stdout"]) => void;
    onError?: (err: Error) => void;
    onClose?: (code: number | null) => void;
    resolve?: (code: number | null) => void;
    reject?: (err: Error) => void;
  } = {}
) {
  const child = spawn(command, args, {
    shell: true,
    env: { ...process.env, FORCE_COLOR: "true" },
  });

  child.on("spawn", function () {
    spawnedProcesses.push([[command, ...args].join(" "), child]);
    logger.log(`${[command, ...args].join(" ")}`);
    opts.onSpawn?.();
  });

  child.stdout?.on("data", (chunk) => {
    chunk
      .toString()
      .split("\n")
      .forEach((string: string) => logger.info(string));
    opts.stdout?.(child.stdout);
  });
  child.stderr.on("data", function (err) {
    err
      .toString()
      .split("\n")
      .forEach((string: string) => logger.error(string));
    opts.onError?.(err);
  });

  child.on("close", function (code) {
    const currentProcess = spawnedProcesses.findIndex(
      (p) => p[0] === [command, ...args].join(" ")
    );
    if (spawnedProcesses.length < 2) console.log();
    opts.onClose?.(code);
    spawnedProcesses.splice(currentProcess, 1);
  });

  return promiseFromChildProcess(child).then(
    function (result) {
      opts.resolve?.(result);
    },
    function (err) {
      opts.reject?.(err);
    }
  );
}
