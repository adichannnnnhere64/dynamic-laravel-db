import React from "react";
import AppLayout from "@/layouts/app-layout";
import { Link, useForm } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ConnectionPage({ connections }: any) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        host: "",
        port: 3306,
        database: "",
        username: "",
        password: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/connect");
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Database Connection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Connection Name *</Label>
                                    <Input
                                        value={data.name}
                                        onChange={e => setData("name", e.target.value)}
                                        placeholder="My Inventory Database"
                                    />
                                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label>Host *</Label>
                                    <Input value={data.host} onChange={e => setData("host", e.target.value)} placeholder="127.0.0.1" />
                                    {errors.host && <p className="text-red-500 text-sm">{errors.host}</p>}
                                </div>
                                <div>
                                    <Label>Port *</Label>
                                    <Input type="number" value={data.port} onChange={e => setData("port", Number(e.target.value))} />
                                    {errors.port && <p className="text-red-500 text-sm">{errors.port}</p>}
                                </div>
                                <div>
                                    <Label>Database Name *</Label>
                                    <Input value={data.database} onChange={e => setData("database", e.target.value)} />
                                    {errors.database && <p className="text-red-500 text-sm">{errors.database}</p>}
                                </div>
                                <div>
                                    <Label>Username *</Label>
                                    <Input value={data.username} onChange={e => setData("username", e.target.value)} />
                                    {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
                                </div>
                                <div>
                                    <Label>Password</Label>
                                    <Input type="password" value={data.password} onChange={e => setData("password", e.target.value)} />
                                </div>
                            </div>

                            <Button type="submit" disabled={processing} className="w-full">
                                {processing ? "Connecting..." : "Save Connection"}
                            </Button>
                        </form>

                        {/* Existing connections */}
                        {connections && connections.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Existing Connections</h3>
                                <div className="space-y-2">
                                    {connections.map((conn: any) => (
                                        <div key={conn.id} className="flex items-center justify-between p-3 border rounded">
                                            <div>
                                                <h4 className="font-medium">{conn.name}</h4>
                                                <p className="text-sm text-gray-500">{conn.database} @ {conn.host}:{conn.port}</p>
                                            </div>
                                            <div className="space-x-2">
                                                <Link
                                                    href={`/connect/${conn.id}/tables`}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                                >
                                                    Manage Tables ({conn.tables?.length || 0})
                                                </Link>
                                                <Link
                                                    href={`/product?conn=${conn.id}`}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                                >
                                                    View Data
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
