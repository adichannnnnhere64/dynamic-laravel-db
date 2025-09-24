import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { router } from "@inertiajs/react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Product {
  [key: string]: any;
}

interface Pagination<T> {
  data: T[];
  current_page: number;
  last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
  products: Pagination<Product>;
  fields: string[];
  idField: string;
}

export default function Index({ products, fields, idField }: Props) {
  const [search, setSearch] = useState("");

  const handleSearch = (value: string) => {
    setSearch(value);
    router.get(
      "/product",
      { search: value },
      {
        preserveState: true,
        replace: true,
      }
    );
  };

  return (
    <AppLayout>
      <div className="p-6 w-full mx-auto">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-xl font-bold">Products</CardTitle>
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <Input
                type="text"
                placeholder={`Search by ${fields.join(", ")}`}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => router.visit("/product/create")}
                className="whitespace-nowrap"
              >
                + Create
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {fields.map((f) => (
                    <TableHead key={f} className="capitalize">
                      {f.replace(/_/g, " ")}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.data.length > 0 ? (
                  products.data.map((p, i) => (
                    <TableRow key={i}>
                      {fields.map((f) => (
                        <TableCell key={f}>{p[f]}</TableCell>
                      ))}
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          onClick={() =>
                            router.visit(`/product/search`, {
                              method: "post",
                              data: { [idField]: p[idField] },
                            })
                          }
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={fields.length + 1}
                      className="text-center text-gray-500"
                    >
                      No products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {products.links.map((link, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant={link.active ? "default" : "outline"}
                  disabled={!link.url}
                  onClick={() => link.url && router.visit(link.url)}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

