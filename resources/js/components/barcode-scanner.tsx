import { BrowserMultiFormatReader } from "@zxing/browser";
import { QrCode } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "./ui/button";

const reader = new BrowserMultiFormatReader();

function preprocess(img, threshold = 140) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; const bw = gray >
            threshold ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = bw;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

export default function BarcodeScanner({onResult}) {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    async function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        setResult(null);
        setError(null);

        const img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();

        const passes = [
            () => preprocess(img, 120),
            () => preprocess(img, 150),
            () => {
                const c = preprocess(img, 140);
                c.width *= 1.3;
                c.height *= 1.3;
                return c;
            },
            () => {
                const c = preprocess(img, 140);
                c.width *= 0.7;
                c.height *= 0.7;
                return c;
            },
        ];

        for (const pass of passes) {
            try {
                const res = await reader.decodeFromCanvas(pass());
                setResult(res.text);
                onResult(res.text)
                return;
            } catch { }
        }

        setError("No barcode detected (Try a more clear image).");
    }


      const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

    return (
        <div style={{ padding: 20 }}>

            <input type="file" accept="image/*" capture="environment" onChange={handleFile} ref={fileInputRef} style={{
                display: "none"
            }}  />
            <Button variant="outline" className="gap-2" onClick={triggerFileInput}>
                <QrCode className="w-4 h-4" />
                Scan Barcode
            </Button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}
