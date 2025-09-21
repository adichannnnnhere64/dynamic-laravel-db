import React from "react";
import AppLayout from "@/layouts/app-layout";
import { router } from "@inertiajs/react";

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
// import { Table } from "lucide-react";

interface Product {
  id: number;
  product_code: string;
  name: string;
  age: number;
  country: string;
}

interface Pagination<T> {
  data: T[];
  current_page: number;
  last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
  products: Pagination<Product>;
}

export default function Index({ products }: Props) {
  return (
    <AppLayout>
      <div className="p-6 w-full mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.product_code}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.age}</TableCell>
                    <TableCell>{p.country}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        onClick={() =>
                          router.visit(`/product/search`, {
                            method: "post",
                            data: { code: p.product_code },
                          })
                        }
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

