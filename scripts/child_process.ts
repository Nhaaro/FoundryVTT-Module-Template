import { ChildProcess, spawn } from "child_process";
import chalk from "chalk";

const spawnedProcesses: [string, ChildProcess][] = [];
export function registerSIGINT() {
  process.on("SIGINT", function () {
    spawnedProcesses.forEach(([, child]) => {
      child.kill("SIGKILL");
    });
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
  const child = spawn(command, args, { stdio: "inherit" });

  if (child.stdout) {
    console.log("  ", child.stdout);
    opts.stdout?.(child.stdout);
  }

  child.on("spawn", function () {
    spawnedProcesses.push([[command, ...args].join(" "), child]);
    console.log(
      chalk.blueBright.bold(`----- ${[command, ...args].join(" ")} -----`)
    );
    opts.onSpawn?.();
  });
  child.on("error", function (err) {
    console.log(err);
    opts.onError?.(err);
  });
  child.on("close", function (code) {
    console.log();
    opts.onClose?.(code);
    spawnedProcesses.splice(
      spawnedProcesses.findIndex((p) => p[0] === [command, ...args].join(" ")) -
        1,
      1
    );
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
