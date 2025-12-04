import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { useForm, router, Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ConnectionTables({ connection, actualTables }: any) {
    const [showForm, setShowForm] = useState(false);
    const [selectedTable, setSelectedTable] = useState<string>("");
    const [columns, setColumns] = useState<string[]>([]);
    const [editingTable, setEditingTable] = useState<any>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        table_name: "",
        name: "",
        primary_key: "id",
        fields: [] as string[],
        editable_fields: [] as string[],
        input_types: {} as Record<string, string>,
    });

    // Fetch columns when table is selected
    useEffect(() => {
        if (selectedTable) {
            router.get(`/api/connection/${connection.id}/tables/${selectedTable}/columns`, {}, {
                preserveState: true,
                onSuccess: (response) => {
                    setColumns(response.props.columns || []);
                    setData("fields", response.props.columns || []);

                    // Set default editable fields (all except primary key)
                    const editable = response.props.columns.filter((col: string) => col !== data.primary_key);
                    setData("editable_fields", editable);
                }
            });
        }
    }, [selectedTable]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/connect/${connection.id}/tables`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowForm(false);
                setSelectedTable("");
                setEditingTable(null);
            }
        });
    };

    const editTable = (table: any) => {
        setEditingTable(table);
        setShowForm(true);
        setSelectedTable(table.table_name);
        setData({
            table_name: table.table_name,
            name: table.name,
            primary_key: table.primary_key,
            fields: table.fields,
            editable_fields: table.editable_fields || [],
            input_types: table.input_types || {},
        });
    };

    const toggleEditable = (field: string) => {
        const editable = data.editable_fields.includes(field)
            ? data.editable_fields.filter(f => f !== field)
            : [...data.editable_fields, field];
        setData("editable_fields", editable);
    };

    const setInputType = (field: string, type: string) => {
        setData("input_types", {
            ...data.input_types,
            [field]: type
        });
    };

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Manage Tables: {connection.name}</h1>
                        <p className="text-gray-600">{connection.database} @ {connection.host}</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Table
                    </Button>
                </div>

                {showForm && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>
                                {editingTable ? `Edit Table: ${editingTable.name}` : "Add New Table"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Select Database Table *</Label>
                                        <select
                                            className="w-full border rounded px-3 py-2"
                                            value={selectedTable}
                                            onChange={e => setSelectedTable(e.target.value)}
                                            required
                                        >
                                            <option value="">-- Select a table --</option>
                                            {actualTables.map((table: string) => (
                                                <option key={table} value={table}>
                                                    {table}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.table_name && <p className="text-red-500 text-sm">{errors.table_name}</p>}
                                    </div>
                                    <div>
                                        <Label>Display Name *</Label>
                                        <Input
                                            value={data.name}
                                            onChange={e => setData("name", e.target.value)}
                                            placeholder="e.g., Products Inventory"
                                            required
                                        />
                                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <Label>Primary Key *</Label>
                                        <Input
                                            value={data.primary_key}
                                            onChange={e => setData("primary_key", e.target.value)}
                                            placeholder="id"
                                            required
                                        />
                                        {errors.primary_key && <p className="text-red-500 text-sm">{errors.primary_key}</p>}
                                    </div>
                                </div>

                                {columns.length > 0 && (
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">Table Fields Configuration</h3>
                                        <div className="space-y-3">
                                            {columns.map((column) => (
                                                <div key={column} className="flex items-center gap-4 p-3 border rounded">
                                                    <div className="flex-1">
                                                        <span className="font-medium">{column}</span>
                                                        {column === data.primary_key && (
                                                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                Primary Key
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.editable_fields.includes(column)}
                                                                onChange={() => toggleEditable(column)}
                                                                disabled={column === data.primary_key}
                                                            />
                                                            <span className="text-sm">Editable</span>
                                                        </label>
                                                        {data.editable_fields.includes(column) && (
                                                            <select
                                                                className="border rounded px-2 py-1 text-sm"
                                                                value={data.input_types[column] || "text"}
                                                                onChange={e => setInputType(column, e.target.value)}
                                                            >
                                                                <option value="text">Text</option>
                                                                <option value="number">Number</option>
                                                                <option value="email">Email</option>
                                                                <option value="date">Date</option>
                                                                <option value="textarea">Text Area</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? "Saving..." : "Save Table Configuration"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowForm(false);
                                            reset();
                                            setEditingTable(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* List of configured tables */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configured Tables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {connection.tables && connection.tables.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Display Name</TableHead>
                                        <TableHead>Table Name</TableHead>
                                        <TableHead>Primary Key</TableHead>
                                        <TableHead>Fields</TableHead>
                                        <TableHead>Editable Fields</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {connection.tables.map((table: any) => (
                                        <TableRow key={table.id}>
                                            <TableCell className="font-medium">{table.name}</TableCell>
                                            <TableCell>{table.table_name}</TableCell>
                                            <TableCell>{table.primary_key}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {table.fields.map((field: string) => (
                                                        <span key={field} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                            {field}
                                                        </span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {(table.editable_fields || []).map((field: string) => (
                                                        <span key={field} className="px-2 py-1 bg-green-100 rounded text-xs">
                                                            {field}
                                                        </span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => editTable(table)}
                                                    >
                                                        <Edit className="w-4 h-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Link
                                                        href={`/product?conn=${connection.id}&table=${table.id}`}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center"
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View Data
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-gray-500">No tables configured yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
