import { Request, Response, RequestHandler } from "express";
import AppDataSource from "../infrastructure/database";
import { Invoice } from "../entity/invoice";
import { getLogger } from "../infrastructure/logger";
import axios from "axios";
import FormData from "form-data";

interface OCRResponse {
    doc: {
        source_id: string | null;
        currency: string;
        payment_method: string;
        notes: string | null;
    };
    vendor: {
        name: string;
        address: string | null;
        geo_hint: string | null;
    };
    datetime: {
        date: string;
        time: string | null;
    };
    items: any[];
    totals: {
        subtotal: number | null;
        discount: number | null;
        tax: number | null;
        grand_total: number;
    };
}

class OCRController {
    /**
     * Process OCR from image
     * POST /api/ocr
     * Body: multipart/form-data with file field
     */
    public processOCR: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: "File is required" });
            return;
        }

        try {
            // Create FormData for API request
            const formData = new FormData();
            formData.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });

            // Call OCR API
            const response = await axios.post<OCRResponse>(
                'https://ai-greenmind.khoav4.com/ocr_text',
                formData,
                {
                    headers: {
                        ...formData.getHeaders()
                    },
                    timeout: 30000
                }
            );

            const ocrResult = response.data;
            logger.info("OCR processed successfully", { userId, vendor: ocrResult.vendor.name });

            // Save invoice to database
            const invoiceRepository = AppDataSource.getRepository(Invoice);
            const invoice = invoiceRepository.create({
                userId,
                source_id: ocrResult.doc.source_id || undefined,
                currency: ocrResult.doc.currency,
                payment_method: ocrResult.doc.payment_method || undefined,
                notes: ocrResult.doc.notes || undefined,
                vendor_name: ocrResult.vendor.name,
                vendor_address: ocrResult.vendor.address || undefined,
                vendor_geo_hint: ocrResult.vendor.geo_hint || undefined,
                invoice_date: ocrResult.datetime.date,
                invoice_time: ocrResult.datetime.time || undefined,
                items: ocrResult.items,
                subtotal: ocrResult.totals.subtotal || undefined,
                discount: ocrResult.totals.discount || 0,
                tax: ocrResult.totals.tax || 0,
                grand_total: ocrResult.totals.grand_total
            });

            await invoiceRepository.save(invoice);
            logger.info("Invoice saved successfully", { userId, invoiceId: invoice.id });

            // Return the same format as API response
            res.status(200).json(ocrResult);
        } catch (error) {
            logger.error("Error processing OCR", error as Error);

            if (axios.isAxiosError(error)) {
                res.status(error.response?.status || 500).json({
                    message: "OCR processing failed",
                    error: error.response?.data || error.message
                });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    };
}

export default new OCRController();
