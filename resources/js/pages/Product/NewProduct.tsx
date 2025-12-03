import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import AppLayout from "@/layouts/app-layout";

export default function Index({
    products,
    connections,
    activeConnection,
    activeTable,
    fields,
    idField,
    editableFields,
    inputTypes
}: any) {
    const [search, setSearch] = useState("");

    const switchConnection = (connId: string) => {
        router.get('/product', { conn: connId }, { preserveState: true });
    };

    const switchTable = (tableId: string) => {
        router.get('/product', { conn: activeConnection.id, table: tableId }, { preserveState: true });
    };

    const goToEdit = (id: string) => {
        router.post('/product/search', {
            table_id: activeTable.id,
            [idField]: id
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("Delete this item?")) return;
        router.delete('/product/delete', {
            data: {
                table_id: activeTable.id,
                [idField]: id
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Products" />

            <div className="max-w-7xl mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Products</h1>
                    <div className="flex gap-4">
                        <Select value={activeConnection.id.toString()} onValueChange={switchConnection}>
                            <SelectTrigger className="w-64">
                                <SelectValue>{activeConnection.name}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {connections.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={activeTable.id.toString()} onValueChange={switchTable}>
                            <SelectTrigger className="w-64">
                                <SelectValue>{activeTable.name}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {activeConnection.tables.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id.toString()}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Search */}
                <div className="flex gap-2 mb-4">
                    <Input
                        placeholder={`Search in ${fields.join(", ")}`}
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            router.get('/product', {
                                search: e.target.value,
                                conn: activeConnection.id,
                                table: activeTable.id
                            }, { preserveState: true });
                        }}
                    />
                    <Button asChild>
                        <a href={`/product/create?conn=${activeConnection.id}&table=${activeTable.id}`}>
                            + Add New
                        </a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a href={`/connect/${activeConnection.id}/tables`}>
                            Manage Tables
                        </a>
                    </Button>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded shadow overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                {fields.map((f: string) => (
                                    <th key={f} className="px-4 py-3 text-left">{f}</th>
                                ))}
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.map((p: any, i: number) => (
                                <tr key={i} className="border-t">
                                    {fields.map((f: string) => (
                                        <td key={f} className="px-4 py-3">{p[f] || ''}</td>
                                    ))}
                                    <td className="px-4 py-3 space-x-2">
                                        <Button size="sm" onClick={() => goToEdit(p[idField])}>
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(p[idField])}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {products.links && products.links.length > 3 && (
                    <div className="mt-4 flex justify-center">
                        <nav className="flex gap-1">
                            {products.links.map((link: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => router.get(link.url, {}, { preserveState: true })}
                                    className={`px-3 py-1 rounded ${
                                        link.active
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </nav>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
