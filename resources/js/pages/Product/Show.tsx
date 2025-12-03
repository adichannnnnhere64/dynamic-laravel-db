import React from "react";
import { useForm } from "@inertiajs/react";
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
import { Head } from "@inertiajs/react";

type Props = {
  product: Record<string, any>;
  editableFields: string[];
  idField: string;
  inputTypes?: Record<string, string>;
  connectionId: number; // Important: to know which DB to update
};

export default function ProductShow({
  product,
  editableFields,
  idField,
  inputTypes = {},
  connectionId,
}: Props) {
  // Initialize form with product data + connection_id
  const { data, setData, post, processing, errors } = useForm({
    connection_id: connectionId,
    [idField]: product[idField] ?? "",
    ...Object.fromEntries(
      editableFields.map((field) => [field, product[field] ?? ""])
    ),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/product/update'); // Uses Laravel named route
  };

  return (
    <AppLayout>
      <Head title="Edit Product" />

      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hidden connection_id */}
              <input type="hidden" name="connection_id" value={connectionId} />

              {/* Primary Key (Read-only) */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={idField} className="text-right">
                  {idField}
                </Label>
                <Input
                  id={idField}
                  value={data[idField] ?? ""}
                  className="col-span-3"
                  disabled
                />
              </div>

              {/* Editable Fields */}
              {editableFields.map((field) => (
                <div key={field} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={field} className="text-right">
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
                      <p className="text-red-500 text-sm mt-1">{errors[field]}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                  {processing ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
