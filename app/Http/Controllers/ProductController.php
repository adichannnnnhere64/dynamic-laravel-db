<?php

namespace App\Http\Controllers;

use App\Models\DbConnection;
use App\Services\DynamicDatabaseService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    protected $db;

    public function __construct(DynamicDatabaseService $db)
    {
        $this->db = $db;
    }

    // 1. Show connection form (if none exist)
    public function showConnectForm()
    {
        $connections = auth()->user()->dbConnections()->get();

        return Inertia::render('Connection/Index', [
            'connections' => $connections,
            'editConnection' => null,
        ]);
    }

    // 2. Save new or update connection
    public function connect(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'host' => 'required|string',
            'port' => 'required|integer',
            'database' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
            'table_name' => 'required|string',
            'primary_key' => 'required|string',
            'fields' => 'required|array|min:1',
            'fields.*' => 'required|string|distinct',
            'editable_fields' => 'nullable|array',
            'editable_fields.*' => 'string',
        ]);

        auth()->user()->dbConnections()->updateOrCreate(
            ['id' => $request->id], // if editing
            [
                'name' => $request->name,
                'host' => $request->host,
                'port' => $request->port,
                'database' => $request->database,
                'username' => $request->username,
                'password' => $request->password,
                'table_name' => $request->table_name,
                'primary_key' => $request->primary_key,
                'fields' => $request->fields,
                'editable_fields' => $request->editable_fields ?? [],
                'input_types' => $request->input_types ?? [],
            ]
        );

        return redirect()->route('product.index')
            ->with('success', 'Connection saved successfully!');
    }

    // 3. Delete a connection
    public function disconnect($id)
    {
        auth()->user()->dbConnections()->where('id', $id)->delete();
        return back()->with('success', 'Connection deleted');
    }

    // 4. Main product list — supports multiple tables
    public function index(Request $request)
    {
        $connections = auth()->user()->dbConnections()->orderBy('name')->get();

        if ($connections->isEmpty()) {
            return redirect()->route('connect.form');
        }

        $activeId = $request->query('conn') ?? $connections->first()->id;
        $active = $connections->find($activeId) ?? $connections->first();

        $dbConn = $this->db->connect($active->only([
            'host', 'port', 'database', 'username', 'password'
        ]));

        try {
            $query = $dbConn->table($active->table_name);

            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search, $active) {
                    foreach ($active->fields as $field) {
                        $q->orWhere($field, 'like', "%{$search}%");
                    }
                });
            }

            $products = $query->paginate(15)->withQueryString();

            return Inertia::render('Product/Index', [
                'products' => $products,
                'connections' => $connections,
                'activeConnection' => $active,
                'fields' => $active->fields,
                'idField' => $active->primary_key,
                'editableFields' => $active->editable_fields,
                'inputTypes' => $active->input_types ?? [],
            ]);
        } catch (\Exception $e) {
            return redirect()->route('connect.form')
                ->with('error', 'Failed to connect: ' . $e->getMessage());
        }
    }

    // 5. Show create form
    public function create(Request $request)
    {
        $conn = $this->getActiveConnection($request);
        if (!$conn) return redirect()->route('product.index');

        return Inertia::render('Product/Create', [
            'connection' => $conn,
            'editableFields' => $conn->editable_fields,
            'inputTypes' => $conn->input_types ?? [],
            'idField' => $conn->primary_key,
        ]);
    }

    public function store(Request $request)
{
    $conn = $this->getActiveConnection($request);
    if (!$conn) return redirect()->route('product.index');

    $idField = $conn->primary_key;

    if (!$request->has($idField)) {
        return back()->with('error', "The {$idField} field is required.");
    }

    $dbConn = $this->db->connect($conn->only(['host','port','database','username','password']));

    $data = $request->only(array_merge($conn->editable_fields, [$idField]));

    $dbConn->table($conn->table_name)->insert($data);

    return redirect()->route('product.index', ['conn' => $conn->id])
        ->with('success', 'Product created!');
}


    // 7. Show edit form — FIXED & CLEAN
public function findProduct(Request $request)
{
    $connectionId = $request->input('connection_id');
    $idValue = $request->input('id'); // fallback if idField is 'id'

    $conn = DbConnection::findOrFail($connectionId);
    $idField = $conn->primary_key;

    // Get the actual ID value using dynamic key
    $idValue = $request->input($idField);

    if (!$idValue) {
        return back()->with('error', 'Product ID is required.');
    }

    $dbConn = $this->db->connect($conn->only(['host', 'port', 'database', 'username', 'password']));

    $product = $dbConn->table($conn->table_name)
        ->where($idField, $idValue)
        ->first();

    if (!$product) {
        return back()->with('error', 'Product not found.');
    }

    return Inertia::render('Product/Show', [
        'product' => (array) $product,
        'connectionId' => $conn->id,
        'editableFields' => $conn->editable_fields ?? [],
        'inputTypes' => $conn->input_types ?? [],
        'idField' => $idField,
    ]);
}

// 8. Update product — FINAL & BULLETPROOF
public function updateProduct(Request $request)
{
    $request->validate([
        'connection_id' => 'required|exists:db_connections,id',
    ]);

    $conn = DbConnection::findOrFail($request->connection_id);
    $idField = $conn->primary_key;

    if (!$request->has($idField)) {
        return back()->withErrors(["{$idField}" => "The {$idField} field is required."]);
    }

    $dbConn = $this->db->connect($conn->only(['host', 'port', 'database', 'username', 'password']));

    $updateData = $request->only($conn->editable_fields ?? []);

    $affected = $dbConn->table($conn->table_name)
        ->where($idField, $request->input($idField))
        ->update($updateData);

    return redirect()
        ->route('product.index', ['conn' => $conn->id])
        ->with('success', $affected ? 'Product updated successfully!' : 'No changes were made.');
}

    // 7. Find product for edit — FINAL FIXED
    //


// 9. Delete product — FINAL FIXED
public function deleteProduct(Request $request)
{
    $connectionId = $request->input('connection_id');
    $conn = DbConnection::findOrFail($connectionId);
    $idField = $conn->primary_key;

    if (!$request->has($idField)) {
        return back()->with('error', "The {$idField} field is required.");
    }

    $dbConn = $this->db->connect($conn->only(['host','port','database','username','password']));

    $deleted = $dbConn->table($conn->table_name)
        ->where($idField, $request->input($idField))
        ->delete();

    return back()->with($deleted ? 'success' : 'error', $deleted ? 'Deleted!' : 'Not found');
}



    // Helper: get active connection from query or first
    private function getActiveConnection($request)
    {
        $id = $request->query('conn') ?? auth()->user()->dbConnections()->first()?->id;
        return $id ? DbConnection::find($id) : null;
    }
}
