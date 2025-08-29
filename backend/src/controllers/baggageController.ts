import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Baggage } from "../entities/Baggage";
import { Passenger } from "../entities/Passenger";

const baggageRepository = () => AppDataSource.getRepository(Baggage);
const passengerRepository = () => AppDataSource.getRepository(Passenger);

// Listar todas as bagagens
export const getAllBaggages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const baggages = await baggageRepository().find({
      relations: ["passenger"],
      order: { id: "ASC" },
    });

    res.json(baggages);
  } catch (error) {
    console.error("Erro ao buscar bagagens:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Buscar bagagem por ID
export const getBaggageById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const baggage = await baggageRepository().findOne({
      where: { id: parseInt(id) },
      relations: ["passenger"],
    });

    if (!baggage) {
      res.status(404).json({ error: "Bagagem não encontrada" });
      return;
    }

    res.json(baggage);
  } catch (error) {
    console.error("Erro ao buscar bagagem:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Adicionar bagagem a um passageiro
export const addBaggageToPassenger = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { passengerId } = req.params;
    const { peso, fragil } = req.body;

    // Verificar se o passageiro existe
    const passenger = await passengerRepository().findOne({
      where: { id: parseInt(passengerId) },
    });

    if (!passenger) {
      res.status(404).json({ error: "Passageiro não encontrado" });
      return;
    }

    // Criar nova bagagem
    const baggage = new Baggage();
    baggage.peso = parseFloat(peso);
    baggage.fragil = Boolean(fragil);
    baggage.passengerId = parseInt(passengerId);

    const savedBaggage = await baggageRepository().save(baggage);

    // Buscar bagagem com dados do passageiro
    const baggageWithPassenger = await baggageRepository().findOne({
      where: { id: savedBaggage.id },
      relations: ["passenger"],
    });

    res.status(201).json(baggageWithPassenger);
  } catch (error) {
    console.error("Erro ao adicionar bagagem:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Atualizar bagagem
export const updateBaggage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { peso, fragil } = req.body;

    const baggage = await baggageRepository().findOne({
      where: { id: parseInt(id) },
    });

    if (!baggage) {
      res.status(404).json({ error: "Bagagem não encontrada" });
      return;
    }

    // Atualizar dados
    baggage.peso = parseFloat(peso);
    baggage.fragil = Boolean(fragil);

    const updatedBaggage = await baggageRepository().save(baggage);

    // Buscar com dados do passageiro
    const baggageWithPassenger = await baggageRepository().findOne({
      where: { id: updatedBaggage.id },
      relations: ["passenger"],
    });

    res.json(baggageWithPassenger);
  } catch (error) {
    console.error("Erro ao atualizar bagagem:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Deletar bagagem
export const deleteBaggage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const baggage = await baggageRepository().findOne({
      where: { id: parseInt(id) },
    });

    if (!baggage) {
      res.status(404).json({ error: "Bagagem não encontrada" });
      return;
    }

    await baggageRepository().remove(baggage);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar bagagem:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Buscar bagagens por passageiro
export const getBaggagesByPassenger = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { passengerId } = req.params;

    const baggages = await baggageRepository().find({
      where: { passengerId: parseInt(passengerId) },
      relations: ["passenger"],
      order: { id: "ASC" },
    });

    res.json(baggages);
  } catch (error) {
    console.error("Erro ao buscar bagagens do passageiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Estatísticas das bagagens
export const getBaggageStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const baggages = await baggageRepository().find({
      relations: ["passenger"],
    });

    const stats = {
      total: baggages.length,
      frageis: baggages.filter((b) => b.fragil).length,
      naoFrageis: baggages.filter((b) => !b.fragil).length,
      pesoTotal: baggages.reduce((sum, b) => sum + Number(b.peso), 0),
      pesoMedio:
        baggages.length > 0
          ? (
              baggages.reduce((sum, b) => sum + Number(b.peso), 0) /
              baggages.length
            ).toFixed(2)
          : 0,
      maiorPeso:
        baggages.length > 0
          ? Math.max(...baggages.map((b) => Number(b.peso)))
          : 0,
      menorPeso:
        baggages.length > 0
          ? Math.min(...baggages.map((b) => Number(b.peso)))
          : 0,
      porVoo: {},
    };

    // Agrupar por voo
    const bagagesPorVoo = baggages.reduce((acc: any, baggage) => {
      const voo = baggage.passenger.voo;
      if (!acc[voo]) {
        acc[voo] = {
          total: 0,
          frageis: 0,
          peso: 0,
        };
      }
      acc[voo].total++;
      if (baggage.fragil) acc[voo].frageis++;
      acc[voo].peso += Number(baggage.peso);
      return acc;
    }, {});

    stats.porVoo = bagagesPorVoo;

    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas das bagagens:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};
