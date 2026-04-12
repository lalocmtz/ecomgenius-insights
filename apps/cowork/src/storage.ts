import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { SellerCenterData } from "./seller-center";

const DATA_DIR = path.join(process.env.HOME || "~", ".cowork", "data");

export class StorageManager {
  private supabase: ReturnType<typeof createClient> | null = null;
  private userId: string | null = null;

  constructor(userId?: string) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.userId = userId || null;
    }

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  async saveLocally(
    brandId: string,
    period: string,
    data: SellerCenterData
  ): Promise<string> {
    try {
      const brandDir = path.join(DATA_DIR, brandId);
      if (!fs.existsSync(brandDir)) {
        fs.mkdirSync(brandDir, { recursive: true });
      }

      const filename = `${period}_${new Date().toISOString().split("T")[0]}.json`;
      const filepath = path.join(brandDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

      console.log(`✅ Datos guardados en: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error("Error saving locally:", error);
      throw error;
    }
  }

  async syncToSupabase(brandId: string, period: string, data: SellerCenterData): Promise<boolean> {
    try {
      if (!this.supabase || !this.userId) {
        console.warn("⚠️ Supabase no configurado, saltando sincronización");
        return false;
      }

      const { error } = await this.supabase.from("extracted_data").insert({
        user_id: this.userId,
        brand_id: brandId,
        period: period,
        data: data,
        extracted_at: new Date().toISOString(),
        data_type: "seller_center_full",
      });

      if (error) {
        console.error("Supabase sync error:", error);
        return false;
      }

      console.log("✅ Sincronizado con Supabase");
      return true;
    } catch (error) {
      console.error("Error syncing to Supabase:", error);
      return false;
    }
  }

  async savePeriodStatus(
    brandId: string,
    period: string,
    status: "pending" | "completed" | "failed"
  ): Promise<void> {
    try {
      const statusFile = path.join(DATA_DIR, `${brandId}_status.json`);
      let statuses: Record<string, string> = {};

      if (fs.existsSync(statusFile)) {
        statuses = JSON.parse(fs.readFileSync(statusFile, "utf-8"));
      }

      statuses[period] = status;
      fs.writeFileSync(statusFile, JSON.stringify(statuses, null, 2));
    } catch (error) {
      console.error("Error saving period status:", error);
    }
  }

  async getPeriodStatus(brandId: string): Promise<Record<string, string>> {
    try {
      const statusFile = path.join(DATA_DIR, `${brandId}_status.json`);
      if (fs.existsSync(statusFile)) {
        return JSON.parse(fs.readFileSync(statusFile, "utf-8"));
      }
      return {};
    } catch (error) {
      console.error("Error reading period status:", error);
      return {};
    }
  }

  async listExtractedPeriods(brandId: string): Promise<Array<{ period: string; date: string }>> {
    try {
      const brandDir = path.join(DATA_DIR, brandId);
      if (!fs.existsSync(brandDir)) {
        return [];
      }

      const files = fs.readdirSync(brandDir);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => {
          const [period, date] = f.replace(".json", "").split("_");
          return { period, date };
        });
    } catch (error) {
      console.error("Error listing periods:", error);
      return [];
    }
  }

  getDataDirectory(): string {
    return DATA_DIR;
  }
}
