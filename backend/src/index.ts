import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { initializeDatabase } from "./config/database";

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de teste
app.get("/", (req, res) => {
  res.json({
    message: "API do Sistema de Passageiros funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Rota de health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", database: "Connected" });
});

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Inicializar banco de dados
    await initializeDatabase();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 Acesse: http://localhost:3002`);
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
};

startServer();
