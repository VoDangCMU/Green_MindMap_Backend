import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./user";
import { Scans } from "./scans";
import { InvoiceItems } from "../entity/invoice_items";
import { Vendor } from "../entity/vendor";

export const INVOICES_TABLE_NAME = "invoices";

@Entity(INVOICES_TABLE_NAME)
export class Invoices {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Vendor, (vendor) => vendor.invoices, { eager: true })
    vendor!: Vendor;

    @ManyToOne(() => User, (user) => user.invoices, { onDelete: "CASCADE" })
    user!: User;

    @ManyToOne(() => Scans, (scans) => scans.invoices, { onDelete: "CASCADE" })
    scans!: Scans;

    @Column({ type: "text", name: "source_id", nullable: true })
    sourceId!: string;

    @Column({ name: "currency", type: "text" })
    currency!: string;

    @Column({ name: "payment_method", type: "text" })
    paymentMethod!: string;

    @Column({ name: "notes", type: "text", nullable: true })
    notes!: string | null;

    @Column({ name: "issued_date", type: "date", nullable: true })
    issuedDate!: Date | null;

    @Column({ name: "issued_time", type: "time", nullable: true })
    issuedTime!: string | null;

    @Column({ name: "subtotal", type: "numeric" })
    subtotal!: number;

    @Column({ name: "discount", type: "numeric" })
    discount!: number;

    @Column({ name: "tax", type: "numeric" })
    tax!: number;

    @Column({ name: "grand_total", type: "numeric" })
    grandTotal!: number;

    @OneToMany(() => InvoiceItems, (item) => item.invoice, { cascade: true })
    items!: InvoiceItems[];

    @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
    updatedAt!: Date;
}
