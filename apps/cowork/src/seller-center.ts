import { Browser, BrowserContext, Page } from "playwright";

export interface SellerCenterData {
  overview?: Record<string, any>;
  campaigns?: Record<string, any>;
  products?: Record<string, any>;
  affiliates?: Record<string, any>;
  creatives?: Record<string, any>;
}

export class SellerCenterAutomation {
  private page: Page | null = null;
  private context: BrowserContext | null = null;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      if (!this.page) return false;

      // Navigate to Seller Center
      await this.page.goto("https://seller.tiktok.com", { waitUntil: "networkidle" });

      // Wait for login buttons/forms
      const loginButton = await this.page.locator('[data-testid="login-button"]').first();

      if (await loginButton.isVisible()) {
        await loginButton.click();
      }

      // Enter email
      const emailInput = await this.page.locator('input[type="email"]').first();
      if (emailInput) {
        await emailInput.fill(email);
        await this.page.keyboard.press("Enter");
      }

      // Wait for password field
      await this.page.waitForTimeout(2000);

      const passwordInput = await this.page.locator('input[type="password"]').first();
      if (passwordInput) {
        await passwordInput.fill(password);
        await passwordInput.press("Enter");
      }

      // Wait for navigation after login
      await this.page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 });

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }

  async extractOverview(): Promise<Record<string, any>> {
    try {
      if (!this.page) return {};

      await this.page.goto("https://seller.tiktok.com/seller/statistics/overview", {
        waitUntil: "networkidle",
      });

      // Wait for data to load
      await this.page.waitForTimeout(3000);

      // Extract visible data from the page
      const data = await this.page.evaluate(() => {
        const metrics: Record<string, any> = {};
        const elements = document.querySelectorAll(
          "[data-testid*='metric'], [class*='metric'], [class*='card']"
        );

        elements.forEach((el) => {
          const text = el.textContent || "";
          const value = text.match(/\d+(?:,\d+)?(?:\.\d+)?/);
          if (value) {
            const key = text.substring(0, 50).toLowerCase().replace(/\s+/g, "_");
            metrics[key] = value[0];
          }
        });

        return metrics;
      });

      return data;
    } catch (error) {
      console.error("Extract overview failed:", error);
      return {};
    }
  }

  async extractCampaigns(): Promise<Record<string, any>> {
    try {
      if (!this.page) return {};

      await this.page.goto("https://seller.tiktok.com/seller/marketing/campaigns", {
        waitUntil: "networkidle",
      });

      await this.page.waitForTimeout(3000);

      const data = await this.page.evaluate(() => {
        const campaigns = [];
        const rows = document.querySelectorAll("tbody tr, [role='row']");

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td, [role='gridcell']");
          if (cells.length > 0) {
            campaigns.push({
              name: cells[0]?.textContent || "",
              status: cells[1]?.textContent || "",
              date_range: cells[2]?.textContent || "",
              spend: cells[3]?.textContent || "",
            });
          }
        });

        return campaigns;
      });

      return { campaigns: data };
    } catch (error) {
      console.error("Extract campaigns failed:", error);
      return {};
    }
  }

  async extractProducts(): Promise<Record<string, any>> {
    try {
      if (!this.page) return {};

      await this.page.goto("https://seller.tiktok.com/seller/products", {
        waitUntil: "networkidle",
      });

      await this.page.waitForTimeout(3000);

      const data = await this.page.evaluate(() => {
        const products = [];
        const rows = document.querySelectorAll("tbody tr, [role='row']");

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td, [role='gridcell']");
          if (cells.length > 0) {
            products.push({
              id: cells[0]?.textContent || "",
              name: cells[1]?.textContent || "",
              sku: cells[2]?.textContent || "",
              status: cells[3]?.textContent || "",
              inventory: cells[4]?.textContent || "",
            });
          }
        });

        return products;
      });

      return { products: data };
    } catch (error) {
      console.error("Extract products failed:", error);
      return {};
    }
  }

  async extractAffiliates(): Promise<Record<string, any>> {
    try {
      if (!this.page) return {};

      await this.page.goto("https://seller.tiktok.com/seller/partners/affiliates", {
        waitUntil: "networkidle",
      });

      await this.page.waitForTimeout(3000);

      const data = await this.page.evaluate(() => {
        const affiliates = [];
        const rows = document.querySelectorAll("tbody tr, [role='row']");

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td, [role='gridcell']");
          if (cells.length > 0) {
            affiliates.push({
              name: cells[0]?.textContent || "",
              commission_rate: cells[1]?.textContent || "",
              sales: cells[2]?.textContent || "",
              status: cells[3]?.textContent || "",
            });
          }
        });

        return affiliates;
      });

      return { affiliates: data };
    } catch (error) {
      console.error("Extract affiliates failed:", error);
      return {};
    }
  }

  async extractCreatives(): Promise<Record<string, any>> {
    try {
      if (!this.page) return {};

      await this.page.goto("https://seller.tiktok.com/seller/content/creatives", {
        waitUntil: "networkidle",
      });

      await this.page.waitForTimeout(3000);

      const data = await this.page.evaluate(() => {
        const creatives = [];
        const items = document.querySelectorAll("[class*='creative'], [data-testid*='creative']");

        items.forEach((item) => {
          creatives.push({
            title: item.querySelector("[class*='title']")?.textContent || "",
            type: item.querySelector("[class*='type']")?.textContent || "",
            created: item.querySelector("[class*='date']")?.textContent || "",
            views: item.querySelector("[class*='views']")?.textContent || "",
          });
        });

        return creatives;
      });

      return { creatives: data };
    } catch (error) {
      console.error("Extract creatives failed:", error);
      return {};
    }
  }

  async extractAllData(): Promise<SellerCenterData> {
    const data: SellerCenterData = {};

    console.log("🔄 Extrayendo Overview...");
    data.overview = await this.extractOverview();

    console.log("🔄 Extrayendo Campaigns...");
    data.campaigns = await this.extractCampaigns();

    console.log("🔄 Extrayendo Products...");
    data.products = await this.extractProducts();

    console.log("🔄 Extrayendo Affiliates...");
    data.affiliates = await this.extractAffiliates();

    console.log("🔄 Extrayendo Creatives...");
    data.creatives = await this.extractCreatives();

    return data;
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
  }
}
