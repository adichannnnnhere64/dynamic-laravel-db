// resources/js/Pages/ConnectionPage.tsx  (ONLY THIS FILE NEEDS FIXING)
import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { useForm } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default function ConnectionPage() {
    const { data, setData, post, processing, errors } = useForm({
        host: "",
        port: 3306,
        database: "",
        username: "",
        password: "",
        table_name: "",
        primary_key: "",
        fields: [""],
        editable_fields: [],
        input_types: {},
    });

    // Keep local state in sync with Inertia form data
    const [fields, setFields] = useState<string[]>(data.fields);
    const [editableFields, setEditableFields] = useState<string[]>(data.editable_fields || []);

    // Sync back to Inertia data whenever local state changes
    useEffect(() => {
        setData({
            ...data,
            fields,
            editable_fields: editableFields,
        });
    }, [fields, editableFields]);

    const addField = () => setFields([...fields, ""]);
    const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i));
    const updateField = (i: number, value: string) => {
        const newFields = [...fields];
        newFields[i] = value.trim();
        setFields(newFields);
    };
    const toggleEditable = (field: string) => {
        setEditableFields(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const cleaned = fields.filter(f => f.trim() !== "");
        if (cleaned.length === 0) {
            alert("Please add at least one field");
            return;
        }

        // Final sync before submit
        setData({
            ...data,
            fields: cleaned,
            editable_fields: editableFields.filter(f => cleaned.includes(f)),
        });

        post("/connect");
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Connect to Database & Configure Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Host</Label>
                                    <Input value={data.host} onChange={e => setData("host", e.target.value)} placeholder="127.0.0.1" />
                                    {errors.host && <p className="text-red-500 text-sm">{errors.host}</p>}
                                </div>
                                <div>
                                    <Label>Port</Label>
                                    <Input type="number" value={data.port} onChange={e => setData("port", Number(e.target.value))} />
                                    {errors.port && <p className="text-red-500 text-sm">{errors.port}</p>}
                                </div>
                                <div>
                                    <Label>Database</Label>
                                    <Input value={data.database} onChange={e => setData("database", e.target.value)} />
                                    {errors.database && <p className="text-red-500 text-sm">{errors.database}</p>}
                                </div>
                                <div>
                                    <Label>Username</Label>
                                    <Input value={data.username} onChange={e => setData("username", e.target.value)} />
                                    {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
                                </div>
                                <div>
                                    <Label>Password (optional)</Label>
                                    <Input type="password" value={data.password} onChange={e => setData("password", e.target.value)} />
                                </div>
                                <div>
                                    <Label>Table Name</Label>
                                    <Input value={data.table_name} onChange={e => setData("table_name", e.target.value)} placeholder="item" />
                                    {errors.table_name && <p className="text-red-500 text-sm">{errors.table_name}</p>}
                                </div>
                                <div>
                                    <Label>Primary Key</Label>
                                    <Input value={data.primary_key} onChange={e => setData("primary_key", e.target.value)} placeholder="ITEMID" />
                                    {errors.primary_key && <p className="text-red-500 text-sm">{errors.primary_key}</p>}
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">Table Fields</h3>
                                {fields.map((field, i) => (
                                    <div key={i} className="flex gap-3 mb-3 items-center">
                                        <Input
                                            value={field}
                                            onChange={e => updateField(i, e.target.value)}
                                            placeholder="e.g. ITEMID"
                                        />
                                        <label className="flex items-center gap-2 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={editableFields.includes(field)}
                                                onChange={() => toggleEditable(field)}
                                                disabled={!field.trim()}
                                            />
                                            <span className="text-sm">Editable</span>
                                        </label>
                                        {fields.length > 1 && (
                                            <Button type="button" size="icon" variant="ghost" onClick={() => removeField(i)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" onClick={addField} size="sm" variant="outline" className="mb-4">
                                    <Plus className="w-4 h-4 mr-2" /> Add Field
                                </Button>
                                {errors.fields && <p className="text-red-500 text-sm">{errors.fields}</p>}
                            </div>

                            <Button type="submit" disabled={processing} className="w-full">
                                {processing ? "Saving..." : "Save Connection & Table Schema"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
