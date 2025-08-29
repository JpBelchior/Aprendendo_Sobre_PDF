import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { Passenger } from "../entities/Passenger";
import { Baggage } from "../entities/Baggage";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // Cria as tabelas automaticamente - APENAS EM DESENVOLVIMENTO
  logging: true, // Mostra as queries SQL no console
  entities: [Passenger, Baggage], // Nossas entidades
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conexão com MySQL estabelecida com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco:", error);
    process.exit(1);
  }
};
