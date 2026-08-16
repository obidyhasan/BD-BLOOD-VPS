"use client";

import { useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  donorName: string;
  profilePhoto?: string | null;
  verifiedDonations: number;
  achievement?: string;
};

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const toBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image generation failed")), "image/png", 0.95);
});

const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number) => {
  let line = "";
  let lineY = y;
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else line = next;
  }
  if (line) ctx.fillText(line, x, lineY);
};

export function DonationShareCard({ donorName, profilePhoto, verifiedDonations, achievement }: Props) {
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  const generate = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable in this browser");

    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#07130f");
    gradient.addColorStop(0.62, "#102b20");
    gradient.addColorStop(1, "#be123c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(1080, 80, 260, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(950, 610, 330, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#fff";
    ctx.font = "800 32px Arial, sans-serif";
    ctx.fillText("BD BLOOD", 70, 75);
    ctx.fillStyle = "#fb7185";
    ctx.font = "700 17px Arial, sans-serif";
    ctx.fillText("CONNECTING LIFE-SAVERS ACROSS BANGLADESH", 70, 105);

    const x = 70, y = 165, size = 220;
    ctx.save();
    ctx.beginPath(); ctx.arc(x + 110, y + 110, 110, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "#ecfdf5"; ctx.fillRect(x, y, size, size);
    let imageDrawn = false;
    if (profilePhoto) {
      try {
        const image = await loadImage(profilePhoto);
        const scale = Math.max(size / image.width, size / image.height);
        const w = image.width * scale, h = image.height * scale;
        ctx.drawImage(image, x + (size - w) / 2, y + (size - h) / 2, w, h);
        imageDrawn = true;
      } catch { imageDrawn = false; }
    }
    if (!imageDrawn) {
      ctx.fillStyle = "#047857"; ctx.font = "800 76px Arial, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(donorName.trim().charAt(0).toUpperCase() || "B", x + 110, y + 138); ctx.textAlign = "left";
    }
    ctx.restore();
    ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(x + 110, y + 110, 114, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = "#fff"; ctx.font = "800 50px Arial, sans-serif";
    wrapText(ctx, donorName, 350, 195, 720, 58);
    ctx.fillStyle = "#a7f3d0"; ctx.font = "700 24px Arial, sans-serif";
    ctx.fillText(`${verifiedDonations} VERIFIED DONATION${verifiedDonations === 1 ? "" : "S"}`, 350, 290);
    if (achievement) {
      ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.roundRect(350, 325, 590, 60, 18); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "700 21px Arial, sans-serif"; ctx.fillText(`Achievement: ${achievement}`, 375, 363);
    }
    ctx.fillStyle = "#fff"; ctx.font = "700 29px Arial, sans-serif";
    wrapText(ctx, "আমি রক্ত দিয়েছি — আপনিও জীবন বাঁচাতে এগিয়ে আসুন।", 350, 445, 720, 40);
    ctx.fillStyle = "#d1fae5"; ctx.font = "500 20px Arial, sans-serif";
    ctx.fillText("Donate blood. Give hope. Save a life.", 350, 535);
    ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = "600 16px Arial, sans-serif"; ctx.fillText("bdblood.org", 70, 575);
    return toBlob(canvas);
  };

  const saveBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bd-blood-${donorName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "donor"}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const download = async () => {
    setBusy("download");
    try { saveBlob(await generate()); toast.success("Share card downloaded"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not generate the card"); }
    finally { setBusy(null); }
  };

  const share = async () => {
    setBusy("share");
    try {
      const blob = await generate();
      const file = new File([blob], "bd-blood-donation.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "My BD Blood donation journey", text: "I donated blood with BD Blood.", files: [file] });
      } else { saveBlob(blob); toast.info("File sharing is unavailable here, so the card was downloaded."); }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) toast.error(error instanceof Error ? error.message : "Could not share the card");
    } finally { setBusy(null); }
  };

  return (
    <section className="rounded-[2.5rem] border border-primary/15 bg-gradient-to-br from-emerald-950 to-rose-900 p-7 text-white md:p-9">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">Donation Share Card</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight">Turn your verified impact into a shareable image.</h3>
          <p className="mt-2 max-w-2xl text-sm text-white/70">Generated locally in your browser with a download fallback.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={download} disabled={busy !== null}>
            {busy === "download" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />} Download
          </Button>
          <Button type="button" onClick={share} disabled={busy !== null} className="bg-emerald-500 text-white hover:bg-emerald-400">
            {busy === "share" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Share2 className="mr-2 size-4" />} Share
          </Button>
        </div>
      </div>
    </section>
  );
}
