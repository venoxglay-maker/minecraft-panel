import { exec as execCb, spawn } from "child_process";
import { promisify } from "util";
const exec = promisify(execCb);
const IMAGE = process.env.MCPANEL_MC_IMAGE || "itzg/minecraft-server:latest";
const NETWORK = process.env.MCPANEL_MC_NETWORK || "mcnet";
const SERVERS_BASE_DIR = process.env.SERVERS_BASE_DIR ||
    "/data/servers"; // should be a volume shared between api container and host
function serverContainerName(serverId) {
    return `mcpanel_mc_${serverId}`;
}
export async function provisionServerContainer(options) {
    const containerName = serverContainerName(options.id);
    const worldDirHost = `${SERVERS_BASE_DIR}/${options.id}`;
    const env = [
        `EULA=TRUE`,
        `SERVER_NAME=${options.name}`,
        `VERSION=${options.minecraftVersion}`,
        `MEMORY=${Math.max(1024, options.ramMb)}M`
    ];
    // Basic type → loader mapping
    if (options.type === "paper" || options.type === "spigot") {
        env.push("TYPE=PAPER");
    }
    else if (options.type === "forge") {
        env.push("TYPE=FORGE");
    }
    else if (options.type === "fabric") {
        env.push("TYPE=FABRIC");
    }
    else {
        env.push("TYPE=VANILLA");
    }
    if (options.port) {
        env.push(`SERVER_PORT=${options.port}`);
    }
    const envArgs = env.map((e) => `-e ${e}`).join(" ");
    const portArg = options.port ? `-p ${options.port}:25565` : "";
    const cmd = [
        "docker",
        "run",
        "-d",
        "--restart=unless-stopped",
        `--name ${containerName}`,
        `--network ${NETWORK}`,
        `-v ${worldDirHost}:/data`,
        portArg,
        envArgs,
        IMAGE
    ]
        .filter(Boolean)
        .join(" ");
    await exec(cmd);
}
export async function powerServerContainer(serverId, action) {
    const name = serverContainerName(serverId);
    if (action === "start") {
        await exec(`docker start ${name}`);
    }
    else if (action === "stop") {
        await exec(`docker stop ${name}`);
    }
    else if (action === "restart") {
        await exec(`docker restart ${name}`);
    }
    else if (action === "kill") {
        await exec(`docker kill ${name}`);
    }
}
export function streamServerLogs(serverId, onLine) {
    const name = serverContainerName(serverId);
    // Follow logs from the last minute to avoid huge history
    const child = spawn("docker", ["logs", "-f", "--since", "1m", name]);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
        for (const line of chunk.split("\n")) {
            if (line.trim().length > 0) {
                onLine(line);
            }
        }
    });
    return child;
}
export async function getServerStats(serverId) {
    const name = serverContainerName(serverId);
    try {
        const { stdout } = await exec(`docker stats ${name} --no-stream --format "{{.CPUPerc}};{{.MemUsage}}"`);
        const [cpuRaw, memRaw] = stdout.trim().split(";");
        const cpuPercent = cpuRaw ? parseFloat(cpuRaw.replace("%", "")) : null;
        let memoryMb = null;
        if (memRaw) {
            // format like "123.45MiB / 2GiB"
            const usedPart = memRaw.split("/")[0].trim();
            const match = usedPart.match(/([\d.]+)\s*([KMG]i?)?B?/i);
            if (match) {
                const value = parseFloat(match[1]);
                const unit = match[2]?.toUpperCase() ?? "";
                const factor = unit === "GI" || unit === "G"
                    ? 1024
                    : unit === "MI" || unit === "M"
                        ? 1
                        : unit === "KI" || unit === "K"
                            ? 1 / 1024
                            : 1;
                memoryMb = value * factor;
            }
        }
        return { cpuPercent: Number.isFinite(cpuPercent) ? cpuPercent : null, memoryMb };
    }
    catch {
        return { cpuPercent: null, memoryMb: null };
    }
}
export async function sendConsoleCommand(serverId, command) {
    const name = serverContainerName(serverId);
    // This assumes rcon-cli is available and configured inside the container.
    await exec(`docker exec ${name} rcon-cli ${JSON.stringify(command)}`);
}
