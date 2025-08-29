import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Passenger } from "./Passenger";

@Entity("baggages") // Nome da tabela no banco
export class Baggage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "decimal", precision: 5, scale: 2 }) // 5 dígitos, 2 decimais (ex: 123.45)
  peso!: number;

  @Column({ type: "boolean", default: false })
  fragil!: boolean;

  @Column({ name: "passenger_id" })
  passengerId!: number;

  // Relacionamento: Muitas bagagens pertencem a um passageiro
  @ManyToOne(() => Passenger, (passenger) => passenger.malas, {
    onDelete: "CASCADE", // Se deletar passageiro, deleta bagagens também
  })
  @JoinColumn({ name: "passenger_id" })
  passenger!: Passenger;
}
