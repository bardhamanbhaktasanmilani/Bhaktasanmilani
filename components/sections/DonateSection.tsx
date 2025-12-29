// components/sections/DonateSection.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import Script from "next/script";
import { Heart, IndianRupee, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Rewritten DonateSection with PDF compression helpers and a fix for "black spots":
 * - If converting images to JPEG (to reduce size), the canvas is explicitly filled
 *   with white before drawing the image so transparent pixels don't become black.
 * - When an image must preserve transparency, PNG output is used (slightly larger).
 * - Uses jsPDF with compress: true.
 *
 * No UI / design changes were made — only image-to-canvas handling and PDF generation fixes.
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

const donationAmounts = [500, 1000, 2500, 5000, 10000];

type ReceiptData = {
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  amount: number;
  paymentId: string;
  orderId: string;
  receiptNo?: string;
  createdAt?: string;
};

/* ------------------ Utilities: image compression & optional font embedding ------------------ */

/**
 * fetchAndCompressImage:
 * - fetches an image from `path` (supports PNG/AVIF/JPEG/WebP)
 * - draws it to an offscreen canvas and returns a data URL (JPEG or PNG) with given quality and max dimensions
 *
 * Important: to avoid black spots when converting transparent images to JPEG,
 * we fill the canvas with white (or a provided background color) before drawing.
 *
 * preserveAlpha: if true, output will be PNG to preserve transparency (no white fill).
 */
async function fetchAndCompressImage(
  path: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7,
  preserveAlpha = false,
  backgroundColor = "#ffffff"
): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();

    // createImageBitmap is usually faster and avoids CORS issues when using fetch+blob
    let imgBitmap: ImageBitmap | null = null;
    try {
      imgBitmap = await createImageBitmap(blob);
    } catch (e) {
      // Fallback to Image() if createImageBitmap not available or fails on some formats
      // We'll return via canvas after loading the image element
    }

    // If we got an ImageBitmap, use it
    let width = 0;
    let height = 0;
    if (imgBitmap) {
      width = imgBitmap.width;
      height = imgBitmap.height;
    } else {
      // fallback: use HTMLImageElement
      const imgUrl = URL.createObjectURL(blob);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = (err) => reject(err);
        // No crossOrigin because we used fetch -> blob (same-origin blob), safe
        i.src = imgUrl;
      });
      width = img.naturalWidth || img.width;
      height = img.naturalHeight || img.height;

      // createImageBitmap from image element if supported (to unify handling)
      try {
        imgBitmap = await createImageBitmap(img);
      } catch {
        // createImageBitmap may still fail; we'll just draw image element below by using Canvas drawImage(img,...)
        // but we'll keep `img` in closure by re-creating from blob
      } finally {
        URL.revokeObjectURL(imgUrl);
      }
    }

    if (!width || !height) return null;

    // compute scale to fit within maxWidth x maxHeight (preserve aspect)
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    // Improve smoothing for downscaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // If we are converting to JPEG (no alpha), fill background with provided color to avoid black artifacts.
    const willOutputPNG = preserveAlpha;
    if (!willOutputPNG) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, targetW, targetH);
    } else {
      // If preserving alpha, clear and leave transparent
      ctx.clearRect(0, 0, targetW, targetH);
    }

    // Draw image (prefer ImageBitmap if available)
    if (imgBitmap) {
      ctx.drawImage(imgBitmap as ImageBitmap, 0, 0, targetW, targetH);
    } else {
      // As a last fallback, draw via an Image created from blob
      const url = URL.createObjectURL(blob);
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
      });
      ctx.drawImage(imgEl, 0, 0, targetW, targetH);
      URL.revokeObjectURL(url);
    }

    // Output type
    const outType = willOutputPNG ? "image/png" : "image/jpeg";
    const outQuality = willOutputPNG ? undefined : quality;

    // toDataURL with quality only for JPEG
    const dataUrl = willOutputPNG ? canvas.toDataURL(outType) : canvas.toDataURL(outType, outQuality);

    // cleanup any ImageBitmap resource
    try {
      // @ts-ignore
      if (imgBitmap && typeof (imgBitmap as any).close === "function") (imgBitmap as any).close();
    } catch {}

    return dataUrl;
  } catch (e) {
    console.warn("fetchAndCompressImage error", e);
    return null;
  }
}

/**
 * registerFontConditionally
 * - tries to fetch a font and add to jsPDF *only if* its byte length is below threshold.
 * - avoids embedding large fonts by default (which balloon PDF size).
 */
async function registerFontConditionally(
  doc: any,
  url: string,
  vfsName: string,
  fontName: string,
  maxBytes = 150 * 1024 // 150 KB default
): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.byteLength > maxBytes) {
      console.info(
        `Skipping font embedding (${fontName}) — size ${bytes.byteLength} bytes > ${maxBytes} threshold`
      );
      return false;
    }
    // Convert to base64 more efficiently
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
    }
    const base64 = btoa(binary);
    doc.addFileToVFS(vfsName, base64);
    doc.addFont(vfsName, fontName, "normal");
    return true;
  } catch (e) {
    console.warn("registerFontConditionally error", e);
    return false;
  }
}

/* ------------------ Modal component (unchanged behavior) ------------------ */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ open, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------ SuccessModal with compressed PDF generation (fixed) ------------------ */

function SuccessModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}) {
  if (!open || !data) return null;

  const [compressEnabled, setCompressEnabled] = useState(true);

  const formattedDate =
    data.createdAt && !Number.isNaN(Date.parse(data.createdAt))
      ? new Date(data.createdAt).toLocaleDateString()
      : new Date().toLocaleDateString();

  const handleDownload = async () => {
    try {
      const jsPDFModule: any = await import("jspdf");
      const jsPDFCtor = jsPDFModule.jsPDF || jsPDFModule.default || jsPDFModule;

      // Use jsPDF compression option
      const doc: any = new jsPDFCtor({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = 210;
      const marginX = 10;

      // Header band
      doc.setFillColor(234, 88, 12);
      doc.rect(0, 0, pageWidth, 38, "F");

      // Logo — compress & avoid black background
      try {
        // for header logo we can reduce to JPEG with white fill to keep sizes small
        const omData = compressEnabled
          ? await fetchAndCompressImage("/Donate/Om.png", 300, 300, 0.65, false, "#ffffff")
          : await fetchAndCompressImage("/Donate/Om.png", 1200, 1200, 0.95, false, "#ffffff");
        if (omData) {
          const imgType = omData.startsWith("data:image/png") ? "PNG" : "JPEG";
          doc.addImage(omData, imgType, marginX + 2, 6, 22, 22);
        }
      } catch (e) {
        console.warn("logo add failed", e);
      }

      // Header text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("SHRI RADHA KRISHNA  TEMPLE ", marginX + 28, 13);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("by Bardhaman Bhaktasanmilani", marginX + 28, 18);

      doc.setFontSize(8);
      doc.text(
        "R.B Chatterjee Road , Tikorhat, Bardhaman West Bengal - 713102, India",
        marginX + 28,
        23
      );
      doc.text("6RVR+7W Bardhaman, West Bengal", marginX + 28, 27);

      // Right side header
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const rightX = pageWidth - marginX - 2;
      doc.text(`Receipt No: ${data.receiptNo || "To be assigned"}`, rightX, 10, {
        align: "right",
      });
      doc.text(`Created: ${formattedDate}`, rightX, 15, { align: "right" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Payment ID: ${data.paymentId}`, rightX, 21, { align: "right" });
      doc.text(`Order ID: ${data.orderId}`, rightX, 26, { align: "right" });

      // Income tax band
      doc.setFillColor(255, 247, 237);
      doc.rect(marginX, 40, pageWidth - marginX * 2, 10, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Income Tax Exemption (80-G) Number: AAEAB1253F25KL02", marginX + 2, 46);
      doc.setFont("helvetica", "normal");
      doc.text("Mode of Payment: Online", pageWidth - marginX - 2, 46, { align: "right" });

      // Donor details
      let y = 55;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("DONOR DETAILS", marginX + 2, y);
      y += 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Received with thanks from:", marginX + 2, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(data.donorName || "", marginX + 2, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (data.donorEmail) {
        doc.text(data.donorEmail, marginX + 2, y);
        y += 5;
      }
      if (data.donorPhone) {
        doc.text(data.donorPhone, marginX + 2, y);
        y += 5;
      }
      y += 2;
      doc.text("As donation for the cause of Temple Construction & Maintenance.", marginX + 2, y);

      // ---------------- Transaction & Purpose boxes ----------------
      const rightBoxX = pageWidth / 2 + 2;
      const boxWidth = pageWidth - rightBoxX - marginX;
      const boxPadding = 3;

      // TRANSACTION DETAIL header + box
      const transHeaderY = 55;
      doc.setFillColor(249, 115, 22);
      doc.rect(rightBoxX, transHeaderY, boxWidth, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TRANSACTION DETAIL", rightBoxX + 2, transHeaderY + 4);

      doc.setTextColor(0, 0, 0);

      const transBoxY = transHeaderY + 6;
      const transBoxHeight = 18;

      doc.rect(rightBoxX, transBoxY, boxWidth, transBoxHeight, "S");

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Amount Donated", rightBoxX + 2, transBoxY + 5);

      // HARD RESET of PDF text state (fixes kerning / operator issues)
      try {
        // @ts-ignore
        if (doc.internal && doc.internal.write) doc.internal.write("0 Tc");
      } catch {}

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);

      doc.text(`INR ${Number(data.amount).toLocaleString("en-IN")}`, rightBoxX + 2, transBoxY + 11);

      // PURPOSE OF DONATION: dynamic wrap + dynamic height
      const purposeHeaderY = transBoxY + transBoxHeight + 4;
      doc.setFillColor(249, 115, 22);
      doc.rect(rightBoxX, purposeHeaderY, boxWidth, 6, "F");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("PURPOSE OF DONATION", rightBoxX + 2, purposeHeaderY + 4);

      const purposeText =
        "Donation - Temple Construction & Maintenance | Social activities and charitable purposes";

      // helper conversions
      const lineHeightFactor = 1.15;
      const ptToMm = (pt: number) => pt * 0.352777778;
      const computeHeight = (linesCount: number, fSize: number) => {
        const lineHtMm = ptToMm(fSize) * lineHeightFactor;
        return linesCount * lineHtMm;
      };

      let purposeFontSize = 8;
      let purposeLines = doc.splitTextToSize(purposeText, boxWidth - boxPadding * 2);
      let purposeHeight = computeHeight(purposeLines.length, purposeFontSize);

      const maxPurposeBoxHeight = 36;
      while (purposeHeight > maxPurposeBoxHeight && purposeFontSize > 6) {
        purposeFontSize -= 0.5;
        purposeLines = doc.splitTextToSize(purposeText, boxWidth - boxPadding * 2);
        purposeHeight = computeHeight(purposeLines.length, purposeFontSize);
      }

      const maxLinesThatFit = Math.floor(maxPurposeBoxHeight / (ptToMm(purposeFontSize) * lineHeightFactor));
      if (purposeLines.length > maxLinesThatFit) {
        const truncated = purposeLines.slice(0, Math.max(1, maxLinesThatFit));
        let last = truncated[truncated.length - 1];
        if (!last.endsWith("...")) {
          last = last.replace(/\s*\S{0,10}$/, (m: string) => m.trim()) + "...";
        }
        truncated[truncated.length - 1] = last;
        purposeLines = truncated;
        purposeHeight = computeHeight(purposeLines.length, purposeFontSize);
      }

      const purposeBoxY = purposeHeaderY + 6;
      const purposeBoxInnerY = purposeBoxY + boxPadding;
      const purposeBoxHeight = Math.max(14, purposeHeight + boxPadding * 2); // at least a small box

      doc.setFontSize(8);
      doc.rect(rightBoxX, purposeBoxY, boxWidth, purposeBoxHeight, "S");

      const lineHeightMm = ptToMm(purposeFontSize) * lineHeightFactor;
      purposeLines.forEach((line: string, idx: number) => {
        doc.setFontSize(purposeFontSize);
        doc.setFont("helvetica", "normal");
        doc.text(line, rightBoxX + boxPadding, purposeBoxInnerY + idx * lineHeightMm + ptToMm(purposeFontSize) / 2);
      });

      // ---------------- PAYMENT DETAILS ----------------
      const box3Y = purposeBoxY + purposeBoxHeight + 6;
      doc.setFillColor(249, 115, 22);
      doc.rect(rightBoxX, box3Y, boxWidth, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("PAYMENT DETAILS", rightBoxX + 2, box3Y + 4);

      doc.setTextColor(0, 0, 0);
      doc.rect(rightBoxX, box3Y + 6, boxWidth, 14, "S");
      doc.setFontSize(8);
      doc.text("Razorpay - Online Transaction", rightBoxX + 2, box3Y + 12);

      // ---------------- Amount big box (left) ----------------
      const amountBoxY = box3Y + 6 + 14 + 8;
      doc.setDrawColor(245, 158, 11);
      doc.setFillColor(255, 247, 237);
      doc.rect(marginX + 2, amountBoxY, 50, 12, "FD");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`INR ${data.amount.toLocaleString()}`, marginX + 4, amountBoxY + 8);

      // Notes block
      let notesY = amountBoxY + 20;
      doc.setFillColor(255, 247, 237);
      doc.rect(marginX, notesY - 6, pageWidth - marginX * 2, 40, "F");

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Please note:", marginX + 2, notesY);
      notesY += 5;
      doc.setFont("helvetica", "normal");
      const notes = [
        "• Donation is irrevocable.",
        "• PAN is compulsory for issuance of 80-G receipts as per Income Tax rules.",
        "• 80-G receipts are available for donations received towards temple construction, maintenance, and charitable purposes.",
        "• In case of any error/discrepancy, contact us within 15 days from the date of this receipt.",
      ];
      notes.forEach((line) => {
        doc.text(line, marginX + 4, notesY);
        notesY += 5;
      });

      // Signature footer
      const footerY = notesY + 12;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("For BhaktaSanmilani", marginX + 2, footerY);

      // Signature image: fetch & compress with white background to avoid black artifacts
      const sigWidth = 40; // mm
      const sigHeight = 12; // mm
      const sigX = pageWidth - marginX - sigWidth;
      const sigY = footerY - 8;

      try {
        const sigData = compressEnabled
          ? await fetchAndCompressImage("/Donate/signature.AVIF", 600, 200, 0.6, false, "#ffffff")
          : await fetchAndCompressImage("/Donate/signature.AVIF", 1600, 800, 0.95, false, "#ffffff");
        if (sigData) {
          const imgType = sigData.startsWith("data:image/png") ? "PNG" : "JPEG";
          doc.addImage(sigData, imgType, sigX, sigY - 2, sigWidth, sigHeight);
        } else {
          doc.line(pageWidth - marginX - 40, footerY - 2, pageWidth - marginX, footerY - 2);
        }
      } catch {
        doc.line(pageWidth - marginX - 40, footerY - 2, pageWidth - marginX, footerY - 2);
      }

      doc.text("Authorised Signatory", pageWidth - marginX - 2, footerY + 3, { align: "right" });

      // Devotional bottom content
      const devotionY = footerY + 18;

      // Conditional font embedding (only when compression disabled)
      if (!compressEnabled) {
        try {
          await registerFontConditionally(
            doc,
            "/fonts/NotoSansDevanagari-Bold.ttf",
            "NotoSansDevanagari-Bold.ttf",
            "NotoSansDevanagari",
            300 * 1024
          );
          doc.setFont("NotoSansDevanagari", "normal");
        } catch {
          doc.setFont("helvetica", "normal");
        }
      } else {
        doc.setFont("helvetica", "normal");
      }

      // Render Devanagari phrase: when compression on, render as small JPEG (white bg) to ensure appearance,
      // but avoid transparent regions becoming black by using white fill in the canvas used to generate the image.
      if (compressEnabled) {
        try {
          const phrase = "कृष्णं वन्दे जगद्गुरुम्";
          const off = document.createElement("canvas");
          const pxW = 800;
          const pxH = 120;
          off.width = pxW;
          off.height = pxH;
          const ctx = off.getContext("2d");
          if (ctx) {
            // white background so JPEG won't show black
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, pxW, pxH);

            ctx.font = "36px Noto Sans Devanagari, serif";
            ctx.textAlign = "center";
            ctx.fillStyle = "black";
            // center vertically
            ctx.fillText(phrase, pxW / 2, pxH / 2 + 12);

            const imgData = off.toDataURL("image/jpeg", 0.7);
            const imgWmm = 100 / 2; // approx
            const imgHmm = 10;
            doc.addImage(imgData, "JPEG", pageWidth / 2 - imgWmm / 2, devotionY, imgWmm, imgHmm);
          } else {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(phrase, pageWidth / 2, devotionY, { align: "center" });
          }
        } catch (e) {
          // fallback to text
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text("कृष्णं वन्दे जगद्गुरुम्", pageWidth / 2, devotionY, { align: "center" });
        }
      } else {
        doc.setFont("NotoSansDevanagari", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("कृष्णं वन्दे जगद्गुरुम्", pageWidth / 2, devotionY, { align: "center" });
      }

      doc.setFont("helvetica", "normal");

      // Decorative images (feather, flute) — compress and white-fill to avoid black spots
      try {
        const featherData = compressEnabled
          ? await fetchAndCompressImage("/images/pea-cock (feather).png", 200, 200, 0.6, false, "#ffffff")
          : await fetchAndCompressImage("/images/pea-cock (feather).png", 800, 800, 0.95, false, "#ffffff");
        if (featherData) {
          const featherWidth = 10;
          const featherHeight = 14;
          const textOffsetX = 35;
          const featherX = pageWidth / 2 + textOffsetX;
          const featherY = devotionY - featherHeight + 2;
          const imgType = featherData.startsWith("data:image/png") ? "PNG" : "JPEG";
          doc.addImage(featherData, imgType, featherX, featherY, featherWidth, featherHeight);
        }
      } catch (e) {
        // ignore
      }

      try {
        const fluteData = compressEnabled
          ? await fetchAndCompressImage("/images/flute.png", 600, 200, 0.6, false, "#ffffff")
          : await fetchAndCompressImage("/images/flute.png", 1800, 600, 0.95, false, "#ffffff");
        if (fluteData) {
          const fluteWidth = 45;
          const fluteHeight = 12;
          const fluteX = (pageWidth - fluteWidth) / 2;
          const fluteY = devotionY + 8;
          const imgType = fluteData.startsWith("data:image/png") ? "PNG" : "JPEG";
          doc.addImage(fluteData, imgType, fluteX, fluteY, fluteWidth, fluteHeight);
        }
      } catch {}

      // finally save
      doc.save(`BhaktaSammilan_Receipt_${data.paymentId}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Unable to download the receipt right now. Please try again.");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-orange-100">
          <CheckCircle2 className="w-10 h-10 text-orange-600" />
        </div>

        <h2 className="text-2xl font-bold text-orange-600">🎉 Thank you for your donation!</h2>

        <p className="text-sm text-gray-700">
          Dear <span className="font-semibold">{data.donorName}</span>, your donation of{" "}
          <span className="font-semibold">₹{data.amount.toLocaleString()}</span> has been received successfully.
        </p>

        <p className="text-xs text-gray-500">
          Payment ID: <span className="font-mono break-all">{data.paymentId}</span>
          <br />
          Order ID: <span className="font-mono break-all">{data.orderId}</span>
        </p>

        <div className="w-full flex flex-col gap-3 sm:flex-row sm:justify-center pt-2">
          <div className="flex items-center gap-3">
            <input
              id="compressToggle"
              type="checkbox"
              checked={compressEnabled}
              onChange={() => setCompressEnabled((s) => !s)}
              className="w-4 h-4"
            />
            <label htmlFor="compressToggle" className="text-sm text-gray-700">
              Compress receipt (recommended — much smaller file)
            </label>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3 sm:flex-row sm:justify-center pt-2">
          <Button type="button" onClick={handleDownload} size="lg" fullWidth className="bg-orange-600 hover:bg-orange-700">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt (PDF)
          </Button>
          <Button type="button" variant="outline" size="lg" fullWidth onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------ Main DonateSection (kept behavior, small changes) ------------------ */

export default function DonateSection() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Razorpay script state
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const waitTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      setRazorpayReady(true);
    }
    return () => {
      if (waitTimeoutRef.current) {
        window.clearTimeout(waitTimeoutRef.current);
      }
    };
  }, []);

  const waitForRazorpay = (timeout = 5000): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const start = Date.now();
      const interval = setInterval(() => {
        if ((window as any).Razorpay) {
          clearInterval(interval);
          resolve(true);
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
    });
  };

  const handleDonation = async () => {
    const amount = customAmount ? Math.round(Number(customAmount)) : selectedAmount ?? 0;

    if (!amount || amount < 1) {
      alert("Please select or enter a valid donation amount");
      return;
    }

    if (!donorName || !donorEmail || !donorPhone) {
      alert("Please fill in all your details");
      return;
    }

    setLoading(true);

    try {
      if (!razorpayReady) {
        const ready = await waitForRazorpay(4000);
        if (!ready) {
          alert("Payment system is still loading. Please try again in a moment.");
          setLoading(false);
          return;
        }
        setRazorpayReady(true);
      }

      const createRes = await fetch("/api/donations/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          donorName,
          donorEmail,
          donorPhone,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        alert(err.error || "Failed to create donation order.");
        setLoading(false);
        return;
      }

      const orderData: {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      } = await createRes.json();

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Bhakta Sammilan",
        description: "Devotional Donation",
        image: "/Donate/Om.png",
        order_id: orderData.orderId,
        prefill: {
          name: donorName,
          email: donorEmail,
          contact: donorPhone,
        },
        theme: {
          color: "#ea580c",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/donations/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({}));
              alert(
                err.error ||
                  "Payment was received but verification failed. Our team will review this transaction."
              );
              return;
            }

            const verifyJson = await verifyRes.json().catch(() => ({}));
            const payment = verifyJson.payment || {};
            const paymentId = payment.paymentId || response.razorpay_payment_id;
            const orderId = payment.orderId || response.razorpay_order_id;
            const receiptNo = payment.receiptNo || undefined;
            const createdAt = payment.createdAt || new Date().toISOString();

            setReceiptData({
              donorName,
              donorEmail,
              donorPhone,
              amount,
              paymentId,
              orderId,
              receiptNo,
              createdAt,
            });
            setShowSuccess(true);

            setSelectedAmount(null);
            setCustomAmount("");
            setDonorName("");
            setDonorEmail("");
            setDonorPhone("");
          } catch (error) {
            console.error("Error verifying donation:", error);
            alert(
              "Payment received, but we could not verify automatically. Please contact support with your payment ID."
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            console.log("Payment popup closed");
          },
        },
      };

      if (typeof window === "undefined" || !(window as any).Razorpay) {
        alert("Payment system is still loading. Please try again in a moment.");
        setLoading(false);
        return;
      }

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Donation initiation error:", error);
      alert("Something went wrong while initiating the donation.");
      setLoading(false);
    }
  };

  const displayAmount =
    customAmount && Number(customAmount) > 0 ? Number(customAmount) : selectedAmount || null;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Razorpay SDK loaded");
          setRazorpayReady(true);
        }}
        onError={() => {
          console.error("Failed to load Razorpay SDK");
          setScriptFailed(true);
          setRazorpayReady(false);
        }}
      />

      <section id="donate" className="py-16 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-6xl px-4 mx-auto sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              Make a{" "}
              <span className="text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text">
                Donation
              </span>
            </h2>
          </div>

          <div className="grid items-start max-w-6xl mx-auto gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
            <div className="p-6 shadow-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 rounded-3xl md:p-8">
              <div className="mb-6">
                <h3 className="flex items-center gap-2 mb-4 text-2xl font-bold text-gray-900">
                  <IndianRupee className="w-6 h-6 text-orange-600" />
                  Select Donation Amount
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-3 md:grid-cols-5">
                  {donationAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                      className={`py-3 px-4 rounded-xl font-semibold text-base md:text-lg transition-all duration-300 ${
                        selectedAmount === amount
                          ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg scale-105"
                          : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200"
                      }`}
                    >
                      ₹{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Or enter custom amount
                  </label>
                  <div className="relative">
                    <span className="absolute text-base text-gray-500 -translate-y-1/2 left-4 top-1/2">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      placeholder="Enter amount"
                      className="w-full py-3 pr-3 text-base border-2 border-gray-200 pl-9 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <h3 className="mb-2 text-2xl font-bold text-gray-900">Your Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-3 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Phone Number *</label>
                    <input
                      type="tel"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full px-3 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDonation}
                disabled={loading || scriptFailed}
                className={`flex items-center justify-center w-full gap-3 py-4 text-lg font-bold text-white rounded-xl transition-all duration-300 transform bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-2xl hover:scale-105 ${
                  loading ? "opacity-80 cursor-not-allowed" : ""
                }`}
              >
                <Heart className="w-6 h-6" />
                {loading ? (
                  "Processing..."
                ) : (
                  `Donate ${displayAmount ? `₹${displayAmount.toLocaleString()}` : "Now"}`
                )}
              </button>

              {scriptFailed && (
                <p className="mt-2 text-sm text-red-600">
                  Payment system failed to load. Please check your connection or try later.
                </p>
              )}

              <p className="mt-4 text-sm text-center text-gray-600 md:text-base">
                Your donation is secure and processed via Razorpay.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center px-6 py-5 text-center bg-white shadow-xl rounded-2xl">
                <div className="inline-flex items-center justify-center mb-3 rounded-full w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100">
                  <Heart className="text-orange-600 w-7 h-7" />
                </div>
                <h4 className="mb-1 text-lg font-bold text-gray-900">Secure Payments</h4>
                <p className="text-sm text-gray-600">All transactions are encrypted and secured via Razorpay.</p>
              </div>
              <div className="flex flex-col items-center px-6 py-5 text-center bg-white shadow-xl rounded-2xl">
                <div className="inline-flex items-center justify-center mb-3 rounded-full w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100">
                  <IndianRupee className="text-orange-600 w-7 h-7" />
                </div>
                <h4 className="mb-1 text-lg font-bold text-gray-900">Tax Benefits</h4>
                <p className="text-sm text-gray-600">Get 80G tax exemption certificate for your eligible donations.</p>
              </div>
              <div className="flex flex-col items-center px-6 py-5 text-center bg-white shadow-xl rounded-2xl">
                <div className="inline-flex items-center justify-center mb-3 rounded-full w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100">
                  <Heart className="text-orange-600 w-7 h-7" />
                </div>
                <h4 className="mb-1 text-lg font-bold text-gray-900">100% Utilized</h4>
                <p className="text-sm text-gray-600">Every rupee goes directly towards our charitable causes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          setReceiptData(null);
        }}
        data={receiptData}
      />
    </>
  );
}
