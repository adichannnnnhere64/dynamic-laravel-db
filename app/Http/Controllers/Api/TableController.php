<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DbConnection;
use App\Services\DynamicDatabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TableController extends Controller
{
    protected $dbService;

    public function __construct(DynamicDatabaseService $dbService)
    {
        $this->dbService = $dbService;
    }

    /**
     * Get columns for a specific table
     */
    public function getColumns($connectionId, $tableName)
    {
        try {
            // Get connection
            $connection = DbConnection::where('id', $connectionId)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            // Connect to database
            $dbConn = $this->dbService->connect($connection->connection_config);

            // Get columns information
            $columns = $dbConn->select("SHOW COLUMNS FROM `{$tableName}`");

            // Format response
            $formattedColumns = array_map(function($column) {
                return [
                    'Field' => $column->Field,
                    'Type' => $column->Type,
                    'Null' => $column->Null,
                    'Key' => $column->Key,
                    'Default' => $column->Default,
                    'Extra' => $column->Extra,
                ];
            }, $columns);

            return response()->json([
                'success' => true,
                'columns' => $formattedColumns,
                'count' => count($columns),
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Connection not found or access denied',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to fetch columns', [
                'connection_id' => $connectionId,
                'table' => $tableName,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test connection to a specific table
     */
    public function testConnection($connectionId, $tableName)
    {
        try {
            // Get connection
            $connection = DbConnection::where('id', $connectionId)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            // Connect to database
            $dbConn = $this->dbService->connect($connection->connection_config);

            // Test if table exists
            $tableExists = $dbConn->select("SHOW TABLES LIKE '{$tableName}'");

            if (empty($tableExists)) {
                return response()->json([
                    'success' => false,
                    'message' => "Table '{$tableName}' does not exist in the database",
                ], 404);
            }

            // Get row count
            $rowCount = $dbConn->table($tableName)->count();

            // Get some sample data
            $sampleData = $dbConn->table($tableName)->limit(5)->get();

            return response()->json([
                'success' => true,
                'message' => "Successfully connected to table '{$tableName}'",
                'rowCount' => $rowCount,
                'sampleCount' => count($sampleData),
                'sample' => $sampleData,
                'tableExists' => true,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection not found or access denied',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Table connection test failed', [
                'connection_id' => $connectionId,
                'table' => $tableName,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get preview of table data
     */
    public function getPreview($connectionId, $tableName)
    {
        try {
            // Get connection
            $connection = DbConnection::where('id', $connectionId)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            // Connect to database
            $dbConn = $this->dbService->connect($connection->connection_config);

            // Get columns
            $columns = $dbConn->select("SHOW COLUMNS FROM `{$tableName}`");
            $columnNames = array_column($columns, 'Field');

            // Get sample data (first 10 rows)
            $data = $dbConn->table($tableName)
                ->select($columnNames)
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'columns' => $columnNames,
                'data' => $data,
                'totalColumns' => count($columns),
                'sampleRows' => count($data),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all tables for a connection
     */
    public function getTables($connectionId)
    {
        try {
            // Get connection
            $connection = DbConnection::where('id', $connectionId)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            // Connect to database
            $dbConn = $this->dbService->connect($connection->connection_config);

            // Get all tables
            $tables = $dbConn->select('SHOW TABLES');

            $tableNames = [];
            foreach ($tables as $table) {
                $tableName = $table->{'Tables_in_' . $connection->database};
                $tableNames[] = $tableName;
            }

            // Get row counts for each table
            $tableInfo = [];
            foreach ($tableNames as $tableName) {
                try {
                    $rowCount = $dbConn->table($tableName)->count();
                    $tableInfo[] = [
                        'name' => $tableName,
                        'rowCount' => $rowCount,
                    ];
                } catch (\Exception $e) {
                    $tableInfo[] = [
                        'name' => $tableName,
                        'rowCount' => 0,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'tables' => $tableInfo,
                'totalTables' => count($tableNames),
                'database' => $connection->database,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
