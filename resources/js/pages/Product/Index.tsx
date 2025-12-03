import React, { useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import AppLayout from "@/layouts/app-layout";

type Product = {
    [key: string]: any;
};

interface IndexProps {
    products: { data: Product[]; links: any[] };
    fields: string[];
    idField: string;
}

const BarcodeScanner = ({
    onScan,
    onError,
    active,
}: {
    onScan: (data: string) => void;
    onError: (error: Error) => void;
    active: boolean;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;

        const setupScanner = async () => {
            try {
                if (!(window as any).ZXing) {
                    const script = document.createElement("script");
                    script.src =
                        "https://cdn.jsdelivr.net/npm/@zxing/library@latest/umd/index.min.js";
                    document.head.appendChild(script);

                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                    });
                }

                if (!isMounted || !videoRef.current) return;
                const { BrowserMultiFormatReader } = (window as any).ZXing;

                codeReaderRef.current = new BrowserMultiFormatReader();

                if (active) {
                    const devices = await codeReaderRef.current.listVideoInputDevices();

                    // Try to find the back camera (usually has "back" or "environment" in the label)
                    let selectedDeviceId = devices[0].deviceId;
                    const backCam = devices.find((d: any) =>
                        d.label.toLowerCase().includes("back") ||
                        d.label.toLowerCase().includes("environment")
                    );

                    if (backCam) {
                        selectedDeviceId = backCam.deviceId;
                    }

                    // Start scanner with the chosen camera
                    await codeReaderRef.current.decodeFromVideoDevice(
                        selectedDeviceId,
                        videoRef.current,
                        (result: any, err: any) => {
                            if (result) {
                                onScan(result.getText());
                            }
                            if (err && !(err.name === "NotFoundException")) {
                                onError(err);
                            }
                        }
                    );
                }
            } catch (err: any) {
                onError(err);
            }
        };

        setupScanner();

        return () => {
            isMounted = false;
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
        };
    }, [active, onScan, onError]);

    return (
        <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
        />
    );
};


export default function Index({ products, connections, activeConnection, fields, idField, editableFields, inputs }) {
    const [showScanner, setShowScanner] = useState(false);
    const [search, setSearch] = useState("");

    const switchConnection = (id: string) => {
        router.get('/product', { conn: id }, { preserveState: true });
    };

    const handleScan = (code: string) => {
        setSearch(code);
        router.get('/product', { search: code, conn: activeConnection.id }, { preserveState: true });
        setShowScanner(false);
    };

    const goToEdit = (id: string) => {
        router.visit('/product/search', {
            method: 'post',
            data: { connection_id: activeConnection.id, [idField]: id }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("Delete this item?")) return;
        router.delete('/product/delete', {
            data: { connection_id: activeConnection.id, [idField]: id }
        });
    };

    return (
        <AppLayout>
            <Head title="Products" />

            <div className="max-w-7xl mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Products</h1>
                    <Select value={activeConnection.id.toString()} onValueChange={switchConnection}>
                        <SelectTrigger className="w-64">
                            <SelectValue>{activeConnection.name}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {connections.map(c => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                    {c.name} ({c.table_name})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Search + Scanner */}
                <div className="flex gap-2 mb-4">
                    <input
                        className="flex-1 px-3 py-2 border rounded"
                        placeholder={`Search by ${fields.join(", ")}`}
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            router.get('/product', { search: e.target.value }, { preserveState: true });
                        }}
                    />
                    <Button onClick={() => setShowScanner(true)}>Scan QR</Button>
                    <Button asChild>
                        <a href="/product/create">+ Add New</a>
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-white rounded shadow overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                {fields.map(f => <th key={f} className="px-4 py-3 text-left">{f}</th>)}
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.map((p, i) => (
                                <tr key={i} className="border-t">
                                    {fields.map(f => <td key={f} className="px-4 py-3">{p[f]}</td>)}
                                    <td className="px-4 py-3 space-x-2">

                                        <Button
    size="sm"
    onClick={() => router.post('/product/search', {
        connection_id: activeConnection.id,
        [idField]: p[idField]  // Sends: { connection_id: 5, ITEMID: "ABC123" }
    })}
>
    Edit
</Button>


                                        <Button
    size="sm"
    variant="destructive"
    onClick={ () => window.confirm('are you sure?') && router.delete('/product/delete', {
        data: {
            connection_id: activeConnection.id,
            [idField]: p[idField]
        }
    })}
>
    Delete
</Button>


                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showScanner && (
                    <div className="fixed inset-0 bg-black z-50 flex flex-col">
                        <div className="p-4 bg-black text-white flex justify-between">
                            <h2>Scan QR Code</h2>
                            <button onClick={() => setShowScanner(false)}>×</button>
                        </div>
                        <BarcodeScanner onScan={handleScan} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
