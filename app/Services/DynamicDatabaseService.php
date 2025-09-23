<?php

namespace App\Services;

use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;

class DynamicDatabaseService
{
    public function connect(array $config): Connection
    {
        $connectionName = 'dynamic_mysql';

        config([
            "database.connections.{$connectionName}" => [
                'driver' => 'mysql',
                'host' => @$config['host'] ?? '127.0.0.1',
                'port' => @$config['port'] ?? '3306',
                'database' => @$config['database'] ?? 'default',
                'username' => @$config['username'] ?? 'root',
                'password' => @$config['password'] ?? '', // remove the @ and fallback
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => false,
            ],
        ]);

        return DB::connection($connectionName);
    }
}
