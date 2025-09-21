import React from "react";
import AppLayout from "@/layouts/app-layout";
import { useForm } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ConnectionPage() {
    const { data, setData, post, processing, errors } = useForm({
        host: "",
        port: 3306,
        database: "",
        username: "",
        password: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post("/connect");
    };

    return (
        <AppLayout>
            <div className="w-full px-4 mx-auto py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Database Connection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <Label htmlFor="host">Host</Label>
                                <Input
                                    id="host"
                                    type="text"
                                    value={data.host}
                                    onChange={(e) => setData("host", e.target.value)}
                                    placeholder="127.0.0.1"
                                />
                                {errors.host && (
                                    <p className="text-sm text-red-500 mt-1">{errors.host}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="port">Port</Label>
                                <Input
                                    id="port"
                                    type="number"
                                    value={data.port}
                                    onChange={(e) => setData("port", Number(e.target.value))}
                                    placeholder="3306"
                                />
                                {errors.port && (
                                    <p className="text-sm text-red-500 mt-1">{errors.port}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="database">Database</Label>
                                <Input
                                    id="database"
                                    type="text"
                                    value={data.database}
                                    onChange={(e) => setData("database", e.target.value)}
                                    placeholder="my_database"
                                />
                                {errors.database && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.database}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData("username", e.target.value)}
                                    placeholder="db_user"
                                />
                                {errors.username && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.username}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    placeholder="********"
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <Button type="submit" disabled={processing} className="w-full">
                                {processing ? "Saving..." : "Save Connection"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

