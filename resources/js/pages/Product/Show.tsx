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

type Product = {
  product_code: string;
  name: string;
  age: number;
  country: string;
};

export default function ProductShow({ product }: { product: Product }) {
  const { data, setData, post, processing } = useForm({
    code: product.product_code,
    name: product.name,
    age: product.age,
    country: product.country,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    post("/product/update");
  }

  return (
    <AppLayout>
      <div className="w-full mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="product_code">product_code</Label>
                <Input
                  id="product_code"
                  value={data.code}
                  // onChange={(e) => setData("code", e.target.value)}
                  placeholder="Enter product product_code"
                />
              </div>

              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={data.age}
                  onChange={(e) =>
                    setData("age", e.target.valueAsNumber || 0)
                  }
                  placeholder="Enter age"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={data.country}
                  onChange={(e) => setData("country", e.target.value)}
                  placeholder="Enter country"
                />
              </div>

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

