import React from "react";
import { useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  editableFields: string[];
  inputs: Record<string, string>;
  idField: string;
};

export default function ProductCreate({ editableFields, inputs, idField }: Props) {
  const { data, setData, post, processing } = useForm(() => {
    const initial: Record<string, any> = {};
    editableFields.forEach((f) => {
      initial[f] = "";
    });
    initial[idField] = "";
    return initial;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    post("/product/store");
  }

  return (
    <AppLayout>
      <div className="p-6 w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ID Field */}
              <div>
                <Label htmlFor={idField}>{idField}</Label>
                <Input
                  id={idField}
                  value={data[idField]}
                  onChange={(e) => setData(idField, e.target.value)}
                  placeholder={`Enter ${idField}`}
                />
              </div>

              {/* Editable Fields */}
              {editableFields.map((f) => (
                <div key={f}>
                  <Label htmlFor={f}>{f}</Label>
                  <Input
                    id={f}
                    type={inputs[f] ?? "text"}
                    value={data[f]}
                    onChange={(e) => setData(f, e.target.value)}
                    placeholder={`Enter ${f}`}
                  />
                </div>
              ))}

              <Button type="submit" disabled={processing} className="w-full">
                {processing ? "Saving..." : "Save"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

