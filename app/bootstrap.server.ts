import fs from "fs";
import path from "path";
import { redis } from "./utils/backend.redis";
import yaml from "yaml";
import { ServiceConfig, zServiceConfig } from "./utils/types";

let initialized = false;
export async function ensureBoot() {
  if (initialized) return;

  console.log("Initializing YAML -> Redis");

  const basePath = path.join(...[process.cwd(), "app", "config", "oauth"]);

  if (fs.existsSync(basePath)) {
    const files = fs.readdirSync(basePath);

    for (const file of files) {
      if (!file.endsWith(".yaml")) continue;

      const fullPath = path.join(...[basePath, file]);
      const content = fs.readFileSync(fullPath, "utf-8");
      const parsedYaml = yaml.parse(content);
      const config = zServiceConfig.parse(parsedYaml);

      await redis.set(`yaml:${file.split(".")[0]}`, config);
    }
  }
  initialized = true;
}

export async function ensureKeyIndex() {
  const keys = await redis.keys(`yaml:*`);
  const values = await redis.mget(keys);

  const services = values
    .filter((v) => v && typeof v === "object")
    .map((v) => {
      try {
        return zServiceConfig.parse(v);
      } catch {
        return null;
      }
    })
    .filter((config): config is ServiceConfig => config !== null)
    .filter((config) => config && config.isProd)
    .map((config) => ({
      name: config.name,
      icon: `/${config.name}.svg`,
      link: `services/${config.name}`,
    }));

  await redis.set("yaml:services:index", services);
}
