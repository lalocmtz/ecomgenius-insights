#!/usr/bin/env node

import { chromium } from "playwright";
import { SellerCenterAutomation } from "./seller-center";
import { StorageManager } from "./storage";
import chalk from "chalk";
import ora from "ora";
import * as fs from "fs";
import * as path from "path";

interface CoworkConfig {
  seller_email: string;
  seller_password: string;
  user_id?: string;
  brand_id?: string;
}

const CONFIG_FILE = path.join(process.env.HOME || "~", ".cowork", "config.json");

function loadConfig(): CoworkConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error loading config:", error);
  }
  return null;
}

function saveConfig(config: CoworkConfig): void {
  try {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(chalk.green("✅ Configuración guardada"));
  } catch (error) {
    console.error(chalk.red("Error saving config:"), error);
  }
}

async function setupConfig(): Promise<void> {
  console.log(chalk.blue("\n🔧 Configuración Inicial de CoWork\n"));

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => readline.question(prompt, resolve));
  };

  const email = await question(chalk.cyan("Email del Seller Center: "));
  const password = await question(chalk.cyan("Contraseña (será encriptada): "));
  const brandId = await question(chalk.cyan("ID de la marca (opcional): "));

  readline.close();

  const config: CoworkConfig = {
    seller_email: email,
    seller_password: password,
    brand_id: brandId || undefined,
  };

  saveConfig(config);
}

async function extractData(): Promise<void> {
  let config = loadConfig();

  if (!config) {
    await setupConfig();
    config = loadConfig();
    if (!config) {
      console.error(chalk.red("❌ Configuración no disponible"));
      process.exit(1);
    }
  }

  console.log(chalk.blue("\n📊 Iniciando extracción de datos...\n"));

  let browser: any = null;
  let spinner = ora("Abriendo navegador...").start();

  try {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    spinner.succeed("Navegador abierto");

    // Login
    spinner = ora("Iniciando sesión en Seller Center...").start();
    const automation = new SellerCenterAutomation(page, context);

    const loginSuccess = await automation.login(config.seller_email, config.seller_password);
    if (!loginSuccess) {
      spinner.fail("Error al iniciar sesión");
      process.exit(1);
    }

    spinner.succeed("Sesión iniciada");

    // Extract data
    spinner = ora("Extrayendo datos...").start();
    const data = await automation.extractAllData();
    spinner.succeed("Datos extraídos");

    // Save
    const storage = new StorageManager(config.user_id);
    const period = new Date().toISOString().split("T")[0];
    const brandId = config.brand_id || "default";

    spinner = ora("Guardando datos...").start();
    await storage.saveLocally(brandId, period, data);
    await storage.syncToSupabase(brandId, period, data);
    spinner.succeed("Datos guardados");

    console.log(chalk.green("\n✅ Extracción completada\n"));
    console.log(chalk.gray(`Datos guardados en: ${storage.getDataDirectory()}/${brandId}\n`));

    await automation.close();
  } catch (error) {
    spinner?.fail("Error");
    console.error(chalk.red("Error:"), error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

async function listData(): Promise<void> {
  const config = loadConfig();
  if (!config || !config.brand_id) {
    console.error(chalk.red("❌ Configure primero con: cowork setup"));
    return;
  }

  const storage = new StorageManager(config.user_id);
  const periods = await storage.listExtractedPeriods(config.brand_id);

  if (periods.length === 0) {
    console.log(chalk.yellow("No hay datos extraídos aún"));
    return;
  }

  console.log(chalk.blue("\n📋 Períodos extraídos:\n"));
  periods.forEach((p) => {
    console.log(chalk.gray(`  • ${p.period} - ${p.date}`));
  });
  console.log();
}

async function main() {
  const command = process.argv[2] || "extract";

  switch (command) {
    case "setup":
      await setupConfig();
      break;
    case "extract":
      await extractData();
      break;
    case "list":
      await listData();
      break;
    case "help":
      console.log(chalk.blue("\n🐝 CoWork - Seller Center Data Extractor\n"));
      console.log(chalk.gray("Comandos disponibles:\n"));
      console.log(chalk.cyan("  setup      ") + "Configurar credenciales");
      console.log(chalk.cyan("  extract    ") + "Extraer datos ahora (default)");
      console.log(chalk.cyan("  list       ") + "Listar períodos extraídos");
      console.log(chalk.cyan("  help       ") + "Mostrar esta ayuda\n");
      break;
    default:
      console.error(chalk.red(`Comando desconocido: ${command}`));
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
