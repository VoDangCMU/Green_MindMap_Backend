import {Request, RequestHandler, Response} from "express";
import {z} from "zod";
import AppDataSource from "../infrastructure/database";
import {Invoices} from "../entity/invoices";
import {InvoiceItems} from "../entity/invoice_items";
import {Vendor} from "../entity/vendor";
import {User} from "../entity/user";
import TEXT from "../config/schemas/Text";
import NUMBER from "../config/schemas/Number";
import BOOLEAN from "../config/schemas/Boolean";
import type {DeepPartial} from "typeorm";
import {Scans} from "../entity/scans";
import {logger} from "../infrastructure/logger";

const invoiceItemsParamsSchemas = z.object({
    raw_name: TEXT.nullish(),
    brand: TEXT.nullish(),
    category: TEXT.nullish(),
    plant_based: BOOLEAN.default(false).nullish(),
    quantity: NUMBER,
    unit_price: NUMBER,
    line_total: NUMBER,
    matched_shopping_list: BOOLEAN.default(false).nullish(),
});

const vendorParamsSchemas = z.object({
    name: TEXT,
    address: TEXT,
    geo_hint: TEXT.nullish(),
});

const docSchema = z.object({
    source_id: z.string().nullish().optional(),
    currency: TEXT,
    payment_method: TEXT,
    notes: TEXT.nullish(),
});

const datetimeSchema = z.object({
    date: TEXT.nullish(),
    time: TEXT.nullish(),
});

const totalsSchema = z.object({
    subtotal: NUMBER,
    discount: NUMBER,
    tax: NUMBER,
    grand_total: NUMBER,
});

const invoiceSchema = z.object({
    doc: docSchema,
    vendor: vendorParamsSchemas,
    datetime: datetimeSchema,
    items: z.array(invoiceItemsParamsSchemas),
    totals: totalsSchema,
    scanId: TEXT.nullish(),
});

function parseIssuedDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;
    let year: string, month: string, day: string;

    if (dateStr.includes("/")) {
        [day, month, year] = dateStr.split("/");
    } else if (dateStr.includes("-")) {
        [year, month, day] = dateStr.split("-");
    } else {
        return null;
    }
    return new Date(Date.UTC(+year, +month - 1, +day));
}

function parseIssuedTime(timeStr?: string | null): string | null {
    if (!timeStr) return null;

    const iso = new Date(timeStr);
    if (!isNaN(iso.getTime())) {
        return iso.toISOString().split("T")[1].split(".")[0];
    }
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
        return timeStr.length === 5 ? timeStr + ":00" : timeStr;
    }
    return null;
}

export class InvoicesController {

    public CreateInvoice: RequestHandler = async (req: Request, res: Response) => {
        const parsed = invoiceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", error: parsed.error.format() });
        }

        try {
            const user = await AppDataSource.getRepository(User).findOne({
                where: {
                    id: req.user?.userId
                },
            })

            if (!user) {
                return res.status(404).json({message: "User not found"});
            }

            const { doc, vendor, datetime, items, totals, scanId } = parsed.data;
            const issuedDate = parseIssuedDate(datetime?.date);
            const issuedTime = parseIssuedTime(datetime?.time);

            const fullInvoice = await AppDataSource.transaction(async (manager) => {
                let newVendor: Vendor | null = null;

                let scan: Scans | null = null;
                if (scanId) {
                    scan = await AppDataSource.getRepository(Scans).findOne({where: {id: scanId}})
                    if (!scan) {
                        scan = null;
                    }
                }

                if (vendor?.name && vendor?.address) {
                    const checkVendor = await manager.findOne(Vendor, {
                        where: {name: vendor.name, address: vendor.address},
                    });
                    if (checkVendor) newVendor = checkVendor;
                    else {
                        newVendor = manager.create(Vendor, {
                            name: vendor.name,
                            address: vendor.address,
                            geoHint: vendor.geo_hint ?? null,
                        });
                        await manager.save(newVendor);
                    }
                }

                const newInvoice = manager.create(Invoices, {
                    sourceId: doc?.source_id ?? null,
                    currency: doc?.currency ?? "VND",
                    paymentMethod: doc?.payment_method ?? "unknown",
                    notes: doc?.notes ?? null,
                    subtotal: totals?.subtotal ?? 0,
                    discount: totals?.discount ?? 0,
                    tax: totals?.tax ?? 0,
                    grandTotal: totals?.grand_total ?? 0,
                    issuedDate,
                    issuedTime,
                    vendor: newVendor ?? undefined,
                    scans: scan ?? undefined,
                    user: user,
                } as DeepPartial<Invoices>);
                await manager.save(newInvoice);

                if (items && items.length > 0) {
                    const invoiceItems = items.map((it) =>
                        manager.create(InvoiceItems, {
                            rawName: it.raw_name ?? null,
                            brand: it.brand ?? null,
                            category: it.category ?? null,
                            plantBased: it.plant_based ?? false,
                            quantity: it.quantity ?? 0,
                            unitPrice: it.unit_price ?? 0,
                            lineTotal: it.line_total ?? 0,
                            matchedShoppingList: it.matched_shopping_list ?? false,
                            invoice: newInvoice,
                        } as DeepPartial<InvoiceItems>)
                    );
                    await manager.save(invoiceItems);
                }

                return await manager.findOne(Invoices, {
                    where: {id: newInvoice.id},
                    relations: {items: true, vendor: true, scans: true, user: true},
                });
            });

            return res.status(201).json({ message: "Invoice created successfully", data: fullInvoice });
        } catch (error) {
            console.error("CreateInvoice Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public GetInvoices: RequestHandler = async (_req, res) => {
        try {
            const invoices = await AppDataSource.getRepository(Invoices).find({
                relations: { items: true, vendor: true, scans: true, user: true },
                order: { createdAt: "DESC" },
            });
            return res.status(200).json({ message: "Successfully", data: invoices.length > 0 ? invoices : "No invoices yet" });
        } catch (error) {
            console.error("GetInvoices Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public GetInvoiceById: RequestHandler = async (req, res) => {
        try {
            const invoice = await AppDataSource.getRepository(Invoices).findOne({
                where: { id: req.params.id },
                relations: { items: true, vendor: true, scans: true, user: true },
            });
            if (!invoice) return res.status(404).json({ message: "Invoice not found" });

            return res.status(200).json({ message: "Invoice found", data: invoice });
        } catch (e) {
            console.error("GetInvoiceById Error:", e);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public UpdateInvoice: RequestHandler = async (req, res) => {
        const parsed = invoiceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", error: parsed.error.format() });
        }

        try {
            const { doc, vendor, datetime, items, totals } = parsed.data;
            const issuedDate = parseIssuedDate(datetime?.date);
            const issuedTime = parseIssuedTime(datetime?.time);

            const updatedInvoice = await AppDataSource.transaction(async (manager) => {
                const existingInvoice = await manager.findOne(Invoices, {
                    where: {id: req.params.id},
                    relations: {items: true, vendor: true},
                });
                if (!existingInvoice) return null;

                let newVendor: Vendor | null = existingInvoice.vendor;
                if (vendor?.name && vendor?.address) {
                    const checkVendor = await manager.findOne(Vendor, {
                        where: {name: vendor.name, address: vendor.address},
                    });
                    if (checkVendor) newVendor = checkVendor;
                    else {
                        newVendor = manager.create(Vendor, {
                            name: vendor.name,
                            address: vendor.address,
                            geoHint: vendor.geo_hint ?? null,
                        });
                        await manager.save(newVendor);
                    }
                }

                Object.assign(existingInvoice, {
                    currency: doc?.currency ?? existingInvoice.currency,
                    paymentMethod: doc?.payment_method ?? existingInvoice.paymentMethod,
                    notes: doc?.notes ?? existingInvoice.notes,
                    subtotal: totals?.subtotal ?? existingInvoice.subtotal,
                    discount: totals?.discount ?? existingInvoice.discount,
                    tax: totals?.tax ?? existingInvoice.tax,
                    grandTotal: totals?.grand_total ?? existingInvoice.grandTotal,
                    issuedDate: issuedDate ?? existingInvoice.issuedDate,
                    issuedTime: issuedTime ?? existingInvoice.issuedTime,
                    vendor: newVendor,
                });
                await manager.save(existingInvoice);

                if (items && items.length > 0) {
                    await manager.delete(InvoiceItems, {invoice: {id: existingInvoice.id}});
                    const invoiceItems = items.map((it) =>
                        manager.create(InvoiceItems, {
                            rawName: it.raw_name ?? null,
                            brand: it.brand ?? null,
                            category: it.category ?? null,
                            plantBased: it.plant_based ?? false,
                            quantity: it.quantity ?? 0,
                            unitPrice: it.unit_price ?? 0,
                            lineTotal: it.line_total ?? 0,
                            matchedShoppingList: it.matched_shopping_list ?? false,
                            invoice: existingInvoice,
                        } as DeepPartial<InvoiceItems>)
                    );
                    await manager.save(invoiceItems);
                }

                return await manager.findOne(Invoices, {
                    where: {id: existingInvoice.id},
                    relations: {items: true, vendor: true, user: true},
                });
            });

            if (!updatedInvoice) return res.status(404).json({message: "Invoice not found"});
            return res.status(200).json({ message: "Invoice updated successfully", data: updatedInvoice });
        } catch (error) {
            console.error("UpdateInvoice Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public DeleteInvoice: RequestHandler = async (req, res) => {
        try {
            const repo = AppDataSource.getRepository(Invoices);
            const invoice = await repo.findOne({
                where: { id: req.params.id },
                relations: { items: true, vendor: true, user: true },
            });
            if (!invoice) return res.status(404).json({ message: "Invoice not found" });
            await repo.delete(invoice.id);
            return res.status(200).json({ message: "Invoice deleted successfully", deleted: invoice });
        } catch (e) {
            console.error("DeleteInvoice Error:", e);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };

    public GetInvoicesByUser: RequestHandler = async (req, res) => {
        try {
            const parsedUserId = z.object({ id: z.string().uuid() }).safeParse(req.params);
            if (!parsedUserId.success) {
                return res.status(400).json({ message: "Invalid input", error: parsedUserId.error.format() });
            }

            const existedUser = await AppDataSource.getRepository(User).findOne({
                where: {
                    id: req.user?.userId,
                },
            })

            if (!existedUser) {
                return res.status(404).json({message: "User not found"});
            }

            const invoices = await AppDataSource.getRepository(Invoices).find({
                where: { user: { id: req.user?.userId, } },
                relations: { items: true, vendor: true, scans: true, user: true },
                order: { createdAt: "DESC" },
            });

            return res.status(200).json({invoices});
        } catch (e) {
            logger.error("Get voice Error:", undefined, { error: e });
            return res.status(500).json({message: "Internal Server Error"});
        }
    }
}

export default new InvoicesController();
