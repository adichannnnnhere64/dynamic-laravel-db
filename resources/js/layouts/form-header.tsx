import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Database, Grid3x3 } from "lucide-react";
import { Link } from "@inertiajs/react";

interface FormHeaderProps {
  title: string;
  description?: string;
  connection: {
    id: number;
    name: string;
  };
  table: {
    id: number;
    name: string;
    table_name: string;
    primary_key: string;
  };
  connections?: Array<{
    id: number;
    name: string;
    tables: Array<{
      id: number;
      name: string;
    }>;
  }>;
  onConnectionChange?: (connId: string) => void;
  onTableChange?: (tableId: string) => void;
  showSwitchers?: boolean;
  backUrl?: string;
  action?: React.ReactNode;
}

export function FormHeader({
  title,
  description,
  connection,
  table,
  connections = [],
  onConnectionChange,
  onTableChange,
  showSwitchers = false,
  backUrl,
  action,
}: FormHeaderProps) {
  return (
    <div className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => backUrl ? window.location.href = backUrl : window.history.back()}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Grid3x3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Database className="w-3 h-3 mr-1" />
                    {connection.name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <Grid3x3 className="w-3 h-3 mr-1" />
                    {table.name}
                  </span>
                  {description && (
                    <>
                      <span>•</span>
                      <span>{description}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {showSwitchers && connections.length > 0 && (
              <>
                <Select
                  value={connection.id.toString()}
                  onValueChange={onConnectionChange}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>{connection.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={table.id.toString()}
                  onValueChange={onTableChange}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>{table.name}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {connections.find(c => c.id.toString() === connection.id.toString())?.tables.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Grid3x3 className="w-4 h-4" />
                          {t.name}
                        </div>
                      </SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </>
            )}
            {action}
          </div>
        </div>
      </div>
    </div>
  );
}
