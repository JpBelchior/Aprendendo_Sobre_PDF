import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Para usar __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFGenerator {
  constructor() {
    this.browser = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  async generatePDF(htmlTemplate, outputPath, options = {}) {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser.newPage();

    // Caminhos para os arquivos
    const templatePath = path.resolve(__dirname, "templates", htmlTemplate);
    const cssPath = path.resolve(__dirname, "styles", "output.css");

    // Ler HTML e CSS
    let htmlContent = fs.readFileSync(templatePath, "utf8");
    const cssContent = fs.readFileSync(cssPath, "utf8");

    // Inserir CSS inline no HTML
    htmlContent = htmlContent.replace(
      '<link rel="stylesheet" href="../styles/output.css">',
      `<style>${cssContent}</style>`
    );

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfOptions = {
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      ...options,
    };

    await page.pdf(pdfOptions);
    console.log(`✅ PDF gerado: ${outputPath}`);

    await page.close();
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Exemplo de uso
async function main() {
  const generator = new PDFGenerator();

  try {
    await generator.generatePDF("exemplo.html", "./output/exemplo.pdf");
  } catch (error) {
    console.error("❌ Erro ao gerar PDF:", error);
  } finally {
    await generator.close();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PDFGenerator;
