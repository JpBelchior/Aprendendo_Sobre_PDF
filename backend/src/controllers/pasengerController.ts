import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Passenger } from "../entities/Passenger";
import { Baggage } from "../entities/Baggage";

// Repositórios
const passengerRepository = () => AppDataSource.getRepository(Passenger);
const baggageRepository = () => AppDataSource.getRepository(Baggage);

// Listar todos os passageiros
export const getAllPassengers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const passengers = await passengerRepository().find({
      relations: ["malas"], // Carregar bagagens junto
      order: { id: "ASC" },
    });

    res.json(passengers);
  } catch (error) {
    console.error("Erro ao buscar passageiros:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Buscar passageiro por ID
export const getPassengerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const passenger = await passengerRepository().findOne({
      where: { id: parseInt(id) },
      relations: ["malas"],
    });

    if (!passenger) {
      res.status(404).json({ error: "Passageiro não encontrado" });
      return;
    }

    res.json(passenger);
  } catch (error) {
    console.error("Erro ao buscar passageiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Criar novo passageiro
export const createPassenger = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { nome, numero, voo, horario, malas } = req.body;

    // Verificar se o número já existe
    const existingPassenger = await passengerRepository().findOne({
      where: { numero },
    });

    if (existingPassenger) {
      res.status(400).json({ error: "Número de passageiro já existe" });
      return;
    }

    // Criar novo passageiro
    const passenger = new Passenger();
    passenger.nome = nome;
    passenger.numero = numero;
    passenger.voo = voo;
    passenger.horario = horario;

    // Salvar passageiro primeiro
    const savedPassenger = await passengerRepository().save(passenger);

    // Criar bagagens se fornecidas
    if (malas && malas.length > 0) {
      const baggages = malas.map((mala: any) => {
        const baggage = new Baggage();
        baggage.peso = parseFloat(mala.peso);
        baggage.fragil = Boolean(mala.fragil);
        baggage.passengerId = savedPassenger.id;
        return baggage;
      });

      await baggageRepository().save(baggages);
    }

    // Buscar passageiro com bagagens
    const passengerWithBaggages = await passengerRepository().findOne({
      where: { id: savedPassenger.id },
      relations: ["malas"],
    });

    res.status(201).json(passengerWithBaggages);
  } catch (error) {
    console.error("Erro ao criar passageiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Atualizar passageiro
export const updatePassenger = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { nome, numero, voo, horario, malas } = req.body;

    const passenger = await passengerRepository().findOne({
      where: { id: parseInt(id) },
      relations: ["malas"],
    });

    if (!passenger) {
      res.status(404).json({ error: "Passageiro não encontrado" });
      return;
    }

    // Verificar se o novo número já existe (se foi alterado)
    if (numero !== passenger.numero) {
      const existingPassenger = await passengerRepository().findOne({
        where: { numero },
      });

      if (existingPassenger) {
        res.status(400).json({ error: "Número de passageiro já existe" });
        return;
      }
    }

    // Atualizar dados do passageiro
    passenger.nome = nome;
    passenger.numero = numero;
    passenger.voo = voo;
    passenger.horario = horario;

    await passengerRepository().save(passenger);

    // Remover bagagens antigas
    if (passenger.malas.length > 0) {
      await baggageRepository().remove(passenger.malas);
    }

    // Adicionar novas bagagens
    if (malas && malas.length > 0) {
      const baggages = malas.map((mala: any) => {
        const baggage = new Baggage();
        baggage.peso = parseFloat(mala.peso);
        baggage.fragil = Boolean(mala.fragil);
        baggage.passengerId = passenger.id;
        return baggage;
      });

      await baggageRepository().save(baggages);
    }

    // Buscar passageiro atualizado
    const updatedPassenger = await passengerRepository().findOne({
      where: { id: passenger.id },
      relations: ["malas"],
    });

    res.json(updatedPassenger);
  } catch (error) {
    console.error("Erro ao atualizar passageiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Deletar passageiro
export const deletePassenger = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const passenger = await passengerRepository().findOne({
      where: { id: parseInt(id) },
    });

    if (!passenger) {
      res.status(404).json({ error: "Passageiro não encontrado" });
      return;
    }

    await passengerRepository().remove(passenger);
    res.status(204).send(); // 204 = No Content (deletado com sucesso)
  } catch (error) {
    console.error("Erro ao deletar passageiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Estatísticas de bagagens por passageiro
export const getPassengerBaggageStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const passenger = await passengerRepository().findOne({
      where: { id: parseInt(id) },
      relations: ["malas"],
    });

    if (!passenger) {
      res.status(404).json({ error: "Passageiro não encontrado" });
      return;
    }

    const stats = {
      passageiro: {
        id: passenger.id,
        nome: passenger.nome,
        numero: passenger.numero,
        voo: passenger.voo,
      },
      bagagens: {
        total: passenger.malas.length,
        frageis: passenger.malas.filter((mala) => mala.fragil).length,
        naoFrageis: passenger.malas.filter((mala) => !mala.fragil).length,
        pesoTotal: passenger.malas.reduce(
          (total, mala) => total + Number(mala.peso),
          0
        ),
        pesoMedio:
          passenger.malas.length > 0
            ? (
                passenger.malas.reduce(
                  (total, mala) => total + Number(mala.peso),
                  0
                ) / passenger.malas.length
              ).toFixed(2)
            : 0,
      },
      detalhes: passenger.malas.map((mala) => ({
        id: mala.id,
        peso: Number(mala.peso),
        fragil: mala.fragil,
      })),
    };

    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Estatísticas gerais dos voos
export const getFlightStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const passengers = await passengerRepository().find({
      relations: ["malas"],
    });

    // Agrupar por voo
    const flightStats = passengers.reduce((acc: any, passenger) => {
      if (!acc[passenger.voo]) {
        acc[passenger.voo] = {
          voo: passenger.voo,
          totalPassageiros: 0,
          totalMalas: 0,
          malasFrageis: 0,
          malasNaoFrageis: 0,
          pesoTotal: 0,
          passageiros: [],
        };
      }

      const malasFrageis = passenger.malas.filter((m) => m.fragil).length;
      const pesoPassageiro = passenger.malas.reduce(
        (sum, mala) => sum + Number(mala.peso),
        0
      );

      acc[passenger.voo].totalPassageiros++;
      acc[passenger.voo].totalMalas += passenger.malas.length;
      acc[passenger.voo].malasFrageis += malasFrageis;
      acc[passenger.voo].malasNaoFrageis +=
        passenger.malas.length - malasFrageis;
      acc[passenger.voo].pesoTotal += pesoPassageiro;

      acc[passenger.voo].passageiros.push({
        nome: passenger.nome,
        numero: passenger.numero,
        malas: passenger.malas.length,
        malasFrageis: malasFrageis,
        peso: pesoPassageiro,
      });

      return acc;
    }, {});

    const stats = Object.values(flightStats);
    const totalPassengers = passengers.length;
    const totalBaggages = passengers.reduce(
      (sum, p) => sum + p.malas.length,
      0
    );
    const totalWeight = passengers.reduce(
      (sum, p) => sum + p.malas.reduce((w, m) => w + Number(m.peso), 0),
      0
    );

    res.json({
      resumo: {
        totalPassageiros: totalPassengers,
        totalMalas: totalBaggages,
        pesoTotal: totalWeight,
      },
      porVoo: stats,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas dos voos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};
