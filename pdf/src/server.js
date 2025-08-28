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
app.get("/pdf", async (req, res) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://localhost:3002/", { waitUntil: "networkidle0" });
  const pdf = await page.pdf({
    printBackground: true,
    format: "Letter",
    margin: {
      top: "20px",
      right: "20px",
      bottom: "40px",
      left: "20px",
    },
  });
  await browser.close();
  res.contentType("application/pdf");
  return res.send(pdf);
});

app.get("/", (req, res) => {
  ejs.renderFile(
    path.join(__dirname, "print.ejs"),
    { passengers },
    (err, html) => {
      if (err) {
        return res.status(500).send("Erro ao gerar o PDF");
      }
      //enviando para o navegador
      return res.send(html);
    }
  );
});
app.listen(3002, () => {
  console.log("Servidor rodando na porta 3002");
});
