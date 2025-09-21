<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Connection;

class DynamicDatabaseService
{
    public function connect(array $config): Connection
    {
        $connectionName = 'dynamic_mysql';

        config([
            "database.connections.{$connectionName}" => [
                'driver' => 'mysql',
                'host' => $config['host'],
                'database' => $config['database'],
                'username' => $config['username'],
                'password' => @$config['password'] ?? '',
                'charset'   => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix'    => '',
                'strict'    => false,
            ]
        ]);

        return DB::connection($connectionName);
    }
}

