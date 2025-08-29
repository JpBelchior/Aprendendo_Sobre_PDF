import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Baggage } from "./Baggage";

@Entity("passengers") // Nome da tabela no banco
export class Passenger {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  nome!: string;

  @Column({ type: "varchar", length: 10, unique: true })
  numero!: string;

  @Column({ type: "varchar", length: 10 })
  voo!: string;

  @Column({ type: "varchar", length: 10 })
  horario!: string;

  // Relacionamento: Um passageiro pode ter várias bagagens
  @OneToMany(() => Baggage, (baggage) => baggage.passenger, {
    cascade: true, // Quando salvar passageiro, salva bagagens automaticamente
    eager: true, // Sempre carregar bagagens junto com o passageiro
  })
  malas!: Baggage[];
}
