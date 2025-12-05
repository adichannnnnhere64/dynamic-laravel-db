<?php

namespace App\Http\Controllers;

use App\Models\DbConnection;
use App\Models\ConnectionTable;
use App\Services\DynamicDatabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductController extends Controller
{
    protected $db;

    public function __construct(DynamicDatabaseService $db)
    {
        $this->db = $db;
    }

    // Show connection form
    public function showConnectForm()
    {
        $connections = auth()->user()->dbConnections()->with('tables')->get();

        return Inertia::render('Connection/Index', [
            'connections' => $connections,
            'editConnection' => null,
        ]);
    }

    // Save connection (without tables)
    public function connect(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'host' => 'required|string',
            'port' => 'required|integer',
            'database' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
        ]);

        $connection = auth()->user()->dbConnections()->updateOrCreate(
            ['id' => $request->id],
            $request->only(['name', 'host', 'port', 'database', 'username', 'password'])
        );

        return redirect()->route('connection.tables', $connection->id)
            ->with('success', 'Connection saved! Now add tables.');
    }

    // Show tables for a connection
    public function showTables($connectionId)
    {
        $connection = auth()->user()->dbConnections()->with('tables')->findOrFail($connectionId);

        // Fetch actual tables from database
        $actualTables = [];

        try {
    $dbConn = $this->db->connect($connection->connection_config);
    $tables = $dbConn->select('SHOW TABLES');

    foreach ($tables as $table) {
        $tableName = $table->{'Tables_in_' . $connection->database};
        $actualTables[] = $tableName;
    }
} catch (\Exception $e) {
    // Log the error for debugging
    \Log::error('Database Connection Failed', [
        'connection_id' => $connectionId,
        'user_id' => auth()->id(),
        'error' => $e->getMessage(),
        'config' => $connection->connection_config // Be cautious with logging credentials
    ]);

    // Return user-friendly error
    return back()->withErrors([
        'message' => 'Cannot connect to database. Please check your credentials.',
        'details' => $e->getMessage() // Only in development
    ]);
}


        return Inertia::render('Connection/Tables', [
            'connection' => $connection,
            'actualTables' => $actualTables,
        ]);
    }

    // Save/Update table configuration

    public function saveTable(Request $request, $connectionId)
{
    $request->validate([
        'table_name' => 'required|string',
        'name' => 'required|string|max:255',
        'primary_key' => 'required|string',
        'fields' => 'required|array|min:1',
        'fields.*' => 'required|string',
        'editable_fields' => 'nullable|array',
        'input_types' => 'nullable|array',
    ]);

    $connection = DbConnection::findOrFail($connectionId);

    // Connect to dynamic MySQL
    $dbConn = $this->db->connect($connection->connection_config);

    $table = $request->table_name;

    // FIXED — check table exists on the correct connection

        $exists = $dbConn->select("
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
", [$connection->database, $request->table_name]);


    if (empty($exists)) {
        return back()->with('error', "Table '$table' does not exist in database.");
    }

    // Fetch actual columns safely
    $columns = $dbConn->select("DESCRIBE `$table`");
    $actualColumns = array_column($columns, 'Field');

    // Validate requested fields
    $invalidFields = array_diff($request->fields, $actualColumns);
    if (!empty($invalidFields)) {
        return back()->with('error', 'Fields not found: ' . implode(', ', $invalidFields));
    }

        /* dd($table,$connectionId, ConnectionTable::where([ */
        /*     'db_connection_id' => $connectionId, */
        /*     'table_name' => $table */
        /* ])->first()); */

    // Save table configuration
    ConnectionTable::updateOrCreate(
        [
            'db_connection_id' => $connectionId,
            'table_name' => $table,
        ],
        [
            'name' => $request->name,
            'primary_key' => $request->primary_key,
            'fields' => $request->fields,
            'editable_fields' => $request->editable_fields ?? [],
            'input_types' => $request->input_types ?? [],
        ]
    );

    return back()->with('success', 'Table configuration saved!');
}


    // Main product list - now supports multiple tables per connection

    public function index(Request $request)
{
    $connections = auth()->user()->dbConnections()->with('tables')->get();

    if ($connections->isEmpty()) {
        return redirect()->route('connect.form');
    }

    $connectionId = $request->query('conn') ?? $connections->first()->id;
    $tableId = $request->query('table') ?? null;

    $connection = $connections->find($connectionId) ?? $connections->first();

    // Get active table
    if ($tableId) {
        $activeTable = $connection->tables()->find($tableId);
    } else {
        $activeTable = $connection->tables()->first();
    }

    if (!$activeTable) {
        return redirect()->route('connection.tables', $connection->id)
            ->with('error', 'No tables configured for this connection.');
    }

    try {
        $dbConn = $this->db->connect($connection->connection_config);
        $query = $dbConn->table($activeTable->table_name);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search, $activeTable) {
                foreach ($activeTable->fields as $field) {
                    $q->orWhere($field, 'like', "%{$search}%");
                }
            });
        }

        $products = $query->paginate(15)->withQueryString();

        return Inertia::render('Product/Index', [
            'products' => $products,
            'connections' => $connections,
            'activeConnection' => $connection,
            'activeTable' => $activeTable, // Make sure this is passed
            'fields' => $activeTable->fields,
            'idField' => $activeTable->primary_key,
            'editableFields' => $activeTable->editable_fields,
            'inputTypes' => $activeTable->input_types ?? [],
        ]);

    } catch (\Exception $e) {
        return back()->with('error', 'Failed to connect: ' . $e->getMessage());
    }
}

    // Show create form

    // In ProductController.php - create method
public function create(Request $request)
{
    $connections = auth()->user()->dbConnections()->with('tables')->get();

    if ($connections->isEmpty()) {
        return redirect()->route('connect.form');
    }

    $connectionId = $request->query('conn') ?? $connections->first()->id;
    $tableId = $request->query('table') ?? null;

    $connection = $connections->find($connectionId) ?? $connections->first();

    if ($tableId) {
        $table = ConnectionTable::with('connection')->find($tableId);
    } else {
        $table = $connection->tables()->first();
    }

    if (!$table) {
        return redirect()->route('connection.tables', $connection->id)
            ->with('error', 'No tables configured for this connection.');
    }

    // Check if primary key is auto-increment
    $primaryKeyAutoIncrement = false;
    try {
        $dbConn = $this->db->connect($table->connection->connection_config);
        $columns = $dbConn->select("SHOW COLUMNS FROM `{$table->table_name}`");

        foreach ($columns as $column) {
            if ($column->Field === $table->primary_key &&
                str_contains($column->Extra, 'auto_increment')) {
                $primaryKeyAutoIncrement = true;
                break;
            }
        }
    } catch (\Exception $e) {
        // If we can't check, assume it's not auto-increment
    }

    return Inertia::render('Product/Create', [
        'connections' => $connections,
        'connection' => $connection,
        'table' => array_merge($table->toArray(), [
            'primary_key_auto_increment' => $primaryKeyAutoIncrement,
        ]),
    ]);
}

    // Store new product

    public function store(Request $request)
{
    $request->validate([
        'table_id' => 'required|exists:connection_tables,id',
        'connection_id' => 'required|exists:db_connections,id',
    ]);

    $table = ConnectionTable::with('connection')->findOrFail($request->table_id);

    if ($table->db_connection_id != $request->connection_id) {
        return back()->with('error', 'Invalid connection for this table.');
    }

    $idField = $table->primary_key;

    // Check if primary key is auto-increment
    $isAutoIncrement = false;
    try {
        $dbConn = $this->db->connect($table->connection->connection_config);
        $columns = $dbConn->select("SHOW COLUMNS FROM `{$table->table_name}`");

        foreach ($columns as $column) {
            if ($column->Field === $idField &&
                str_contains($column->Extra, 'auto_increment')) {
                $isAutoIncrement = true;
                break;
            }
        }
    } catch (\Exception $e) {
        // If we can't check, assume it's not auto-increment
    }

    // Only require primary key if it's NOT auto-increment
    if (!$isAutoIncrement && !$request->has($idField)) {
        return back()->with('error', "The {$idField} field is required.");
    }

    // Prepare data
    $data = [];

    // Add primary key only if provided (for auto-increment, it can be empty)
    if ($request->has($idField) && !empty($request->input($idField))) {
        $data[$idField] = $request->input($idField);
    }

    // Add editable fields
    foreach ($table->editable_fields as $field) {
        if ($request->has($field)) {
            $data[$field] = $request->input($field);
        }
    }

    // Insert into database
    $dbConn->table($table->table_name)->insert($data);

    return redirect()->route('product.index', [
        'conn' => $table->db_connection_id,
        'table' => $table->id
    ])->with('success', 'Product created!');
}

    // Find product for edit
    public function findProduct(Request $request)
    {
        $request->validate([
            'table_id' => 'required|exists:connection_tables,id',
        ]);

        $table = ConnectionTable::with('connection')->findOrFail($request->table_id);
        $idField = $table->primary_key;
        $idValue = $request->input($idField);

        if (!$idValue) {
            return back()->with('error', 'Product ID is required.');
        }

        $dbConn = $this->db->connect($table->connection->connection_config);

        $product = $dbConn->table($table->table_name)
            ->where($idField, $idValue)
            ->first();

        if (!$product) {
            return back()->with('error', 'Product not found.');
        }

        $connections = auth()->user()->dbConnections()->with('tables')->get();
        return Inertia::render('Product/Show', [
            'product' => (array) $product,
            'table' => $table,
            'editableFields' => $table->editable_fields ?? [],
            'inputTypes' => $table->input_types ?? [],
            'connection' => $table->connection,
            'connections' => $connections,
            'idField' => $idField,
            'table_id' => $table->id
        ]);
    }

    // Update product
    public function updateProduct(Request $request)
    {
        $request->validate([
            'table_id' => 'required|exists:connection_tables,id',
        ]);


        $table = ConnectionTable::with('connection')->findOrFail($request->table_id);
        $idField = $table->primary_key;

        if (!$request->has($idField)) {
            return back()->withErrors(["{$idField}" => "The {$idField} field is required."]);
        }

        $dbConn = $this->db->connect($table->connection->connection_config);

        $updateData = $request->only($table->editable_fields ?? []);

        $affected = $dbConn->table($table->table_name)
            ->where($idField, $request->input($idField))
            ->update($updateData);

        return redirect()->route('product.index', [
            'conn' => $table->db_connection_id,
            'table' => $table->id
        ])->with('success', $affected ? 'Product updated successfully!' : 'No changes were made.');
    }

    // Delete product
    public function deleteProduct(Request $request)
    {
        $request->validate([
            'table_id' => 'required|exists:connection_tables,id',
        ]);

        $table = ConnectionTable::with('connection')->findOrFail($request->table_id);
        $idField = $table->primary_key;

        if (!$request->has($idField)) {
            return back()->with('error', "The {$idField} field is required.");
        }

        $dbConn = $this->db->connect($table->connection->connection_config);

        $deleted = $dbConn->table($table->table_name)
            ->where($idField, $request->input($idField))
            ->delete();

        return back()->with($deleted ? 'success' : 'error',
            $deleted ? 'Deleted!' : 'Not found');
    }

    // Delete table configuration
    public function deleteTable($connectionId, $tableId)
    {
        ConnectionTable::where('db_connection_id', $connectionId)
            ->where('id', $tableId)
            ->delete();

        return back()->with('success', 'Table configuration deleted.');
    }

    // Helper: Get active table
    private function getActiveTable($request)
    {
        $tableId = $request->query('table');
        if ($tableId) {
            return ConnectionTable::with('connection')->find($tableId);
        }

        // Try to get from connection
        $connectionId = $request->query('conn') ?? $request->get('conn');
        if ($connectionId) {
            $connection = DbConnection::with('tables')->find($connectionId);
            return $connection->tables->first();
        }


        return null;
    }

    // In ProductController
public function getTableColumns($connectionId, $tableName)
{
    $connection = DbConnection::findOrFail($connectionId);

    try {
        $dbConn = $this->db->connect($connection->connection_config);
        $columns = $dbConn->select("SHOW COLUMNS FROM {$tableName}");


        $columnNames = array_column($columns, 'Field');

        return response()->json([
            'columns' => $columnNames,
            'types' => array_column($columns, 'Type'),
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}



    public function getTableStructure($connectionId, $tableName)
{
    $connection = auth()->user()->dbConnections()->findOrFail($connectionId);

    try {
        $dbConn = $this->db->connect($connection->connection_config);

        // Get detailed column information
        $columns = $dbConn->select("
            SELECT
                COLUMN_NAME as Field,
                COLUMN_TYPE as Type,
                IS_NULLABLE as `Null`,
                COLUMN_KEY as `Key`,
                COLUMN_DEFAULT as `Default`,
                EXTRA as Extra,
                COLUMN_COMMENT as Comment,
                CHARACTER_MAXIMUM_LENGTH as MaxLength,
                NUMERIC_PRECISION as Precision,
                NUMERIC_SCALE as Scale
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        ", [$connection->database, $tableName]);

        // Get table comment and engine
        $tableInfo = $dbConn->select("
            SELECT
                TABLE_COMMENT as Comment,
                ENGINE as Engine,
                TABLE_ROWS as Rows,
                DATA_LENGTH as DataLength,
                INDEX_LENGTH as IndexLength,
                CREATE_TIME as Created
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = ?
        ", [$connection->database, $tableName])[0] ?? null;

        return response()->json([
            'success' => true,
            'columns' => $columns,
            'tableInfo' => $tableInfo,
            'database' => $connection->database,
            'tableName' => $tableName,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'message' => 'Failed to fetch table structure',
        ], 500);
    }
}

/**
 * Quick test connection
 */
public function quickTest($connectionId)
{
    $connection = auth()->user()->dbConnections()->findOrFail($connectionId);

    try {
        $dbConn = $this->db->connect($connection->connection_config);

        // Simple test query
        $dbConn->select('SELECT 1 as test');

        // Get database info
        $version = $dbConn->select('SELECT VERSION() as version')[0]->version;
        $tablesCount = count($dbConn->select('SHOW TABLES'));

        return response()->json([
            'success' => true,
            'message' => 'Connection successful',
            'database' => $connection->database,
            'version' => $version,
            'tablesCount' => $tablesCount,
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Connection failed: ' . $e->getMessage(),
        ], 500);
    }
}



    /*     $table = ConnectionTable::with('connection')->findOrFail($request->table_id); */
    /*     $idField = $table->primary_key; */
    /**/
    /*     if (!$request->has($idField)) { */
    /*         return back()->with('error', "The {$idField} field is required."); */
    /*     } */
    /**/
    /*     $dbConn = $this->db->connect($table->connection->connection_config); */
    /**/
    /*     $deleted = $dbConn->table($table->table_name) */
    /*         ->where($idField, $request->input($idField)) */
    /*         ->delete(); */
    /**/
    /*     return back()->with($deleted ? 'success' : 'error', */
    /*         $deleted ? 'Deleted!' : 'Not found'); */
    /* } */
    /**/
    /**/

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'table_id' => 'required|exists:connection_tables,id',
            'connection_id' => 'required|exists:db_connections,id',
            'rows' => 'required|array|min:1',
        ]);


        $table = ConnectionTable::with('connection')->findOrFail($request->table_id);

        if ($table->connection->user_id != auth()->user()->id) {
            return response()->json([
                'Invalid database'
            ], 401);
        }

        $dbConn = $this->db->connect($table->connection->connection_config);
        $idField = $table->primary_key;

        $deleted = $dbConn->table($table->table_name)
            ->whereIn($idField, $request->rows)
            ->delete();

        return back()->with($deleted ? 'success' : 'error',
            $deleted ? 'Deleted!' : 'Not found');
    }

}
