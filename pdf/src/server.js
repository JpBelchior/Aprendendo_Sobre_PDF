const express = require("express");
const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
const app = express();

const passengers = [
  {
    nome: "João Silva",
    numero: "001",
    voo: "AZ123",
    horario: "10:30",
    malas: [
      { peso: 23, fragil: false },
      { peso: 12, fragil: true },
    ],
  },
  {
    nome: "Maria Souza",
    numero: "002",
    voo: "AZ123",
    horario: "10:30",
    malas: [{ peso: 18, fragil: false }],
  },
  {
    nome: "Carlos Pereira",
    numero: "003",
    voo: "BR789",
    horario: "14:00",
    malas: [
      { peso: 25, fragil: false },
      { peso: 10, fragil: false },
      { peso: 5, fragil: true },
    ],
  },
  {
    nome: "Ana Lima",
    numero: "004",
    voo: "BR789",
    horario: "14:00",
    malas: [{ peso: 20, fragil: true }],
  },
];

// Função para renderizar HTML
const renderHTML = (data = passengers) => {
  return new Promise((resolve, reject) => {
    ejs.renderFile(
      path.join(__dirname, "print.ejs"),
      { passengers: data },
      (err, html) => {
        if (err) reject(err);
        else resolve(html);
      }
    );
  });
};

// Função para gerar PDF
const generatePDF = async (data = passengers) => {
  let browser;

  try {
    const html = await renderHTML(data);

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      printBackground: true,
      format: "A4",
      margin: { top: "20px", right: "20px", bottom: "40px", left: "20px" },
    });

    return pdf;
  } finally {
    if (browser) await browser.close();
  }
};

// ========== ROTAS PRINCIPAIS ==========

// Ver todos os passageiros (HTML)
app.get("/", async (req, res) => {
  try {
    const html = await renderHTML();
    res.send(html);
  } catch (error) {
    res.status(500).send("Erro ao gerar relatório");
  }
});

// PDF de todos os passageiros
app.get("/pdf", async (req, res) => {
  try {
    const pdf = await generatePDF();
    res.setHeader("Content-Type", "application/pdf");
    return res.send(pdf);
  } catch (error) {
    res.status(500).send("Erro ao gerar PDF");
  }
});

// ========== ROTAS PARA FILTRAR POR VOO ==========

// 1. LISTAR TODOS OS VOOS DISPONÍVEIS (JSON)
app.get("/voos", (req, res) => {
  // Pegar todos os voos únicos
  const voosUnicos = [...new Set(passengers.map((p) => p.voo))];

  // Contar passageiros por voo
  const voosComInfo = voosUnicos.map((voo) => {
    const passageirosDoVoo = passengers.filter((p) => p.voo === voo);
    return {
      voo: voo,
      horario: passageirosDoVoo[0].horario, // Assumindo mesmo horário
      totalPassageiros: passageirosDoVoo.length,
      passageiros: passageirosDoVoo.map((p) => p.nome),
    };
  });

  res.json(voosComInfo);
});

// 2. VER PASSAGEIROS DE UM VOO ESPECÍFICO (HTML)
app.get("/voo/:numeroVoo", async (req, res) => {
  const numeroVoo = req.params.numeroVoo.toUpperCase();

  // Filtrar passageiros do voo
  const passageirosDoVoo = passengers.filter((p) => p.voo === numeroVoo);

  if (passageirosDoVoo.length === 0) {
    return res.status(404).send(`
      <h1>Voo não encontrado!</h1>
      <p>O voo <strong>${numeroVoo}</strong> não foi encontrado.</p>
      <p><a href="/voos">Ver todos os voos disponíveis</a></p>
      <p><a href="/">Voltar ao início</a></p>
    `);
  }

  try {
    const html = await renderHTML(passageirosDoVoo);
    res.send(html);
  } catch (error) {
    res.status(500).send("Erro ao gerar relatório do voo");
  }
});

// 3. GERAR PDF DE UM VOO ESPECÍFICO
app.get("/pdf/voo/:numeroVoo", async (req, res) => {
  const numeroVoo = req.params.numeroVoo.toUpperCase();

  // Filtrar passageiros do voo
  const passageirosDoVoo = passengers.filter((p) => p.voo === numeroVoo);

  if (passageirosDoVoo.length === 0) {
    return res.status(404).json({
      error: "Voo não encontrado",
      voo: numeroVoo,
      voosDisponiveis: [...new Set(passengers.map((p) => p.voo))],
    });
  }

  try {
    const pdf = await generatePDF(passageirosDoVoo);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="relatorio-voo-${numeroVoo}.pdf"`
    );

    return res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: "Erro ao gerar PDF do voo" });
  }
});

// 4. BAIXAR PDF DE UM VOO ESPECÍFICO
app.get("/pdf/voo/:numeroVoo/download", async (req, res) => {
  const numeroVoo = req.params.numeroVoo.toUpperCase();
  const passageirosDoVoo = passengers.filter((p) => p.voo === numeroVoo);

  if (passageirosDoVoo.length === 0) {
    return res.status(404).send("Voo não encontrado");
  }

  try {
    const pdf = await generatePDF(passageirosDoVoo);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="voo-${numeroVoo}-passageiros.pdf"`
    );
    res.setHeader("Content-Length", pdf.length);

    return res.send(pdf);
  } catch (error) {
    res.status(500).send("Erro ao baixar PDF do voo");
  }
});

// Iniciar servidor
app.listen(3002, () => {
  console.log("🚀 Servidor rodando na porta 3002");
  console.log();
  console.log("📋 ROTAS PRINCIPAIS:");
  console.log("   📄 Todos passageiros: http://localhost:3002/");
  console.log("   📄 PDF todos: http://localhost:3002/pdf");
  console.log();
  console.log("✈️ ROTAS DE VOOS:");
  console.log("   📋 Listar voos: http://localhost:3002/voos");
  console.log("❓ Ajuda: http://localhost:3002/help");
});
