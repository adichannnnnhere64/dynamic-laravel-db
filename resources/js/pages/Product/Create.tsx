import React from "react";
import { useForm, Head } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  editableFields: string[];
  idField: string;
  inputTypes?: Record<string, string>;  // This replaces the broken `inputs`
  connectionId: number;                 // Required to know which DB/table to insert into
};

export default function ProductCreate({
  editableFields,
  idField,
  inputTypes = {},        // default empty object = never undefined
  connectionId,
}: Props) {
  const { data, setData, post, processing, errors } = useForm({
    connection_id: connectionId,
    connection: connectionId,
    conn: connectionId,
    [idField]: "",
    ...Object.fromEntries(editableFields.map((field) => [field, ""])),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/product/store'); // or "/product/store" if no named route
  };

  return (
    <AppLayout>
      <Head title="Create Product" />

      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Product</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hidden connection_id */}
              <input type="hidden" name="connection_id" value={connectionId} />

              {/* Primary Key Field */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={idField} className="text-right font-medium">
                  {idField} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={idField}
                  name={idField}
                  value={data[idField] ?? ""}
                  onChange={(e) => setData(idField, e.target.value)}
                  placeholder={`Enter ${idField}`}
                  className="col-span-3"
                  required
                />
              </div>

              {/* Editable Fields */}
              {editableFields.map((field) => (
                <div key={field} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={field} className="text-right font-medium">
                    {field}
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id={field}
                      type={inputTypes[field] || "text"}
                      value={data[field] ?? ""}
                      onChange={(e) => setData(field, e.target.value)}
                      placeholder={`Enter ${field}`}
                      className="w-full"
                    />
                    {errors[field] && (
                      <p className="text-sm text-red-600 mt-1">{errors[field]}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={processing} size="lg">
                  {processing ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
